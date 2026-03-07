import { expect, type Page } from '@playwright/test';
import { CreateProject, loginLocators } from '../../Locators';
import { getConsignoConfig } from './testConfig';

export async function submitLogin(page: Page, email: string, password: string): Promise<void> {
  await page.fill(loginLocators.email, email);
  await page.fill(loginLocators.password, password);
  await page.click(loginLocators.loginButton);
}

export async function login(page: Page): Promise<void> {
  const config = getConsignoConfig();
  await page.goto(config.loginUrl);
  await submitLogin(page, config.email, config.password);
}

export async function expectDashboardReady(page: Page): Promise<void> {
  await expect(page).toHaveURL(/dashboard/i);
  await expect(page.locator(CreateProject.menu)).toBeVisible();

  const readyMarkers = [CreateProject.newProject, CreateProject.loginMessage, 'h1.dashboard-title'];
  for (const marker of readyMarkers) {
    if (await page.locator(marker).first().isVisible().catch(() => false)) {
      return;
    }
  }

  throw new Error('Dashboard loaded but expected marker was not visible.');
}

