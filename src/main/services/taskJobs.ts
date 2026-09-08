import { DataScopeError } from '@shared/errors'
import type { TaskPayload } from '@shared/types/task'
import {
  filterDatasetWork,
  generateDatasetWork,
  importDatasetWork
} from './importer'
import { runSpectrumAnalysisWork, runTimeDomainAnalysisWork } from './analysis'
import { taskService } from './tasks'

export function registerTaskWorkers(): void {
  taskService.registerWorker('import', async (payload: TaskPayload, ctx) => {
    if (payload.kind !== 'import') {
      throw new DataScopeError('VALIDATION_ERROR', '任务载荷类型不匹配')
    }
    return importDatasetWork(payload.filePath, payload.format, ctx)
  })
  taskService.registerWorker('generate', async (payload: TaskPayload, ctx) => {
    if (payload.kind !== 'generate') {
      throw new DataScopeError('VALIDATION_ERROR', '任务载荷类型不匹配')
    }
    return generateDatasetWork(payload.request, ctx)
  })
  taskService.registerWorker('filter', async (payload: TaskPayload, ctx) => {
    if (payload.kind !== 'filter') {
      throw new DataScopeError('VALIDATION_ERROR', '任务载荷类型不匹配')
    }
    return filterDatasetWork(payload.request, ctx)
  })
  taskService.registerWorker('analyze', async (payload: TaskPayload, ctx) => {
    if (payload.kind !== 'analyze') {
      throw new DataScopeError('VALIDATION_ERROR', '任务载荷类型不匹配')
    }
    return runTimeDomainAnalysisWork(payload.request, ctx)
  })
  taskService.registerWorker('spectrum', async (payload: TaskPayload, ctx) => {
    if (payload.kind !== 'spectrum') {
      throw new DataScopeError('VALIDATION_ERROR', '任务载荷类型不匹配')
    }
    return runSpectrumAnalysisWork(payload.request, ctx)
  })
}
