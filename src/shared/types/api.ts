import type { AppInfo } from './app'
import type { AppSettings } from './settings'
import type { LogEntry, LogQuery, LogWritePayload } from './log'
import type {
  CreateProjectInput,
  ProjectState,
  UpdateProjectInput
} from './project'
import type { AnalysisRequest, AnalysisResult } from './analysis'
import type {
  ChannelStatistics,
  DatasetInfo,
  SourceFormat,
  ViewportData,
  ViewportRequest
} from './dataset'

export interface OpenFileFilter {
  name: string
  extensions: string[]
}

export interface DataScopeAPI {
  app: {
    getInfo: () => Promise<AppInfo>
    confirmClose: () => Promise<void>
    cancelClose: () => Promise<void>
    onCloseRequested: (handler: () => void) => () => void
  }
  settings: {
    get: () => Promise<AppSettings>
    set: (partial: Partial<AppSettings>) => Promise<AppSettings>
  }
  log: {
    write: (payload: LogWritePayload) => Promise<void>
    query: (query?: LogQuery) => Promise<LogEntry[]>
  }
  dialog: {
    openDirectory: (title?: string) => Promise<string | null>
    openFile: (filters: OpenFileFilter[], title?: string) => Promise<string | null>
    saveFile: (filters: OpenFileFilter[], title?: string) => Promise<string | null>
  }
  project: {
    create: (input: CreateProjectInput) => Promise<ProjectState>
    open: (rootPath?: string) => Promise<ProjectState | null>
    save: () => Promise<ProjectState>
    saveAs: () => Promise<ProjectState>
    close: (action: 'save' | 'discard') => Promise<void>
    getCurrent: () => Promise<ProjectState | null>
    getRecent: () => Promise<string[]>
    clearRecent: () => Promise<void>
    update: (input: UpdateProjectInput) => Promise<ProjectState>
  }
  dataset: {
    import: (filePath: string, format: SourceFormat) => Promise<DatasetInfo>
    list: () => Promise<DatasetInfo[]>
    getInfo: (datasetId: string) => Promise<DatasetInfo>
    getStatistics: (datasetId: string) => Promise<ChannelStatistics[]>
    getViewport: (request: ViewportRequest) => Promise<ViewportData>
    rename: (datasetId: string, name: string) => Promise<DatasetInfo>
    remove: (datasetId: string) => Promise<void>
    analyze: (request: AnalysisRequest) => Promise<AnalysisResult>
  }
}

declare global {
  interface Window {
    datascope: DataScopeAPI
  }
}

export {}
