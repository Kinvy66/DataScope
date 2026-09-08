import type { DataScopeAPI } from '@shared/types/api'

declare global {
  interface Window {
    datascope: DataScopeAPI
  }
}

export {}
