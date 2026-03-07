import { test, expect } from '@playwright/test';
import { CreateProject } from '../../Locators';
import { expectDashboardReady, login } from '../support/auth';
import { getConsignoConfig } from '../support/testConfig';

test.describe('Actions Projet - ConsignO Cloud', () => {
  test('reassigne un projet puis le convertit en template', async ({ page }) => {
    test.slow();
    const config = getConsignoConfig();
    const templateName = `TemplateTest-${Date.now()}`;

    await test.step('Se connecter et verifier le tableau de bord', async () => {
      await login(page);
      await expectDashboardReady(page);
    });

    await test.step('Ouvrir le menu d actions et reassigner le projet', async () => {
      await expect(page.locator(CreateProject.action)).toBeVisible();
      await page.click(CreateProject.action);
      await page.click(CreateProject.reassignpro);
      await expect(page.locator(CreateProject.mailassign)).toBeVisible();
      await page.fill(CreateProject.mailassign, config.reassignEmail);
      await page.click(CreateProject.checkbox);
      await page.click(CreateProject.confirm1);
    });

    await test.step('Convertir le projet en template', async () => {
      await expect(page.locator(CreateProject.action)).toBeVisible();
      await page.click(CreateProject.action);
      await page.click(CreateProject.saveTemplate);
      await expect(page.locator(CreateProject.Tempname)).toBeVisible();
      await page.fill(CreateProject.Tempname, templateName);
      await expect(page.locator(CreateProject.savetemp)).toBeEnabled();
      await page.click(CreateProject.savetemp);
    });

    await test.step('Ouvrir la liste des templates', async () => {
      await expect(page.locator(CreateProject.allTemp)).toBeVisible();
      await page.click(CreateProject.allTemp);
    });
  });
});

