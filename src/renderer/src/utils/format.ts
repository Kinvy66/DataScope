export function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'message' in error) {
    const message = String((error as { message: unknown }).message)
    const match = message.match(/Error invoking remote method '[^']+':\s*(.*)$/s)
    if (match) {
      const body = match[1].trim()
      if (body.startsWith('{')) {
        try {
          const parsed = JSON.parse(body) as { message?: string }
          if (parsed.message) return parsed.message
        } catch {
          return body
        }
      }
      return body.replace(/^Error:\s*/, '')
    }
    return message
  }
  return '未知错误'
}

export function formatNumber(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return '—'
  const abs = Math.abs(value)
  if (abs !== 0 && (abs >= 10000 || abs < 0.001)) {
    return value.toExponential(3)
  }
  return value.toFixed(digits)
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return '—'
  if (seconds < 1) return `${(seconds * 1000).toFixed(2)} ms`
  if (seconds < 60) return `${seconds.toFixed(3)} s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds - minutes * 60
  return `${minutes} min ${rest.toFixed(1)} s`
}

export function formatElapsedMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return formatDuration(ms / 1000)
}

export function formatTimestamp(value: number): string {
  return new Date(value).toLocaleString()
}

export function formatPath(path: string): string {
  if (path.length <= 48) return path
  return `…${path.slice(-47)}`
}
