# Security notes (public repository)

ConsentFlow is a **hackathon / portfolio demo**. Treat it accordingly.

## Secrets

| Item | Policy |
| :--- | :--- |
| `GEMINI_API_KEY` | **Server-only.** Never committed. Never injected into the Vite client bundle. Browser calls `/api/gemini/*`; the Node process reads the key from the environment. |
| `.env` | Gitignored. Copy from `.env.example` locally. |
| `SEED_SECRET` | Optional. If set, `POST /api/seed` requires header `X-Seed-Token: <secret>`. |
| Local Postgres password `consentflow_secret` | **Local demo only** (Docker Compose). Do not reuse in production. |

## What is *not* in this repo

- No real patient health information (PHI)
- No production Ethics Committee dossiers
- No committed API keys (verify with `git log -p -- .env` before publishing)

## Demo cast

Investigator names and Belgian centre labels are used as a **synthetic cast** for the BSPHO scenario. Phone numbers and street addresses in seed text are clearly fake (`+32 00 000 00 00`, Demo-City).

## Before going public checklist

1. Confirm `.env` is not tracked (`git check-ignore -v .env`)
2. Confirm `GEMINI_API_KEY` is empty in any committed example files
3. Rotate any key that was ever pasted into a chat, screenshot, or old commit
4. Prefer hosting large media (`Demo.mov`) outside git or via Git LFS
5. Set `SEED_SECRET` on public Cloud Run if you keep `/api/seed` enabled

## Reporting

If you find a credential in this repository history, open an issue privately with the maintainer and rotate the affected secret immediately.
