import { expect, test } from '@playwright/test'
import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { closeApp, expectNoErrorBanner, launchApp, stubOpenFile, normalCsv } from './launch'

test('launch, create project, import, waveform, analyze, export, reopen', async () => {
  const session = await launchApp()
  const { app, page, workspaceDir } = session
  const projectName = 'E2ESmoke'

  try {
    await expect(page.getByTestId('nav-dashboard')).toBeVisible()
    await expect(page.getByRole('heading', { name: '工作台' })).toBeVisible()

    await page.getByTestId('toolbar-new-project').click()
    await expect(page.getByTestId('new-project-dialog')).toBeVisible()
    await page.locator('#project-name').fill(projectName)
    await page.locator('#project-location').fill(workspaceDir)
    await page.getByTestId('new-project-create').click()
    await expect(page.getByTestId('status-project')).toContainText(projectName)
    await expectNoErrorBanner(page)

    await stubOpenFile(app, normalCsv)
    await page.getByTestId('toolbar-import').click()
    await expect(page.getByTestId('status-channels')).toHaveText('3 ch')
    await expect(page.getByTestId('status-samples')).toHaveText('4 samples')
    await expectNoErrorBanner(page)

    await page.getByTestId('nav-data').click()
    await expect(page.getByTestId('waveform-canvas')).toBeVisible()
    await expect(page.locator('[data-testid="waveform-canvas"] canvas')).toBeVisible()

    await page.getByTestId('nav-signal').click()
    await expect(page.getByTestId('signal-run')).toBeEnabled()
    await page.getByTestId('signal-run').click()
    await expect(page.getByTestId('analysis-results')).toBeVisible()
    await expectNoErrorBanner(page)

    await page.getByTestId('nav-export').click()
    await expect(page.getByTestId('export-run')).toBeEnabled()
    await page.getByTestId('export-run').click()
    await expect(page.getByTestId('export-result')).toBeVisible()
    await expect(page.getByTestId('export-result')).toContainText('exports/')
    await expectNoErrorBanner(page)

    const projectRoot = join(workspaceDir, projectName)
    const exportDir = join(projectRoot, 'exports')
    await expect.poll(() => existsSync(exportDir)).toBe(true)
    const exported = await readdir(exportDir)
    expect(exported.some((name) => name.endsWith('.csv'))).toBe(true)

    await page.getByTestId('toolbar-save').click()
    await expect(page.getByTestId('status-dirty')).toHaveText('就绪')

    await page.getByTestId('toolbar-close').click()
    await expect(page.getByTestId('status-project')).toContainText('未打开工程')
    await expect(page.getByTestId('toolbar-import')).toBeDisabled()

    await page.getByTestId('nav-dashboard').click()
    await page.getByTestId('recent-open').first().click()
    await expect(page.getByTestId('status-project')).toContainText(projectName)

    await page.getByTestId('nav-data').click()
    await expect(page.getByTestId('waveform-canvas')).toBeVisible()
    await expect(page.getByTestId('status-channels')).toHaveText('3 ch')
    await expectNoErrorBanner(page)
  } finally {
    await closeApp(session)
  }
})
