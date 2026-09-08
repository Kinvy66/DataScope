import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { analyzeTimeDomain } from '@shared/analysis/timeDomain'
import { DataScopeError } from '@shared/errors'
import type { AnalysisRequest, AnalysisResult } from '@shared/types/analysis'
import { datasetRegistry } from './datasetRegistry'
import { logger } from './logger'
import { projectService } from './project'

export async function runTimeDomainAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
  projectService.requireOpen()
  if (!request?.datasetId) {
    throw new DataScopeError('VALIDATION_ERROR', '缺少数据集 ID')
  }

  const dataset = datasetRegistry.get(request.datasetId)
  await logger.write('INFO', 'Analysis Start', 'main', {
    dataset: dataset.name,
    channels: request.channelIds.length,
    startIndex: request.startIndex,
    endIndex: request.endIndex
  })

  const result = analyzeTimeDomain(dataset, request)
  result.outputPath = await saveAnalysisReport(result)

  await logger.write('INFO', 'Analysis Complete', 'main', {
    dataset: dataset.name,
    outputPath: result.outputPath,
    channels: result.channels.length
  })

  return result
}

async function saveAnalysisReport(result: AnalysisResult): Promise<string> {
  const project = projectService.requireOpen()
  const directory = join(project.rootPath, 'analysis')
  await mkdir(directory, { recursive: true })
  const stamp = new Date(result.computedAt).toISOString().replace(/[:.]/g, '-')
  const safeName = result.datasetName.replace(/[<>:"/\\|?*]/g, '_').slice(0, 48) || 'dataset'
  const filePath = join(directory, `${stamp}-${safeName}-time-domain.json`)
  await writeFile(filePath, JSON.stringify(result, null, 2), 'utf8')
  return filePath
}
