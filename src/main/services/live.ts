import { BrowserWindow } from 'electron'
import { downsampleMinMax } from '@shared/algorithms/downsample'
import { DataScopeError } from '@shared/errors'
import { generateChannelRange } from '@shared/generators/waveform'
import { bufferFill, createRingBuffer, linearize, type RingBufferState } from '@shared/live/buffer'
import { liveChannels, validateLiveConfig } from '@shared/live/config'
import { encodePacket } from '@shared/live/packet'
import { createIngestState, ingestEncodedPacket, type IngestState } from '@shared/live/pipeline'
import { allowedCommands, transition } from '@shared/live/stateMachine'
import { buildDataset } from '@shared/parsers/common'
import { validateDatasetName } from '@shared/datasets/query'
import type { DatasetInfo, ViewportData } from '@shared/types/dataset'
import type { GeneratorRequest } from '@shared/types/generator'
import {
  DEFAULT_LIVE_CONFIG,
  LIVE_DEVICE_ID,
  type DaqCommand,
  type DaqState,
  type LiveConfig,
  type LiveStatus,
  type LiveViewportRequest
} from '@shared/types/live'
import { IpcChannel } from '@shared/ipc-channels'
import { logger } from './logger'
import { saveDatasetToProject } from './importer'

class VirtualDaqService {
  private state: DaqState = 'disconnected'
  private config: LiveConfig = { ...DEFAULT_LIVE_CONFIG }
  private buffer: RingBufferState | null = null
  private ingest: IngestState = createIngestState()
  private sampleIndex = 0
  private sequence = 0
  private timer: ReturnType<typeof setInterval> | null = null
  private elapsedBeforeCurrent = 0
  private runStartedAt: number | null = null

  status(): LiveStatus {
    const channels = liveChannels(this.config.channelCount)
    const bufferLength = this.buffer?.length ?? 0
    const bufferCapacity = this.config.bufferCapacity
    return {
      state: this.state,
      deviceId: LIVE_DEVICE_ID,
      deviceName: this.config.deviceName,
      channelCount: this.config.channelCount,
      sampleRate: this.config.sampleRate,
      bufferCapacity,
      bufferLength,
      bufferFill: this.buffer ? bufferFill(this.buffer) : 0,
      packetCount: this.ingest.packetCount,
      invalidPacketCount: this.ingest.invalidPacketCount,
      droppedPacketCount: this.ingest.droppedPacketCount,
      overflowSamples: this.ingest.overflowSamples,
      sampleIndex: this.sampleIndex,
      elapsedMs: this.elapsedMs(),
      transport: 'loopback',
      channels,
      config: { ...this.config },
      allowedCommands: allowedCommands(this.state),
      canConfigure: this.state === 'disconnected' || this.state === 'connected',
      canCapture: this.state === 'stopped' && bufferLength > 0
    }
  }

  configure(input: LiveConfig): LiveStatus {
    if (this.state !== 'disconnected' && this.state !== 'connected') {
      throw new DataScopeError('VALIDATION_ERROR', '请先断开设备再修改采集参数')
    }
    this.config = validateLiveConfig(input)
    return this.status()
  }

  command(command: DaqCommand): LiveStatus {
    const next = transition(this.state, command)
    this.state = next
    this.apply(command)
    this.emitStatus()
    void logger.write('INFO', `Virtual DAQ ${command}`, 'main', { state: next })
    return this.status()
  }

  getViewport(request: LiveViewportRequest): ViewportData {
    const pixelWidth = Math.max(1, Math.floor(request.pixelWidth))
    const channels = liveChannels(this.config.channelCount)
    if (!this.buffer || this.buffer.length === 0) {
      return {
        datasetId: 'live',
        startIndex: 0,
        endIndex: 0,
        pixelWidth,
        traces: channels.map((channel) => ({
          channelId: channel.id,
          mins: [],
          maxs: []
        }))
      }
    }

    const columns = linearize(this.buffer)
    const endIndex = columns[0].length - 1
    return {
      datasetId: 'live',
      startIndex: 0,
      endIndex,
      pixelWidth,
      traces: channels.map((channel, index) => {
        const buckets = downsampleMinMax(columns[index] ?? [], 0, endIndex, pixelWidth)
        return {
          channelId: channel.id,
          mins: buckets.map((bucket) => bucket.min),
          maxs: buckets.map((bucket) => bucket.max)
        }
      })
    }
  }

  async capture(name: string): Promise<DatasetInfo> {
    if (!this.status().canCapture || !this.buffer) {
      throw new DataScopeError('VALIDATION_ERROR', '仅在采集停止且缓冲区有数据时才能写入工程')
    }
    const columns = linearize(this.buffer)
    const sampleCount = columns[0]?.length ?? 0
    if (sampleCount < 2) {
      throw new DataScopeError('VALIDATION_ERROR', '缓冲区数据不足，无法保存')
    }
    const channelInfos = liveChannels(this.config.channelCount)
    const timestamps = Array.from({ length: sampleCount }, (_, index) => index / this.config.sampleRate)
    const dataset = buildDataset({
      name: validateDatasetName(name),
      table: {
        channelNames: channelInfos.map((channel) => channel.name),
        timestamps,
        columns
      },
      sourcePath: `${name}.json`,
      sourceFormat: 'json',
      fileSize: 0,
      encoding: 'utf-8',
      sampleRateHint: this.config.sampleRate
    })
    const info = await saveDatasetToProject(dataset)
    await logger.write('INFO', 'Live capture saved', 'main', {
      name: info.name,
      samples: info.sampleCount,
      channels: info.channelCount
    })
    return info
  }

  dispose(): void {
    this.stopTimer()
    this.buffer = null
    this.state = 'disconnected'
    this.ingest = createIngestState()
    this.sampleIndex = 0
    this.sequence = 0
    this.elapsedBeforeCurrent = 0
    this.runStartedAt = null
  }

  private apply(command: DaqCommand): void {
    if (command === 'arm') {
      this.stopTimer()
      this.buffer = createRingBuffer(this.config.channelCount, this.config.bufferCapacity)
      this.ingest = createIngestState()
      this.sampleIndex = 0
      this.sequence = 0
      this.elapsedBeforeCurrent = 0
      this.runStartedAt = null
    }
    if (command === 'start' || command === 'resume') {
      this.runStartedAt = Date.now()
      this.startTimer()
      this.tick()
    }
    if (command === 'pause' || command === 'stop') {
      this.freezeElapsed()
      this.stopTimer()
    }
    if (command === 'disconnect' || command === 'reset') {
      this.stopTimer()
      this.buffer = null
      this.ingest = createIngestState()
      this.sampleIndex = 0
      this.sequence = 0
      this.elapsedBeforeCurrent = 0
      this.runStartedAt = null
    }
  }

  private startTimer(): void {
    this.stopTimer()
    const interval = Math.max(8, (this.config.samplesPerPacket / this.config.sampleRate) * 1000)
    this.timer = setInterval(() => {
      this.tick()
    }, interval)
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private tick(): void {
    if (!this.buffer || this.state !== 'running') return
    try {
      const count = this.config.samplesPerPacket
      const request = this.asGeneratorRequest()
      const samples = Array.from({ length: this.config.channelCount }, (_, channel) =>
        generateChannelRange(request, channel, this.sampleIndex, count)
      )
      const encoded = encodePacket({
        version: 1,
        sequence: this.sequence + 1,
        timestamp: this.sampleIndex / this.config.sampleRate,
        sampleIndex: this.sampleIndex,
        channelCount: this.config.channelCount,
        sampleCount: count,
        samples
      })
      ingestEncodedPacket(this.buffer, encoded, this.ingest, this.config.channelCount)
      this.sequence += 1
      this.sampleIndex += count
      this.emitStatus()
    } catch (error) {
      this.stopTimer()
      this.freezeElapsed()
      this.state = 'error'
      this.emitStatus()
      void logger.write('ERROR', error instanceof Error ? error.message : 'Virtual DAQ tick failed', 'main')
    }
  }

  private asGeneratorRequest(): GeneratorRequest {
    return {
      name: this.config.deviceName,
      kind: this.config.kind,
      channelCount: this.config.channelCount,
      sampleRate: this.config.sampleRate,
      duration: 1,
      frequency: this.config.frequency,
      amplitude: this.config.amplitude,
      offset: this.config.offset,
      noiseLevel: this.config.noiseLevel,
      seed: this.config.seed
    }
  }

  private elapsedMs(): number {
    const current = this.runStartedAt ? Date.now() - this.runStartedAt : 0
    return this.elapsedBeforeCurrent + current
  }

  private freezeElapsed(): void {
    if (this.runStartedAt !== null) {
      this.elapsedBeforeCurrent += Date.now() - this.runStartedAt
      this.runStartedAt = null
    }
  }

  private emitStatus(): void {
    const status = this.status()
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(IpcChannel.LiveStatusChanged, status)
    }
  }
}

export const liveService = new VirtualDaqService()
