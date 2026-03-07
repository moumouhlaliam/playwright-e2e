# Playwright E2E - ConsignO

## Project structure

```text
tests/
  e2e/        # End-to-end specs
  support/    # Shared config and auth helpers
.github/
  workflows/  # CI workflow
```

## Local setup

1. Install dependencies:
   - `npm ci`
2. Create `.env` from `.env.example` and fill required values:
   - `CONSIGNO_EMAIL`
   - `CONSIGNO_PASSWORD`
3. Run tests:
   - `npm test`

## CI setup (GitHub Actions)

Configure repository secrets:
- `CONSIGNO_EMAIL`
- `CONSIGNO_PASSWORD`
- `CONSIGNO_INVALID_PASSWORD` (optional)
- `CONSIGNO_REASSIGN_EMAIL` (optional)

Configure optional repository variable:
- `CONSIGNO_BASE_URL`

Workflow file:
- `.github/workflows/playwright.yml`
