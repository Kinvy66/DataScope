import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { APP_NAME } from '@shared/constants'
import { createMainWindow } from './windows/mainWindow'
import { attachCloseGuard, registerIpcHandlers } from './ipc'
import { logger } from './services/logger'
import { settingsService } from './services/settings'
import { datasetRegistry } from './services/datasetRegistry'
import { liveService } from './services/live'

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.datascope.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const settings = await settingsService.get()
  logger.setMinLevel(settings.logLevel)
  datasetRegistry.setCacheLimit(settings.viewportCacheLimit)
  await logger.write('INFO', `${APP_NAME} starting`, 'main', { version: app.getVersion() || '1.0.0' })

  registerIpcHandlers()
  const mainWindow = createMainWindow()
  attachCloseGuard(mainWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const window = createMainWindow()
      attachCloseGuard(window)
    }
  })
})

app.on('window-all-closed', () => {
  liveService.dispose()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  liveService.dispose()
})

process.on('uncaughtException', (error) => {
  void logger.write('ERROR', `Uncaught exception: ${error.message}`, 'main')
})

process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason)
  void logger.write('ERROR', `Unhandled rejection: ${message}`, 'main')
})
