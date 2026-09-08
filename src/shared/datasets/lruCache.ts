export class LruCache<V> {
  private readonly map = new Map<string, V>()

  constructor(private limit: number) {
    this.limit = Math.max(0, Math.floor(limit))
  }

  get size(): number {
    return this.map.size
  }

  setLimit(limit: number): void {
    this.limit = Math.max(0, Math.floor(limit))
    this.trim()
  }

  get(key: string): V | undefined {
    if (this.limit <= 0) return undefined
    const value = this.map.get(key)
    if (value === undefined) return undefined
    this.map.delete(key)
    this.map.set(key, value)
    return value
  }

  set(key: string, value: V): void {
    if (this.limit <= 0) return
    if (this.map.has(key)) this.map.delete(key)
    this.map.set(key, value)
    this.trim()
  }

  deleteByPrefix(prefix: string): void {
    for (const key of [...this.map.keys()]) {
      if (key.startsWith(prefix)) this.map.delete(key)
    }
  }

  clear(): void {
    this.map.clear()
  }

  private trim(): void {
    if (this.limit <= 0) {
      this.map.clear()
      return
    }
    while (this.map.size > this.limit) {
      const oldest = this.map.keys().next().value
      if (oldest === undefined) break
      this.map.delete(oldest)
    }
  }
}

export function viewportCacheKey(
  datasetId: string,
  startIndex: number,
  endIndex: number,
  pixelWidth: number,
  channelIds: readonly string[]
): string {
  return `${datasetId}|${startIndex}|${endIndex}|${pixelWidth}|${channelIds.join(',')}`
}
