import { describe, expect, it } from 'vitest'
import { LruCache, viewportCacheKey } from '@shared/datasets/lruCache'

describe('LruCache', () => {
  it('evicts the oldest entry when over the limit', () => {
    const cache = new LruCache<number>(2)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBe(2)
    expect(cache.get('c')).toBe(3)
  })

  it('refreshes recency on get', () => {
    const cache = new LruCache<number>(2)
    cache.set('a', 1)
    cache.set('b', 2)
    expect(cache.get('a')).toBe(1)
    cache.set('c', 3)
    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('a')).toBe(1)
  })

  it('does not store when the limit is 0', () => {
    const cache = new LruCache<number>(0)
    cache.set('a', 1)
    expect(cache.get('a')).toBeUndefined()
    expect(cache.size).toBe(0)
  })

  it('deletes by prefix', () => {
    const cache = new LruCache<number>(8)
    cache.set('ds1|0|10|100|ch1', 1)
    cache.set('ds2|0|10|100|ch1', 2)
    cache.deleteByPrefix('ds1|')
    expect(cache.get('ds1|0|10|100|ch1')).toBeUndefined()
    expect(cache.get('ds2|0|10|100|ch1')).toBe(2)
  })
})

describe('viewportCacheKey', () => {
  it('includes range, width, and channel order', () => {
    expect(viewportCacheKey('a', 0, 10, 200, ['ch1', 'ch2'])).not.toBe(
      viewportCacheKey('a', 0, 10, 200, ['ch2', 'ch1'])
    )
  })
})
