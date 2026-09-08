export type DataFileFormat = 'csv' | 'txt' | 'json'

export interface ProjectSettings {
  defaultChannelVisible: boolean
  autoFitOnImport: boolean
}

export interface DataFileRef {
  id: string
  name: string
  relativePath: string
  format: DataFileFormat
  sampleRate: number
  channelCount: number
  sampleCount: number
  importedAt: number
}

export interface ProjectMarkerRef {
  id: string
  datasetId: string
  name: string
  time: number
}

export interface ProjectFile {
  version: string
  name: string
  description: string
  createdAt: number
  modifiedAt: number
  sampleRate: number
  channelCount: number
  dataFiles: DataFileRef[]
  markers: ProjectMarkerRef[]
  settings: ProjectSettings
}

export interface ProjectState {
  rootPath: string
  file: ProjectFile
  dirty: boolean
}

export interface CreateProjectInput {
  name: string
  location: string
  description: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  sampleRate?: number
  settings?: Partial<ProjectSettings>
}

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  defaultChannelVisible: true,
  autoFitOnImport: true
}
