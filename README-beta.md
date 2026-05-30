# IMPI Auto-Fill Beta — README

Internal beta system for automatically filling IMPI Marca en Línea trademark applications.

---

## Architecture

| Layer | Technology | File(s) |
|---|---|---|
| Frontend form | React (Vite SPA) | `src/pages/beta/ImpiAutofillPage.tsx` |
| Logo storage | Supabase Storage (`beta-logo-uploads`) | — |
| Submit handler | Vercel serverless function (Node.js, 10s) | `api/beta/impi-autofill/submit.ts` |
| Playwright worker | Vercel serverless function (Node.js, 300s) | `api/beta/impi-autofill/worker.ts` |
| Email helper | Shared module (Resend API) | `api/lib/sendEmail.ts` |
| Remote browser | Browserless.io (CDP) | — |

**Flow:**
1. Operator fills form at `/beta/impi-autofill?token=...`
2. Logo (if any) is uploaded to Supabase Storage
3. Form data is POSTed to `/api/beta/impi-autofill/submit`
4. Submit handler validates, returns `{ success: true }` immediately, fires worker async
5. Worker connects to Browserless.io, runs 12-step Playwright automation
6. Application is saved as a draft in IMPI (never submitted/finalized)
7. Attorney receives email at `sergio.legorreta@lawtaem.com` with application ID and next steps

---

## Required Environment Variables

Add all of these in the **Vercel dashboard** (Settings → Environment Variables) for production, and in `.env` for local development.

### Frontend (VITE_ prefix — exposed to the browser)
| Variable | Value |
|---|---|
| `VITE_BETA_SECRET` | `beta-access-token-2026` |
| `VITE_SUPABASE_URL` | Already set |
| `VITE_SUPABASE_ANON_KEY` | Already set |

### Server-side (Vercel serverless functions only)
| Variable | Description |
|---|---|
| `BETA_SECRET` | Must match `VITE_BETA_SECRET` — validates API requests |
| `IMPI_EMAIL` | `sergiolegorreta@yahoo.com` |
| `IMPI_PASSWORD` | IMPI TuCuentaPASE password |
| `NOTIFY_EMAIL` | `sergio.legorreta@lawtaem.com` |
| `BROWSERLESS_API_KEY` | Your Browserless.io API key |
| `RESEND_API_KEY` | Resend API key for sending emails |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (to download logos from private bucket) |
| `SUPABASE_URL` | Same value as `VITE_SUPABASE_URL` (without VITE_ prefix for server use) |

---

## Deployment Steps

### 1. Install no new packages on Vercel
Playwright is already listed as a peer dependency. Vercel's Node.js runtime does not bundle Chromium — the automation runs via **Browserless.io remote CDP**, so no `npx playwright install chromium` is needed on Vercel.

### 2. Set environment variables in Vercel dashboard
Add all server-side variables listed above.

### 3. Verify Vercel plan
The worker function uses `maxDuration = 300` (5 minutes). This requires **Vercel Pro** or higher. On the Hobby plan, the limit is 10 seconds and the worker will time out for most applications.

### 4. Add `@vercel/node` types (if not already installed)
```bash
npm install --save-dev @vercel/node
```

### 5. Deploy
```bash
git push origin main
```
Vercel auto-detects the `/api` directory and deploys all `.ts` files as serverless functions.

---

## Testing Instructions

1. Set all environment variables in `.env` (local) or Vercel dashboard (production)

2. Navigate to the beta form:
   ```
   https://mexicotrademarkcenter.com/beta/impi-autofill?token=beta-access-token-2026
   ```
   (or `http://localhost:5173/beta/impi-autofill?token=beta-access-token-2026` locally)

3. Fill the form with a **test mark** — use an obviously fake name like `TESTMARCA999` to avoid accidentally creating a real filing that looks legitimate

4. Submit and watch the server logs in Vercel dashboard → Functions → `worker`

5. Check `sergio.legorreta@lawtaem.com` for the confirmation email with the IMPI application ID

6. Log into IMPI at [https://marcaenlinea.impi.gob.mx/MarcaEnLinea/](https://marcaenlinea.impi.gob.mx/MarcaEnLinea/) → "Mis solicitudes" to verify the draft was created

7. **Delete the test draft** from IMPI's "Mis solicitudes" to avoid confusion with real applications

---

## Security Notes

- The form is not linked from any navigation, footer, or sitemap
- Access requires the `?token=` query parameter matching `VITE_BETA_SECRET`
- The API validates the token server-side against `BETA_SECRET`
- The worker validates an internal secret header (`x-internal-secret`) so it cannot be called directly
- IMPI credentials are stored only in server-side environment variables, never in the browser

---

## What the Automation Does (and Does NOT Do)

**Does:**
- Logs into IMPI using TuCuentaPASE credentials
- Fills all 6 tabs of the Marca en Línea application form
- Saves a draft (IMPI auto-saves on every tab navigation)
- Captures the application ID from the auto-save confirmation
- Sends a notification email with the ID and next steps

**Does NOT:**
- Click "Finalizar captura"
- Complete or initiate payment
- Apply a digital signature (CURP / e.firma)
- Formally submit the application to IMPI

The attorney must log in, review the draft, click "Finalizar captura", complete payment, and sign to formally file.

---

## File Structure

```
api/
  beta/
    impi-autofill/
      submit.ts       — Vercel function: validates form, fires worker async
      worker.ts       — Vercel function: Playwright automation via Browserless
      types.ts        — Shared TypeScript types for form data
  lib/
    sendEmail.ts      — Resend email helper (success + failure templates)

src/pages/beta/
  ImpiAutofillPage.tsx       — React form page (/beta/impi-autofill)
  ImpiAutofillStatusPage.tsx — Confirmation page (/beta/impi-autofill/status)
```
