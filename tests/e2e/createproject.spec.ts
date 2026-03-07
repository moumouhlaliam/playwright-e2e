import { test, expect, type Locator, type Page } from '@playwright/test';
import { CreateProject } from '../../Locators';
import { expectDashboardReady, login } from '../support/auth';
import { getConsignoConfig } from '../support/testConfig';

// Returns a future date in DD/MM/YYYY to keep project expiration valid.
function getFutureDate(daysAhead: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Tries selector options in order and returns the first visible match.
async function getFirstVisibleLocator(page: Page, selectors: string[]): Promise<Locator> {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.isVisible().catch(() => false)) {
      return locator;
    }
  }

  throw new Error(`No visible element found for selectors: ${selectors.join(', ')}`);
}

// Uses dragTo first, then falls back to mouse coordinates if needed.
async function dragFieldToPdf(
  page: Page,
  source: Locator,
  target: Locator,
  position: { x: number; y: number },
): Promise<void> {
  try {
    await source.dragTo(target, { targetPosition: position });
    return;
  } catch {
    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();

    if (!sourceBox || !targetBox) {
      throw new Error('Could not resolve drag coordinates for signer text box.');
    }

    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + position.x, targetBox.y + position.y, { steps: 15 });
    await page.mouse.up();
  }
}

// Prefers the date picker "Ok" flow from recorder, then falls back to typing a date.
async function setExpirationDate(page: Page): Promise<void> {
  const calendarButton = page.locator('#calendar-btn');
  if (await calendarButton.isVisible().catch(() => false)) {
    await calendarButton.click();
    await page.getByRole('button', { name: /^ok$/i }).click();
    return;
  }

  await page.fill(CreateProject.date, getFutureDate(30));
}

// Activates a signer row using the same double-click behavior from recorder.
async function activateSignerRow(page: Page, signerIndex: number): Promise<void> {
  const rowSelectors = ['[id^="signer-menu_"]', '#signers-table .au-target.d-flex', '#signers-table .btn-left'];

  for (const rowSelector of rowSelectors) {
    const rows = page.locator(rowSelector);
    const rowCount = await rows.count();
    if (rowCount > signerIndex && (await rows.nth(signerIndex).isVisible().catch(() => false))) {
      await rows.nth(signerIndex).dblclick();
      return;
    }
  }

  throw new Error(`Could not activate signer row at index ${signerIndex}.`);
}

test.describe('Create Project', () => {
  test('login, create project, drag 2 signer text boxes, and save', async ({ page }) => {
    test.slow();
    const config = getConsignoConfig();

    await login(page);
    await expectDashboardReady(page);

    // Create a project with a unique name and valid future expiration date.
    const projectName = `Testcase-${Date.now()}`;
    await page.click(CreateProject.newProject);
    await page.fill(CreateProject.projectname, projectName);
    await setExpirationDate(page);

    // Select the first two signers from the address book modal.
    await page.click(CreateProject.signer);
    const signers = page.locator('[id^="label-signer-"]');
    await expect(signers.first()).toBeVisible();

    const signerCount = await signers.count();
    if (signerCount < 2) {
      throw new Error(`Expected at least 2 signers, found ${signerCount}.`);
    }

    await signers.nth(0).click();
    await signers.nth(1).click();
    await page.click(CreateProject.addsigner);

    // Upload the PDF document for signer field placement.
    await page.click(CreateProject.uploadBtn);
    const uploadInput = page.locator(CreateProject.uploadInput).first();
    await expect(uploadInput).toHaveCount(1);
    await uploadInput.setInputFiles(config.documentPath);

    // Wait until the uploaded document tab and page are visible.
    const uploadedTab = page.getByRole('tab', { name: /test/i }).first();
    await expect(uploadedTab).toBeVisible({ timeout: 20_000 });
    await uploadedTab.click();
    await expect(page.locator('img[alt="document"], [id*="_page_1"] img, [id*="_page_1"] canvas').first()).toBeVisible({
      timeout: 20_000,
    });

    // Place one text zone for signer #1 and one text zone for signer #2.
    const signerTextTool = await getFirstVisibleLocator(page, [
      'button:has-text("Text field")',
      '[id^="esig_"] span[class*="action-text"]',
      '[id^="esig_"] span:has-text("Text")',
      '[id^="esig_"] span:has-text("Texte")',
      CreateProject.signersTool,
    ]);

    const pdfDropArea = await getFirstVisibleLocator(page, [
      'img[alt="document"]',
      '[id$="_page_1"] img',
      '[id$="_page_1"] canvas',
      '[id*="_page_1"] img',
      '[id*="_page_1"] canvas',
      CreateProject.pdfArea,
    ]);

    // Activate signer #1 by double-click, then drop first text zone.
    await activateSignerRow(page, 0);
    await dragFieldToPdf(page, signerTextTool, pdfDropArea, { x: 180, y: 210 });

    // Activate signer #2 by double-click, then drop second text zone.
    await activateSignerRow(page, 1);
    await dragFieldToPdf(page, signerTextTool, pdfDropArea, { x: 320, y: 320 });

    // Save after placing both signer text boxes.
    const saveButton = await getFirstVisibleLocator(page, ['#saveBtn', '#updateBtn']);
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
  });
});

