import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LogEntry, LogLevel, LogQuery } from '@shared/types/log'

export const useLogStore = defineStore('log', () => {
  const entries = ref<LogEntry[]>([])
  const level = ref<LogLevel | ''>('')
  const search = ref('')

  async function refresh(): Promise<void> {
    const query: LogQuery = {
      level: level.value || undefined,
      search: search.value || undefined,
      limit: 500
    }
    entries.value = await window.datascope.log.query(query)
  }

  async function write(message: string, logLevel: LogLevel = 'INFO'): Promise<void> {
    await window.datascope.log.write({ level: logLevel, message })
    await refresh()
  }

  return {
    entries,
    level,
    search,
    refresh,
    write
  }
})
