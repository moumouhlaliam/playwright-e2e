import { test, expect } from '@playwright/test';
import { loginLocators } from '../../Locators';
import { expectDashboardReady, submitLogin } from '../support/auth';
import { getConsignoConfig } from '../support/testConfig';

test.describe('Authentification - ConsignO Cloud', () => {
  test('refuse un mauvais mot de passe puis accepte des identifiants valides', async ({ page }) => {
    // Les donnees communes sont centralisees pour tous les specs relies.
    const config = getConsignoConfig();
    const runNegativeLogin = process.env.CONSIGNO_RUN_NEGATIVE_LOGIN === 'true';

    await test.step('Ouvrir la page de connexion', async () => {
      await page.goto(config.loginUrl);
      await expect(page.locator(loginLocators.loginButton)).toBeVisible();
    });

    if (runNegativeLogin) {
      await test.step('Soumettre un mot de passe invalide et valider le message d\'erreur', async () => {
        await submitLogin(page, config.email, config.invalidPassword);
        await expect(page.locator(loginLocators.loginMessageError)).toHaveText('Wrong credentials');
      });
    }

    await test.step('Soumettre un mot de passe valide et valider l\'acces', async () => {
      await submitLogin(page, config.email, config.password);
      await expectDashboardReady(page);
    });
  });
});

