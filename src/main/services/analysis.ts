import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { analyzeSpectrum } from '@shared/analysis/spectrum'
import { analyzeTimeDomain } from '@shared/analysis/timeDomain'
import { DataScopeError } from '@shared/errors'
import type { AnalysisRequest, AnalysisResult } from '@shared/types/analysis'
import type { SpectrumRequest, SpectrumResult } from '@shared/types/spectrum'
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
    kind: 'time-domain',
    channels: request.channelIds.length,
    startIndex: request.startIndex,
    endIndex: request.endIndex
  })

  const result = analyzeTimeDomain(dataset, request)
  result.outputPath = await saveAnalysisReport(
    result.datasetName,
    'time-domain',
    result.computedAt,
    result
  )

  await logger.write('INFO', 'Analysis Complete', 'main', {
    dataset: dataset.name,
    kind: 'time-domain',
    outputPath: result.outputPath,
    channels: result.channels.length
  })

  return result
}

export async function runSpectrumAnalysis(request: SpectrumRequest): Promise<SpectrumResult> {
  projectService.requireOpen()
  if (!request?.datasetId) {
    throw new DataScopeError('VALIDATION_ERROR', '缺少数据集 ID')
  }

  const dataset = datasetRegistry.get(request.datasetId)
  await logger.write('INFO', 'Analysis Start', 'main', {
    dataset: dataset.name,
    kind: 'spectrum',
    channels: request.channelIds.length,
    fftSize: request.fftSize,
    window: request.window
  })

  const result = analyzeSpectrum(dataset, request)
  result.outputPath = await saveAnalysisReport(
    result.datasetName,
    'spectrum',
    result.computedAt,
    result
  )

  await logger.write('INFO', 'Analysis Complete', 'main', {
    dataset: dataset.name,
    kind: 'spectrum',
    outputPath: result.outputPath,
    peakFrequency: result.channels[0]?.peakFrequency ?? 0
  })

  return result
}

async function saveAnalysisReport(
  datasetName: string,
  kind: string,
  computedAt: number,
  payload: unknown
): Promise<string> {
  const project = projectService.requireOpen()
  const directory = join(project.rootPath, 'analysis')
  await mkdir(directory, { recursive: true })
  const stamp = new Date(computedAt).toISOString().replace(/[:.]/g, '-')
  const safeName = datasetName.replace(/[<>:"/\\|?*]/g, '_').slice(0, 48) || 'dataset'
  const filePath = join(directory, `${stamp}-${safeName}-${kind}.json`)
  await writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8')
  return filePath
}
