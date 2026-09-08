import { BrowserWindow, app, dialog, ipcMain } from 'electron'
import { IpcChannel } from '@shared/ipc-channels'
import { APP_NAME, APP_VERSION } from '@shared/constants'
import { toErrorPayload } from '@shared/errors'
import { translate } from '@shared/i18n'
import type { AppInfo } from '@shared/types/app'
import type { AppSettings } from '@shared/types/settings'
import type { LogQuery, LogWritePayload } from '@shared/types/log'
import type { CreateProjectInput, UpdateProjectInput } from '@shared/types/project'
import type { AnalysisRequest } from '@shared/types/analysis'
import type { FilterRequest } from '@shared/types/filter'
import type { ExportRequest } from '@shared/types/export'
import type { SpectrumRequest } from '@shared/types/spectrum'
import type { GeneratorRequest } from '@shared/types/generator'
import type { MarkerDraft, SourceFormat, ViewportRequest } from '@shared/types/dataset'
import type { DaqCommand, LiveConfig, LiveViewportRequest } from '@shared/types/live'
import type { TaskCommand } from '@shared/types/task'
import { logger } from '../services/logger'
import { settingsService } from '../services/settings'
import { projectService } from '../services/project'
import { runSpectrumAnalysis, runTimeDomainAnalysis } from '../services/analysis'
import { datasetRegistry } from '../services/datasetRegistry'
import {
  importDataset,
  inferFormatFromPath,
  loadProjectDatasets,
  generateDataset,
  filterDataset,
  removeDataset,
  renameDataset,
  addMarker,
  updateMarker,
  removeMarker
} from '../services/importer'
import { liveService } from '../services/live'
import { exportDataset } from '../services/exporter'
import { registerTaskWorkers } from '../services/taskJobs'
import { taskService } from '../services/tasks'

let allowQuit = false

function dialogWindow(): BrowserWindow | undefined {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
}

export function registerIpcHandlers(): void {
  registerTaskWorkers()
  ipcMain.handle(IpcChannel.AppGetInfo, async (): Promise<AppInfo> => {
    return {
      name: APP_NAME,
      version: APP_VERSION,
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
      platform: process.platform,
      userDataPath: app.getPath('userData')
    }
  })

  ipcMain.handle(IpcChannel.AppConfirmClose, async () => {
    allowQuit = true
    BrowserWindow.getAllWindows().forEach((window) => window.close())
  })

  ipcMain.handle(IpcChannel.AppCancelClose, async () => {
    allowQuit = false
  })

  ipcMain.handle(IpcChannel.SettingsGet, async () => settingsService.get())

  ipcMain.handle(IpcChannel.SettingsSet, async (_event, partial: Partial<AppSettings>) => {
    return wrap(async () => {
      const next = await settingsService.set(partial)
      datasetRegistry.setCacheLimit(next.viewportCacheLimit)
      return next
    })
  })

  ipcMain.handle(IpcChannel.LogWrite, async (_event, payload: LogWritePayload) => {
    await logger.write(payload.level, payload.message, 'renderer', payload.context)
  })

  ipcMain.handle(IpcChannel.LogQuery, async (_event, query?: LogQuery) => logger.query(query))

  ipcMain.handle(IpcChannel.DialogOpenDirectory, async (_event, title?: string) => {
    const options = {
      title: title ?? translate(settingsService.current().language, 'dialog.chooseDirectory'),
      properties: ['openDirectory', 'createDirectory'] as Array<
        'openDirectory' | 'createDirectory'
      >
    }
    const window = dialogWindow()
    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options)
    return result.canceled ? null : result.filePaths[0] ?? null
  })

  ipcMain.handle(IpcChannel.DialogOpenFile, async (_event, filters, title?: string) => {
    const options = {
      title: title ?? translate(settingsService.current().language, 'dialog.chooseFile'),
      properties: ['openFile'] as Array<'openFile'>,
      filters
    }
    const window = dialogWindow()
    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options)
    return result.canceled ? null : result.filePaths[0] ?? null
  })

  ipcMain.handle(IpcChannel.DialogSaveFile, async (_event, filters, title?: string) => {
    const options = {
      title: title ?? translate(settingsService.current().language, 'dialog.saveFile'),
      filters
    }
    const window = dialogWindow()
    const result = window
      ? await dialog.showSaveDialog(window, options)
      : await dialog.showSaveDialog(options)
    return result.canceled ? null : result.filePath ?? null
  })

  ipcMain.handle(IpcChannel.ProjectCreate, async (_event, input: CreateProjectInput) => {
    return wrap(() => projectService.create(input))
  })

  ipcMain.handle(IpcChannel.ProjectOpen, async (_event, rootPath?: string) => {
    return wrap(async () => {
      let target = rootPath
      if (!target) {
        const window = dialogWindow()
        const locale = settingsService.current().language
        const title = translate(locale, 'dialog.openProject')
        const result = window
          ? await dialog.showOpenDialog(window, {
              title,
              properties: ['openDirectory']
            })
          : await dialog.showOpenDialog({
              title,
              properties: ['openDirectory']
            })
        if (result.canceled || !result.filePaths[0]) {
          return null
        }
        target = result.filePaths[0]
      }
      const state = await projectService.open(target)
      await loadProjectDatasets()
      return state
    })
  })

  ipcMain.handle(IpcChannel.ProjectSave, async () => wrap(() => projectService.save()))

  ipcMain.handle(IpcChannel.ProjectSaveAs, async () => wrap(() => projectService.saveAs()))

  ipcMain.handle(IpcChannel.ProjectClose, async (_event, action: 'save' | 'discard') => {
    return wrap(async () => {
      await taskService.cancelAll()
      if (action === 'save' && projectService.getCurrent()) {
        await projectService.save()
      }
      await projectService.close()
    })
  })

  ipcMain.handle(IpcChannel.ProjectGetCurrent, async () => projectService.getCurrent())

  ipcMain.handle(IpcChannel.ProjectGetRecent, async () => {
    const settings = await settingsService.get()
    return settings.recentProjects
  })

  ipcMain.handle(IpcChannel.ProjectClearRecent, async () => settingsService.clearRecent())

  ipcMain.handle(IpcChannel.ProjectUpdate, async (_event, input: UpdateProjectInput) => {
    return wrap(() => projectService.update(input))
  })

  ipcMain.handle(IpcChannel.DatasetImport, async (_event, filePath: string, format?: SourceFormat) => {
    return wrap(() => importDataset(filePath, format ?? inferFormatFromPath(filePath)))
  })

  ipcMain.handle(IpcChannel.DatasetList, async () => datasetRegistry.list())

  ipcMain.handle(IpcChannel.DatasetGetInfo, async (_event, datasetId: string) => {
    return wrap(() => datasetRegistry.getInfo(datasetId))
  })

  ipcMain.handle(IpcChannel.DatasetGetStatistics, async (_event, datasetId: string) => {
    return wrap(() => datasetRegistry.getStatistics(datasetId))
  })

  ipcMain.handle(IpcChannel.DatasetGetViewport, async (_event, request: ViewportRequest) => {
    return wrap(() => datasetRegistry.getViewport(request))
  })

  ipcMain.handle(IpcChannel.DatasetRename, async (_event, datasetId: string, name: string) => {
    return wrap(() => renameDataset(datasetId, name))
  })

  ipcMain.handle(IpcChannel.DatasetRemove, async (_event, datasetId: string) => {
    return wrap(() => removeDataset(datasetId))
  })

  ipcMain.handle(IpcChannel.DatasetAnalyze, async (_event, request: AnalysisRequest) => {
    return wrap(() => runTimeDomainAnalysis(request))
  })

  ipcMain.handle(IpcChannel.DatasetAnalyzeSpectrum, async (_event, request: SpectrumRequest) => {
    return wrap(() => runSpectrumAnalysis(request))
  })

  ipcMain.handle(IpcChannel.DatasetGenerate, async (_event, request: GeneratorRequest) => {
    return wrap(() => generateDataset(request))
  })

  ipcMain.handle(IpcChannel.DatasetFilter, async (_event, request: FilterRequest) => {
    return wrap(() => filterDataset(request))
  })

  ipcMain.handle(IpcChannel.DatasetExport, async (_event, request: ExportRequest) => {
    return wrap(() => exportDataset(request))
  })

  ipcMain.handle(IpcChannel.DatasetAddMarker, async (_event, datasetId: string, draft: MarkerDraft) => {
    return wrap(() => addMarker(datasetId, draft))
  })

  ipcMain.handle(
    IpcChannel.DatasetUpdateMarker,
    async (_event, datasetId: string, markerId: string, draft: MarkerDraft) => {
      return wrap(() => updateMarker(datasetId, markerId, draft))
    }
  )

  ipcMain.handle(
    IpcChannel.DatasetRemoveMarker,
    async (_event, datasetId: string, markerId: string) => {
      return wrap(() => removeMarker(datasetId, markerId))
    }
  )

  ipcMain.handle(IpcChannel.LiveGetStatus, async () => liveService.status())

  ipcMain.handle(IpcChannel.LiveConfigure, async (_event, config: LiveConfig) => {
    return wrap(() => liveService.configure(config))
  })

  ipcMain.handle(IpcChannel.LiveCommand, async (_event, command: DaqCommand) => {
    return wrap(() => liveService.command(command))
  })

  ipcMain.handle(IpcChannel.LiveGetViewport, async (_event, request: LiveViewportRequest) => {
    return wrap(() => liveService.getViewport(request))
  })

  ipcMain.handle(IpcChannel.LiveCapture, async (_event, name: string) => {
    return wrap(() => liveService.capture(name))
  })

  ipcMain.handle(IpcChannel.TaskList, async () => taskService.list())

  ipcMain.handle(IpcChannel.TaskGet, async (_event, taskId: string) => {
    return wrap(() => taskService.get(taskId))
  })

  ipcMain.handle(IpcChannel.TaskCommand, async (_event, taskId: string, command: TaskCommand) => {
    return wrap(() => taskService.command(taskId, command))
  })

  ipcMain.handle(IpcChannel.TaskClearFinished, async () => taskService.clearFinished())
}

export function attachCloseGuard(window: BrowserWindow): void {
  window.on('close', (event) => {
    if (allowQuit) return
    if (!projectService.isDirty()) return
    event.preventDefault()
    window.webContents.send(IpcChannel.AppCloseRequested)
  })
}

async function wrap<T>(factory: () => Promise<T> | T): Promise<T> {
  try {
    return await factory()
  } catch (error) {
    const payload = toErrorPayload(error)
    const level = payload.code === 'TASK_CANCELLED' ? 'INFO' : 'ERROR'
    await logger.write(level, payload.message, 'main', {
      code: payload.code
    })
    throw new Error(payload.message)
  }
}
