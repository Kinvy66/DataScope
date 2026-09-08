import { createWriteStream } from 'node:fs'
import { mkdir, rename, unlink } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { existsSync } from 'node:fs'
import { DataScopeError } from '@shared/errors'
import { mapFsWriteError } from '@shared/exporters/fsError'
import {
  EXPORT_ROW_CHUNK,
  delimiterFor,
  formatDelimitedHeader,
  formatDelimitedRow,
  formatExportNumber,
  resolveExportPlan,
  sampleAt,
  timestampAt
} from '@shared/exporters/serialize'
import { EXPORT_EXTENSIONS, type ExportRequest, type ExportResult } from '@shared/types/export'
import type { TaskContext } from '@shared/types/task'
import { datasetRegistry } from './datasetRegistry'
import { logger } from './logger'
import { projectService } from './project'
import { taskService } from './tasks'

export async function exportDataset(request: ExportRequest): Promise<ExportResult> {
  projectService.requireOpen()
  if (!request?.datasetId) {
    throw new DataScopeError('VALIDATION_ERROR', '缺少数据集 ID')
  }
  const dataset = datasetRegistry.get(request.datasetId)
  return taskService.run<ExportResult>(`导出 ${dataset.name}`, {
    kind: 'export',
    request
  })
}

export async function exportDatasetWork(
  request: ExportRequest,
  ctx: TaskContext
): Promise<ExportResult> {
  if (!request?.datasetId) {
    throw new DataScopeError('VALIDATION_ERROR', '缺少数据集 ID')
  }
  const dataset = datasetRegistry.get(request.datasetId)
  const plan = resolveExportPlan(dataset, request)
  const exportDir = projectService.exportsDirectory()

  const stem =
    (request.fileName ?? dataset.name).replace(/[<>:"/\\|?*]/g, '_').trim().slice(0, 48) || 'export'
  const fileName = uniqueFileName(exportDir, `${stem}${EXPORT_EXTENSIONS[plan.format]}`)
  const filePath = join(exportDir, fileName)
  const tmpPath = `${filePath}.tmp`

  ctx.report(0.04, '准备导出')
  await ctx.checkpoint()
  await logger.write('INFO', 'Export Start', 'main', {
    dataset: dataset.name,
    format: plan.format,
    channels: plan.channels.length,
    samples: plan.range.sampleCount
  })

  let bytesWritten = 0
  try {
    await mkdir(exportDir, { recursive: true })
    if (plan.format === 'json') {
      bytesWritten = await writeJsonExport(dataset, plan, tmpPath, ctx)
    } else {
      bytesWritten = await writeDelimitedExport(dataset, plan, tmpPath, ctx)
    }
    await ctx.checkpoint()
    await rename(tmpPath, filePath)
  } catch (error) {
    await unlink(tmpPath).catch(() => undefined)
    if (error instanceof DataScopeError) throw error
    mapFsWriteError(error, filePath)
  }

  const result: ExportResult = {
    name: fileName,
    filePath,
    relativePath: `exports/${fileName}`,
    format: plan.format,
    sampleCount: plan.range.sampleCount,
    channelCount: plan.channels.length,
    bytesWritten
  }

  await logger.write('INFO', 'File Export', 'main', {
    dataset: dataset.name,
    path: result.relativePath,
    format: plan.format,
    bytes: bytesWritten
  })
  ctx.report(1, `已写入 ${result.relativePath}`)
  return result
}

async function writeDelimitedExport(
  dataset: Parameters<typeof sampleAt>[0],
  plan: ReturnType<typeof resolveExportPlan>,
  tmpPath: string,
  ctx: TaskContext
): Promise<number> {
  const delimiter = delimiterFor(plan.format)
  const header = `${formatDelimitedHeader(
    plan.channels.map((channel) => channel.name),
    delimiter
  )}\n`
  const writer = createChunkWriter(tmpPath)
  try {
    await writer.write(header)
    const total = plan.range.sampleCount
    let batch = ''
    let inBatch = 0
    for (let index = plan.range.startIndex; index <= plan.range.endIndex; index += 1) {
      const values = plan.channels.map((channel) => sampleAt(dataset, channel, index))
      batch += `${formatDelimitedRow(timestampAt(dataset, index), values, delimiter)}\n`
      inBatch += 1
      if (inBatch >= EXPORT_ROW_CHUNK) {
        await ctx.checkpoint()
        await writer.write(batch)
        batch = ''
        inBatch = 0
        const done = index - plan.range.startIndex + 1
        ctx.report(0.08 + (done / total) * 0.84, `写入 ${done.toLocaleString()} / ${total.toLocaleString()} 行`)
      }
    }
    if (batch) {
      await ctx.checkpoint()
      await writer.write(batch)
    }
    return await writer.close()
  } catch (error) {
    writer.destroy()
    throw error
  }
}

async function writeJsonExport(
  dataset: Parameters<typeof sampleAt>[0],
  plan: ReturnType<typeof resolveExportPlan>,
  tmpPath: string,
  ctx: TaskContext
): Promise<number> {
  const writer = createChunkWriter(tmpPath)
  try {
    await writer.write(
      `{"name":${JSON.stringify(plan.name)},"sampleRate":${plan.sampleRate},"startTime":${plan.startTime},"channelNames":${JSON.stringify(plan.channels.map((channel) => channel.name))},"samples":[`
    )
    const total = plan.range.sampleCount
    let firstRow = true
    let batch = ''
    let inBatch = 0
    for (let index = plan.range.startIndex; index <= plan.range.endIndex; index += 1) {
      const values = plan.channels.map((channel) => sampleAt(dataset, channel, index))
      const row = [timestampAt(dataset, index), ...values].map((value) => formatExportNumber(value))
      batch += `${firstRow ? '' : ','}[${row.join(',')}]`
      firstRow = false
      inBatch += 1
      if (inBatch >= EXPORT_ROW_CHUNK) {
        await ctx.checkpoint()
        await writer.write(batch)
        batch = ''
        inBatch = 0
        const done = index - plan.range.startIndex + 1
        ctx.report(0.08 + (done / total) * 0.84, `写入 ${done.toLocaleString()} / ${total.toLocaleString()} 行`)
      }
    }
    if (batch) {
      await ctx.checkpoint()
      await writer.write(batch)
    }
    await writer.write(']}')
    return await writer.close()
  } catch (error) {
    writer.destroy()
    throw error
  }
}

function createChunkWriter(filePath: string): {
  write: (chunk: string) => Promise<void>
  close: () => Promise<number>
  destroy: () => void
} {
  const stream = createWriteStream(filePath, { encoding: 'utf8' })
  let bytes = 0
  let failed: Error | null = null
  stream.on('error', (error) => {
    failed = error
  })

  async function write(chunk: string): Promise<void> {
    if (failed) mapFsWriteError(failed, filePath)
    bytes += Buffer.byteLength(chunk)
    const ok = stream.write(chunk)
    if (ok) return
    await new Promise<void>((resolve, reject) => {
      const onDrain = (): void => {
        cleanup()
        resolve()
      }
      const onError = (error: Error): void => {
        cleanup()
        reject(error)
      }
      const cleanup = (): void => {
        stream.off('drain', onDrain)
        stream.off('error', onError)
      }
      stream.once('drain', onDrain)
      stream.once('error', onError)
    }).catch((error: unknown) => mapFsWriteError(error, filePath))
  }

  async function close(): Promise<number> {
    if (failed) mapFsWriteError(failed, filePath)
    await new Promise<void>((resolve, reject) => {
      stream.end((error: Error | null | undefined) => {
        if (error) reject(error)
        else resolve()
      })
    }).catch((error: unknown) => mapFsWriteError(error, filePath))
    return bytes
  }

  function destroy(): void {
    stream.destroy()
  }

  return { write, close, destroy }
}

function uniqueFileName(directory: string, fileName: string): string {
  if (!existsSync(join(directory, fileName))) return fileName
  const ext = extname(fileName)
  const stem = basename(fileName, ext)
  let index = 1
  while (existsSync(join(directory, `${stem}-${index}${ext}`))) {
    index += 1
  }
  return `${stem}-${index}${ext}`
}
