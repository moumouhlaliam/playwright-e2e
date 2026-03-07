import { test, expect, type Page } from '@playwright/test';
import { CreateProject } from '../../Locators';
import { expectDashboardReady, login } from '../support/auth';

async function openUserMenu(page: Page): Promise<void> {
  await page.click(CreateProject.menu);
}

test.describe('Navigation Utilisateur - ConsignO Cloud', () => {
  test('navigue preferences, compte, organisation et carnet d adresses', async ({ page }) => {
    test.slow();

    // On genere une adresse unique pour eviter les conflits de contact existant.
    const uniqueEmail = `test.user.${Date.now()}@example.com`;

    await test.step('Se connecter et confirmer l arrivee au tableau de bord', async () => {
      await login(page);
      await expectDashboardReady(page);
    });

    await test.step('Ouvrir Preferences et sauvegarder', async () => {
      await openUserMenu(page);
      await page.click(CreateProject.preference);
      await expect(page.locator(CreateProject.save)).toBeVisible();
      await page.click(CreateProject.save);
    });

    await test.step('Ouvrir Mon compte, verifier Changer mot de passe puis revenir', async () => {
      await openUserMenu(page);
      await page.click(CreateProject.account);
      await expect(page.locator(CreateProject.changepass)).toBeVisible();
      await page.click(CreateProject.changepass);
      await expect(page.locator(CreateProject.cancel)).toBeVisible();
      await page.click(CreateProject.cancel);
      await page.click(CreateProject.return);
    });

    await test.step('Ouvrir Mon organisation et sauvegarder', async () => {
      await openUserMenu(page);
      await page.click(CreateProject.organization);
      await expect(page.locator(CreateProject.save1)).toBeVisible();
      await page.click(CreateProject.save1);
    });

    await test.step('Ajouter un contact dans le carnet d adresses', async () => {
      await openUserMenu(page);
      await page.click(CreateProject.bookadd);
      await expect(page.locator(CreateProject.newadd)).toBeVisible();
      await page.click(CreateProject.newadd);

      await page.click(CreateProject.elecsignature);
      await page.fill(CreateProject.firstname, 'Test');
      await page.fill(CreateProject.lastname, 'Tech');
      await page.fill(CreateProject.email, uniqueEmail);
      await page.click(CreateProject.next);

      await expect(page.locator(CreateProject.notificationType)).toBeVisible();
      await page.click(CreateProject.notificationType);
      await page.fill(CreateProject.question, 'Country');
      await page.fill(CreateProject.reponse, 'Canada');
      await page.fill(CreateProject.ConfirRepon, 'Canada');

      await expect(page.locator(CreateProject.new)).toBeEnabled();
      await page.click(CreateProject.new);
      await expect(page.locator(CreateProject.close)).toBeVisible();
      await page.click(CreateProject.close);
    });
  });
});

