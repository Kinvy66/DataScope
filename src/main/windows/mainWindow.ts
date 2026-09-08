import { BrowserWindow, nativeImage, shell } from 'electron'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import { APP_NAME } from '@shared/constants'

function resolvePreloadPath(): string {
  const mjsPath = join(__dirname, '../preload/index.mjs')
  const jsPath = join(__dirname, '../preload/index.js')
  return existsSync(mjsPath) ? mjsPath : jsPath
}

function resolveWindowIcon(): Electron.NativeImage | undefined {
  const candidates = [
    join(__dirname, '../../resources/icon.png'),
    join(process.cwd(), 'resources/icon.png')
  ]
  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue
    const image = nativeImage.createFromPath(filePath)
    if (!image.isEmpty()) return image
  }
  return undefined
}

export function createMainWindow(): BrowserWindow {
  const icon = resolveWindowIcon()
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1120,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    title: APP_NAME,
    backgroundColor: '#0b0f14',
    ...(icon ? { icon } : {}),
    webPreferences: {
      preload: resolvePreloadPath(),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  window.on('ready-to-show', () => {
    window.show()
  })

  window.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}
