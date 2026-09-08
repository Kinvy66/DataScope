import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannel } from '@shared/ipc-channels'
import type { DataScopeAPI, OpenFileFilter } from '@shared/types/api'
import type { AppSettings } from '@shared/types/settings'
import type { LogQuery, LogWritePayload } from '@shared/types/log'
import type { CreateProjectInput, UpdateProjectInput } from '@shared/types/project'
import type { AnalysisRequest } from '@shared/types/analysis'
import type { SpectrumRequest } from '@shared/types/spectrum'
import type { GeneratorRequest } from '@shared/types/generator'
import type { MarkerDraft, SourceFormat, ViewportRequest } from '@shared/types/dataset'

const api: DataScopeAPI = {
  app: {
    getInfo: () => ipcRenderer.invoke(IpcChannel.AppGetInfo),
    confirmClose: () => ipcRenderer.invoke(IpcChannel.AppConfirmClose),
    cancelClose: () => ipcRenderer.invoke(IpcChannel.AppCancelClose),
    onCloseRequested: (handler) => {
      const listener = (): void => handler()
      ipcRenderer.on(IpcChannel.AppCloseRequested, listener)
      return () => ipcRenderer.removeListener(IpcChannel.AppCloseRequested, listener)
    }
  },
  settings: {
    get: () => ipcRenderer.invoke(IpcChannel.SettingsGet),
    set: (partial: Partial<AppSettings>) => ipcRenderer.invoke(IpcChannel.SettingsSet, partial)
  },
  log: {
    write: (payload: LogWritePayload) => ipcRenderer.invoke(IpcChannel.LogWrite, payload),
    query: (query?: LogQuery) => ipcRenderer.invoke(IpcChannel.LogQuery, query)
  },
  dialog: {
    openDirectory: (title?: string) => ipcRenderer.invoke(IpcChannel.DialogOpenDirectory, title),
    openFile: (filters: OpenFileFilter[], title?: string) =>
      ipcRenderer.invoke(IpcChannel.DialogOpenFile, filters, title),
    saveFile: (filters: OpenFileFilter[], title?: string) =>
      ipcRenderer.invoke(IpcChannel.DialogSaveFile, filters, title)
  },
  project: {
    create: (input: CreateProjectInput) => ipcRenderer.invoke(IpcChannel.ProjectCreate, input),
    open: (rootPath?: string) => ipcRenderer.invoke(IpcChannel.ProjectOpen, rootPath),
    save: () => ipcRenderer.invoke(IpcChannel.ProjectSave),
    saveAs: () => ipcRenderer.invoke(IpcChannel.ProjectSaveAs),
    close: (action) => ipcRenderer.invoke(IpcChannel.ProjectClose, action),
    getCurrent: () => ipcRenderer.invoke(IpcChannel.ProjectGetCurrent),
    getRecent: () => ipcRenderer.invoke(IpcChannel.ProjectGetRecent),
    clearRecent: () => ipcRenderer.invoke(IpcChannel.ProjectClearRecent),
    update: (input: UpdateProjectInput) => ipcRenderer.invoke(IpcChannel.ProjectUpdate, input)
  },
  dataset: {
    import: (filePath: string, format: SourceFormat) =>
      ipcRenderer.invoke(IpcChannel.DatasetImport, filePath, format),
    list: () => ipcRenderer.invoke(IpcChannel.DatasetList),
    getInfo: (datasetId: string) => ipcRenderer.invoke(IpcChannel.DatasetGetInfo, datasetId),
    getStatistics: (datasetId: string) => ipcRenderer.invoke(IpcChannel.DatasetGetStatistics, datasetId),
    getViewport: (request: ViewportRequest) => ipcRenderer.invoke(IpcChannel.DatasetGetViewport, request),
    rename: (datasetId: string, name: string) =>
      ipcRenderer.invoke(IpcChannel.DatasetRename, datasetId, name),
    remove: (datasetId: string) => ipcRenderer.invoke(IpcChannel.DatasetRemove, datasetId),
    analyze: (request: AnalysisRequest) => ipcRenderer.invoke(IpcChannel.DatasetAnalyze, request),
    analyzeSpectrum: (request: SpectrumRequest) =>
      ipcRenderer.invoke(IpcChannel.DatasetAnalyzeSpectrum, request),
    generate: (request: GeneratorRequest) => ipcRenderer.invoke(IpcChannel.DatasetGenerate, request),
    addMarker: (datasetId: string, draft: MarkerDraft) =>
      ipcRenderer.invoke(IpcChannel.DatasetAddMarker, datasetId, draft),
    updateMarker: (datasetId: string, markerId: string, draft: MarkerDraft) =>
      ipcRenderer.invoke(IpcChannel.DatasetUpdateMarker, datasetId, markerId, draft),
    removeMarker: (datasetId: string, markerId: string) =>
      ipcRenderer.invoke(IpcChannel.DatasetRemoveMarker, datasetId, markerId)
  }
}

contextBridge.exposeInMainWorld('datascope', api)
