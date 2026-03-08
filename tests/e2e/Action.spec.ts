import { test, expect } from '@playwright/test';
import { CreateProject } from '../../Locators';
import { expectDashboardReady, login } from '../support/auth';

async function getFirstWorkflowId(page: import('@playwright/test').Page): Promise<string> {
  const optionsButton = page.locator('[id^="workflowOptionsDropdown_"]').first();
  await expect(optionsButton).toBeVisible({ timeout: 20_000 });

  const optionsId = await optionsButton.getAttribute('id');
  if (!optionsId) {
    throw new Error('Options button id is missing.');
  }

  const workflowId = optionsId.replace('workflowOptionsDropdown_', '').trim();
  if (!workflowId) {
    throw new Error(`Cannot extract workflow id from "${optionsId}".`);
  }

  return workflowId;
}

async function openWorkflowOptions(
  page: import('@playwright/test').Page,
  workflowId: string,
): Promise<void> {
  const optionsButton = page.locator(`#workflowOptionsDropdown_${workflowId}`);
  await expect(optionsButton).toBeVisible();
  await optionsButton.click();
}

test.describe('Actions Projet - ConsignO Cloud', () => {
  test('reassigne un projet puis le convertit en template', async ({ page }) => {
    test.slow();
    const templateName = `TemplateTest-${Date.now()}`;
    const reassignEmail = 'l-momoh89@hotmail.com';
    let workflowId = '';

    await test.step('Se connecter et verifier le tableau de bord', async () => {
      await login(page);
      await expectDashboardReady(page);
    });

    await test.step('Trouver un projet cible', async () => {
      workflowId = await getFirstWorkflowId(page);
    });

    await test.step('Ouvrir le menu d actions et reassigner le projet', async () => {
      await openWorkflowOptions(page, workflowId);

      const reassignAction = page.locator(`#reassign-workflow_${workflowId}`);
      await expect(reassignAction).toBeVisible();
      await reassignAction.click();

      await expect(page.locator(CreateProject.mailassign)).toBeVisible();
      await page.fill(CreateProject.mailassign, reassignEmail);

      const reassignForm = page.locator('form:has(#newOwnerEmail)').first();
      const checkboxInput = reassignForm.locator('input[type="checkbox"]').first();
      const confirmButton = reassignForm.getByRole('button', { name: /^confirm$/i });

      if (await confirmButton.isDisabled()) {
        const checkboxLabel = reassignForm.locator('label[for="reassignWarning"]').first();
        if ((await checkboxLabel.count()) > 0) {
          await checkboxLabel.click({ force: true });
        } else if ((await page.locator(CreateProject.checkbox).count()) > 0) {
          await page.click(CreateProject.checkbox);
        } else if ((await checkboxInput.count()) > 0) {
          await checkboxInput.evaluate((element) => {
            const input = element as HTMLInputElement;
            input.checked = true;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          });
        }
      }

      await expect(confirmButton).toBeEnabled();
      await confirmButton.click();
    });

    await test.step('Convertir le projet en template', async () => {
      await openWorkflowOptions(page, workflowId);

      const saveTemplateAction = page.locator(`#convert-to-template_${workflowId}`);
      await expect(saveTemplateAction).toBeVisible();
      await saveTemplateAction.click();

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

