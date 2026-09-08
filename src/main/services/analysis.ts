import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { analyzeSpectrum } from '@shared/analysis/spectrum'
import { analyzeTimeDomain } from '@shared/analysis/timeDomain'
import { DataScopeError } from '@shared/errors'
import type { AnalysisRequest, AnalysisResult } from '@shared/types/analysis'
import type { SpectrumRequest, SpectrumResult } from '@shared/types/spectrum'
import type { TaskContext } from '@shared/types/task'
import { datasetRegistry } from './datasetRegistry'
import { logger } from './logger'
import { projectService } from './project'
import { taskService } from './tasks'

export async function runTimeDomainAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
  projectService.requireOpen()
  if (!request?.datasetId) {
    throw new DataScopeError('VALIDATION_ERROR', '缺少数据集 ID')
  }
  const dataset = datasetRegistry.get(request.datasetId)
  return taskService.run<AnalysisResult>(`时域分析 · ${dataset.name}`, {
    kind: 'analyze',
    request
  })
}

export async function runTimeDomainAnalysisWork(
  request: AnalysisRequest,
  ctx: TaskContext
): Promise<AnalysisResult> {
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

  ctx.report(0.05, '准备时域统计')
  const parts: AnalysisResult[] = []
  const total = request.channelIds.length
  for (let index = 0; index < total; index += 1) {
    const channelId = request.channelIds[index]
    if (!channelId) continue
    await ctx.checkpoint()
    ctx.report(0.08 + ((index + 1) / Math.max(total, 1)) * 0.72, `统计通道 ${index + 1}/${total}`)
    parts.push(analyzeTimeDomain(dataset, { ...request, channelIds: [channelId] }))
  }

  const template = parts[0]
  if (!template) {
    throw new DataScopeError('VALIDATION_ERROR', '请至少选择一个通道进行分析')
  }

  const result: AnalysisResult = {
    ...template,
    channels: parts.flatMap((part) => part.channels)
  }

  await ctx.checkpoint()
  ctx.report(0.88, '写入分析文件')
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
  ctx.report(1, '完成')
  return result
}

export async function runSpectrumAnalysis(request: SpectrumRequest): Promise<SpectrumResult> {
  projectService.requireOpen()
  if (!request?.datasetId) {
    throw new DataScopeError('VALIDATION_ERROR', '缺少数据集 ID')
  }
  const dataset = datasetRegistry.get(request.datasetId)
  return taskService.run<SpectrumResult>(`频谱分析 · ${dataset.name}`, {
    kind: 'spectrum',
    request
  })
}

export async function runSpectrumAnalysisWork(
  request: SpectrumRequest,
  ctx: TaskContext
): Promise<SpectrumResult> {
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

  ctx.report(0.05, '准备频谱计算')
  const parts: SpectrumResult[] = []
  const total = request.channelIds.length
  for (let index = 0; index < total; index += 1) {
    const channelId = request.channelIds[index]
    if (!channelId) continue
    await ctx.checkpoint()
    ctx.report(0.08 + ((index + 1) / Math.max(total, 1)) * 0.72, `FFT 通道 ${index + 1}/${total}`)
    parts.push(analyzeSpectrum(dataset, { ...request, channelIds: [channelId] }))
  }

  const template = parts[0]
  if (!template) {
    throw new DataScopeError('VALIDATION_ERROR', '请至少选择一个通道进行频谱分析')
  }

  const result: SpectrumResult = {
    ...template,
    channels: parts.flatMap((part) => part.channels)
  }

  await ctx.checkpoint()
  ctx.report(0.88, '写入分析文件')
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
  ctx.report(1, '完成')
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
