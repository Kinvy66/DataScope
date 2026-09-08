import { expect, type ElectronApplication, type Page, _electron as electron } from '@playwright/test'
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const electronPath = require('electron') as unknown as string
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

export interface LaunchedApp {
  app: ElectronApplication
  page: Page
  userDataDir: string
  workspaceDir: string
}

export async function launchApp(): Promise<LaunchedApp> {
  const mainPath = join(root, 'out/main/index.js')
  if (!existsSync(mainPath)) {
    throw new Error('Missing out/main/index.js. Run `npm run build` before E2E tests.')
  }

  const userDataDir = await mkdtemp(join(tmpdir(), 'datascope-e2e-user-'))
  const workspaceDir = await mkdtemp(join(tmpdir(), 'datascope-e2e-ws-'))

  const env: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (value === undefined) continue
    if (key === 'ELECTRON_RENDERER_URL' || key === 'VITE_DEV_SERVER_URL') continue
    env[key] = value
  }
  env.NODE_ENV = 'production'
  env.ELECTRON_DISABLE_SECURITY_WARNINGS = '1'

  const app = await electron.launch({
    executablePath: electronPath,
    args: [`--user-data-dir=${userDataDir}`, mainPath],
    cwd: root,
    timeout: 60_000,
    env
  })

  const page = await app.firstWindow()
  await page.locator('.app-root[data-app-ready="true"]').waitFor({ timeout: 30_000 })
  return { app, page, userDataDir, workspaceDir }
}

export async function closeApp(session: LaunchedApp): Promise<void> {
  await session.app.close()
  await rm(session.userDataDir, { recursive: true, force: true })
  await rm(session.workspaceDir, { recursive: true, force: true })
}

export async function stubOpenFile(app: ElectronApplication, filePath: string): Promise<void> {
  await app.evaluate(async ({ dialog }, path) => {
    dialog.showOpenDialog = (async () => ({
      canceled: false,
      filePaths: [path]
    })) as typeof dialog.showOpenDialog
  }, filePath)
}

export async function expectNoErrorBanner(page: Page): Promise<void> {
  await expect(page.locator('.error-banner')).toHaveCount(0)
}

export const normalCsv = join(root, 'test-data/normal/normal.csv')
