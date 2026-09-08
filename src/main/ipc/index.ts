import { BrowserWindow, app, dialog, ipcMain } from 'electron'
import { IpcChannel } from '@shared/ipc-channels'
import { APP_NAME, APP_VERSION } from '@shared/constants'
import { toErrorPayload } from '@shared/errors'
import type { AppInfo } from '@shared/types/app'
import type { AppSettings } from '@shared/types/settings'
import type { LogQuery, LogWritePayload } from '@shared/types/log'
import type { CreateProjectInput, UpdateProjectInput } from '@shared/types/project'
import type { SourceFormat, ViewportRequest } from '@shared/types/dataset'
import { logger } from '../services/logger'
import { settingsService } from '../services/settings'
import { projectService } from '../services/project'
import { datasetRegistry } from '../services/datasetRegistry'
import { importDataset, inferFormatFromPath, loadProjectDatasets, removeDataset } from '../services/importer'

let allowQuit = false

function dialogWindow(): BrowserWindow | undefined {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
}

export function registerIpcHandlers(): void {
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
    return settingsService.set(partial)
  })

  ipcMain.handle(IpcChannel.LogWrite, async (_event, payload: LogWritePayload) => {
    await logger.write(payload.level, payload.message, 'renderer', payload.context)
  })

  ipcMain.handle(IpcChannel.LogQuery, async (_event, query?: LogQuery) => logger.query(query))

  ipcMain.handle(IpcChannel.DialogOpenDirectory, async (_event, title?: string) => {
    const options = {
      title: title ?? '选择目录',
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
      title: title ?? '选择文件',
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
      title: title ?? '保存文件',
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
        const result = window
          ? await dialog.showOpenDialog(window, {
              title: '打开工程',
              properties: ['openDirectory']
            })
          : await dialog.showOpenDialog({
              title: '打开工程',
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

  ipcMain.handle(IpcChannel.DatasetRemove, async (_event, datasetId: string) => {
    return wrap(() => removeDataset(datasetId))
  })
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
    await logger.write('ERROR', payload.message, 'main', {
      code: payload.code
    })
    throw new Error(payload.message)
  }
}
