import type { VercelRequest, VercelResponse } from '@vercel/node';
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import type { ImpiFormData } from './types';
import { sendSuccessEmail, sendFailureEmail } from '../../lib/sendEmail';

export const maxDuration = 300;

const IMPI_LOGIN_URL = 'https://eservicios.impi.gob.mx/seimpi/';
const MARCA_EN_LINEA_URL = 'https://marcaenlinea.impi.gob.mx/MarcaEnLinea/';

async function dismissAutoSaveDialog(page: InstanceType<typeof import('playwright').Page>) {
  try {
    const dialog = page.locator('div[role="dialog"], .ui-dialog').filter({ hasText: /informaci/i }).first();
    const aceptar = dialog.locator('button, input[type="button"]').filter({ hasText: /aceptar/i }).first();
    if (await aceptar.isVisible({ timeout: 4000 })) {
      await aceptar.click();
      await page.waitForTimeout(800);
    }
  } catch {
    // No dialog present — continue
  }
}

async function downloadLogoFromStorage(storagePath: string, jobId: string): Promise<string> {
  const supabase = createClient(
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  );
  const { data, error } = await supabase.storage.from('beta-logo-uploads').download(storagePath);
  if (error || !data) throw new Error(`Failed to download logo from storage: ${error?.message}`);
  const localPath = `/tmp/logo-${jobId}${path.extname(storagePath)}`;
  const buffer = Buffer.from(await data.arrayBuffer());
  fs.writeFileSync(localPath, buffer);
  return localPath;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  // Internal auth check — only submit.ts should call this
  const secret = req.headers['x-internal-secret'];
  if (!secret || secret !== process.env.BETA_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { formData, jobId } = req.body as { formData: ImpiFormData; jobId: string };

  // Respond immediately so Vercel doesn't time out the HTTP connection
  // The actual work runs after this, within the maxDuration window
  res.status(202).json({ accepted: true, jobId });

  let stepName = 'setup';
  const screenshotPath = `/tmp/impi-draft-${jobId}.png`;

  // Connect to Browserless remote Chrome via CDP
  const browserlessEndpoint = `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_API_KEY}&slowMo=150`;

  let browser: import('playwright').Browser | null = null;
  let page: import('playwright').Page | null = null;

  try {
    stepName = 'connect-browser';
    browser = await chromium.connectOverCDP(browserlessEndpoint);
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    page = await context.newPage();

    // ── Step 1: Navigate to IMPI login ──────────────────────────────────────
    stepName = 'navigate-login';
    await page.goto(IMPI_LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    // Accept privacy notice if present
    try {
      const privacyCheckbox = page.locator('input[type="checkbox"]').first();
      if (await privacyCheckbox.isVisible({ timeout: 3000 })) {
        await privacyCheckbox.check();
        await page.waitForTimeout(500);
        const aceptarBtn = page.locator('button, input[type="submit"]').filter({ hasText: /aceptar/i }).first();
        if (await aceptarBtn.isVisible({ timeout: 2000 })) await aceptarBtn.click();
        await page.waitForTimeout(1000);
      }
    } catch { /* No privacy notice */ }

    // ── Step 2: Login ────────────────────────────────────────────────────────
    stepName = 'login';

    // Select TuCuentaPASE radio if present
    try {
      const paseRadio = page.locator('input[type="radio"]').filter({ hasText: /pase/i }).first();
      if (!await paseRadio.isVisible({ timeout: 2000 })) {
        // Try by value or label proximity
        const radios = page.locator('input[type="radio"]');
        const count = await radios.count();
        for (let i = 0; i < count; i++) {
          const label = await radios.nth(i).evaluate(el => {
            const lbl = document.querySelector(`label[for="${el.id}"]`);
            return lbl?.textContent ?? '';
          });
          if (/pase/i.test(label)) { await radios.nth(i).click(); break; }
        }
      } else {
        await paseRadio.click();
      }
    } catch { /* Radio may not exist, continue */ }
    await page.waitForTimeout(500);

    // Fill credentials
    const emailInput = page.locator('#frmMain\\:txtUsuario, input[placeholder*="correo"], input[type="email"]').first();
    await emailInput.fill(process.env.IMPI_EMAIL ?? '');
    await page.waitForTimeout(300);

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(process.env.IMPI_PASSWORD ?? '');
    await page.waitForTimeout(300);

    const loginBtn = page.locator('button, input[type="submit"]').filter({ hasText: /iniciar sesión|ingresar|entrar/i }).first();
    await loginBtn.click();

    await page.waitForURL(/viewmenu|dashboard|inicio/i, { timeout: 30000 });
    await page.waitForTimeout(1500);

    // ── Step 3: Navigate to Marca en Línea ──────────────────────────────────
    stepName = 'navigate-marca-en-linea';
    const marcaLink = page.locator('a, button, div[role="button"]').filter({ hasText: /marca en l[ií]nea/i }).first();
    await marcaLink.click();
    await page.waitForURL(/marcaenlinea\.impi\.gob\.mx/i, { timeout: 30000 });
    await page.waitForTimeout(2000);

    // ── Step 4: Accept privacy notice on Marca en Línea ─────────────────────
    stepName = 'accept-privacy-marca';
    try {
      const flagCheckbox = page.locator('input[id*="flagAceptAviso"]').first();
      if (await flagCheckbox.isVisible({ timeout: 5000 })) {
        await flagCheckbox.check();
        await page.waitForTimeout(500);
        const aceptarBtn = page.locator('button, input[type="submit"], input[type="button"]').filter({ hasText: /aceptar/i }).first();
        await aceptarBtn.click();
        await page.waitForTimeout(2000);
      }
    } catch { /* No privacy notice */ }

    // ── Step 5: Dismiss welcome notice ──────────────────────────────────────
    stepName = 'dismiss-welcome';
    try {
      const closeBtn = page.locator('button, a').filter({ hasText: /cerrar|×|close/i }).first();
      if (await closeBtn.isVisible({ timeout: 3000 })) {
        await closeBtn.click();
        await page.waitForTimeout(1000);
      }
    } catch { /* No welcome notice */ }

    // Wait for form to be ready
    await page.waitForSelector('text=/nueva solicitud|quieres registrar/i', { timeout: 20000 });

    // ── Step 6: Fill Tab 1 — Trademark Details ──────────────────────────────
    stepName = 'fill-tab1-trademark-type';

    // Select trademark type card
    const tipoCardText: Record<string, string> = {
      marca: 'Marca',
      marca_colectiva: 'Marca colectiva',
      aviso_comercial: 'Aviso comercial',
      nombre_comercial: 'Nombre comercial',
    };
    const tipoText = tipoCardText[formData.tipoMarca] ?? 'Marca';
    await page.locator(`text="${tipoText}"`).first().click();
    await page.waitForTimeout(1000);

    // Select composition card
    const composicionCardText: Record<string, string> = {
      palabra: 'Una palabra',
      diseno: 'Un diseño',
      palabra_diseno: 'Palabras con diseños',
    };
    const composicionText = composicionCardText[formData.composicion] ?? 'Una palabra';
    await page.locator(`text=/${composicionText}/i`).first().click();
    await page.waitForTimeout(1500);

    // Fill text fields
    stepName = 'fill-tab1-text-fields';
    await page.locator('textarea[id*="txtDenominacion"]').first().fill(formData.denominacion);
    await page.waitForTimeout(300);

    if (formData.leyendasFig) {
      try {
        await page.locator('textarea[id*="txtLeyendasFig"]').first().fill(formData.leyendasFig);
        await page.waitForTimeout(300);
      } catch { /* Field may not be present */ }
    }

    if (formData.traduccion) {
      try {
        await page.locator('textarea[id*="txtTraduccion"]').first().fill(formData.traduccion);
        await page.waitForTimeout(300);
      } catch { /* Field may not be present */ }
    }

    // Upload logo if required
    if ((formData.composicion === 'diseno' || formData.composicion === 'palabra_diseno') && formData.logoStoragePath) {
      stepName = 'upload-logo';
      const localLogoPath = await downloadLogoFromStorage(formData.logoStoragePath, jobId);
      const fileInput = page.locator('input[type="file"][id*="logo"], input[type="file"][id*="imagen"]').first();
      await fileInput.setInputFiles(localLogoPath);
      await page.waitForTimeout(2000);
    }

    // Click Siguiente
    stepName = 'tab1-siguiente';
    await page.locator('button, input[type="button"]').filter({ hasText: /siguiente/i }).first().click();
    await page.waitForTimeout(2000);
    await dismissAutoSaveDialog(page);

    // ── Step 7: Fill Tab 2 — Products & Services ────────────────────────────
    stepName = 'fill-tab2-classification';

    const metodoValue: Record<string, string> = {
      descripcion_libre: '1',
      titulos_clases: '2',
      lista_alfabetica: '3',
    };
    const selectedMetodo = metodoValue[formData.metodoClasificacion] ?? '1';

    const clasificacionSelect = page.locator('select[id*="cmbElegirClase"]').first();
    await clasificacionSelect.selectOption(selectedMetodo);
    await page.waitForTimeout(1500);

    if (selectedMetodo === '1') {
      // descripcion_libre — fill the textarea that appears
      await page.locator('textarea').filter({ hasText: '' }).last().fill(formData.productosServicios);
      await page.waitForTimeout(300);
    } else {
      // Best-effort for other methods — try to fill search input and select first result
      try {
        const searchInput = page.locator('input[type="text"]').last();
        await searchInput.fill(formData.productosServicios);
        await page.waitForTimeout(2000);
        const firstSuggestion = page.locator('li, tr').filter({ hasText: formData.productosServicios.split(' ')[0] }).first();
        if (await firstSuggestion.isVisible({ timeout: 3000 })) await firstSuggestion.click();
      } catch {
        console.warn(`[worker][${jobId}] Tab2: Could not fill non-libre classification. Operator must complete manually.`);
      }
    }

    stepName = 'tab2-siguiente';
    await page.locator('button, input[type="button"]').filter({ hasText: /siguiente/i }).first().click();
    await page.waitForTimeout(2000);
    await dismissAutoSaveDialog(page);

    // ── Step 8: Fill Tab 3 — Owner / Applicant ──────────────────────────────
    stepName = 'fill-tab3-owner-type';

    const tipoPerValue = formData.tipoDueno === 'empresa' ? '2' : '1';
    const tipoPerSelect = page.locator('select[id*="cmbTipoPer"]').first();
    await tipoPerSelect.selectOption(tipoPerValue);
    await page.waitForTimeout(1500);

    // Nationality dropdown
    stepName = 'fill-tab3-nationality';
    try {
      const nacSelect = page.locator('select').filter({ has: page.locator(`option:text-is("${formData.nacionalidadDueno}")`) }).first();
      await nacSelect.selectOption({ label: formData.nacionalidadDueno });
      await page.waitForTimeout(500);
    } catch {
      // Try partial match
      try {
        const allSelects = page.locator('select');
        const count = await allSelects.count();
        for (let i = 0; i < count; i++) {
          const options = await allSelects.nth(i).locator('option').allTextContents();
          if (options.some(o => o.includes(formData.nacionalidadDueno.substring(0, 4)))) {
            await allSelects.nth(i).selectOption({ label: options.find(o => o.includes(formData.nacionalidadDueno.substring(0, 4))) ?? '' });
            break;
          }
        }
      } catch { /* Nationality not critical for draft */ }
    }

    stepName = 'fill-tab3-owner-details';
    if (formData.tipoDueno === 'persona_fisica') {
      try {
        await page.locator('input[placeholder*="nombre" i]').first().fill(formData.nombreDueno ?? '');
        await page.waitForTimeout(200);
        await page.locator('input[placeholder*="primer apellido" i]').first().fill(formData.primerApellido ?? '');
        await page.waitForTimeout(200);
        if (formData.segundoApellido) {
          await page.locator('input[placeholder*="segundo apellido" i]').first().fill(formData.segundoApellido);
          await page.waitForTimeout(200);
        }
      } catch (e) {
        console.warn(`[worker][${jobId}] Tab3: Error filling persona_fisica fields:`, (e as Error).message);
      }
    } else {
      try {
        // Razon social — find by label proximity or placeholder
        const razonInput = page.locator('input[placeholder*="raz" i], input[id*="razon" i], input[id*="social" i]').first();
        await razonInput.fill(formData.razonSocial ?? '');
        await page.waitForTimeout(200);
        if (formData.rfcCurpDueno) {
          const rfcInput = page.locator('input[id*="rfc" i], input[id*="curp" i]').first();
          await rfcInput.fill(formData.rfcCurpDueno);
          await page.waitForTimeout(200);
        }
      } catch (e) {
        console.warn(`[worker][${jobId}] Tab3: Error filling empresa fields:`, (e as Error).message);
      }
    }

    // Phone and email
    if (formData.telefonoDueno) {
      try {
        const phoneInput = page.locator('input[id*="tel" i], input[placeholder*="tel" i]').first();
        await phoneInput.fill(formData.telefonoDueno);
        await page.waitForTimeout(200);
      } catch { /* Optional */ }
    }

    try {
      const emailInput = page.locator('input[type="email"], input[id*="email" i], input[placeholder*="email" i]').first();
      await emailInput.fill(formData.emailDueno);
      await page.waitForTimeout(200);
    } catch (e) {
      console.warn(`[worker][${jobId}] Tab3: Error filling email:`, (e as Error).message);
    }

    // Click Agregar dueño
    stepName = 'tab3-agregar-dueno';
    try {
      const agregarBtn = page.locator('button, input[type="button"]').filter({ hasText: /agregar dueño|agregar/i }).first();
      await agregarBtn.click();
      await page.waitForTimeout(2000);
    } catch (e) {
      console.warn(`[worker][${jobId}] Tab3: Could not click Agregar dueño:`, (e as Error).message);
    }

    stepName = 'tab3-siguiente';
    await page.locator('button, input[type="button"]').filter({ hasText: /siguiente/i }).first().click();
    await page.waitForTimeout(2000);
    await dismissAutoSaveDialog(page);

    // ── Step 9: Fill Tab 4 — Prior Use ──────────────────────────────────────
    stepName = 'fill-tab4-prior-use';

    if (formData.haMarcaUsado === 'si') {
      try {
        const siRadio = page.locator('input[type="radio"]').filter({ hasText: /sí|si/i }).first();
        if (await siRadio.isVisible({ timeout: 2000 })) await siRadio.click();
        else {
          // Look for a radio near text "Sí"
          await page.locator('label').filter({ hasText: /^s[íi]$/i }).first().click();
        }
        await page.waitForTimeout(1000);

        if (formData.fechaPrimerUso) {
          const dateInput = page.locator('input[id*="cldFechaPrimerUso"], input[id*="fecha" i][type="text"]').first();
          const formatted = formData.fechaPrimerUso.split('-').reverse().join('/'); // yyyy-mm-dd → dd/mm/yyyy
          await dateInput.fill(formatted);
          await page.waitForTimeout(300);
        }
      } catch (e) {
        console.warn(`[worker][${jobId}] Tab4: Error filling prior use date:`, (e as Error).message);
      }
    } else {
      try {
        const noUsadoCheckbox = page.locator('input[id*="chkNoUsado"]').first();
        if (await noUsadoCheckbox.isVisible({ timeout: 2000 })) await noUsadoCheckbox.check();
      } catch { /* Try clicking no radio */ }
    }

    // Establecimiento
    if (formData.tieneEstablecimiento === 'si') {
      try {
        const siEstabRadio = page.locator('input[type="radio"]').filter({ hasText: /cuento con establecimiento/i }).first();
        if (await siEstabRadio.isVisible({ timeout: 2000 })) await siEstabRadio.click();
        else await page.locator('label').filter({ hasText: /cuento con establecimiento/i }).first().click();
        await page.waitForTimeout(1000);

        if (formData.direccionEstablecimiento) {
          await page.locator('textarea').last().fill(formData.direccionEstablecimiento);
          await page.waitForTimeout(300);
        }
      } catch (e) {
        console.warn(`[worker][${jobId}] Tab4: Error filling establecimiento:`, (e as Error).message);
      }
    } else {
      try {
        const noEstabRadio = page.locator('input[id*="rdSEstab"][value="0"]').first();
        if (await noEstabRadio.isVisible({ timeout: 2000 })) await noEstabRadio.click();
        else await page.locator('label').filter({ hasText: /no cuento con establecimiento/i }).first().click();
        await page.waitForTimeout(500);
      } catch { /* Optional */ }
    }

    stepName = 'tab4-siguiente';
    await page.locator('button, input[type="button"]').filter({ hasText: /siguiente/i }).first().click();
    await page.waitForTimeout(2000);
    await dismissAutoSaveDialog(page);

    // ── Step 10: Fill Tab 5 — Signatory ─────────────────────────────────────
    stepName = 'fill-tab5-signatory';

    if (formData.curpFirmante) {
      try {
        await page.locator('input[id*="txtCURP"]').first().fill(formData.curpFirmante);
        await page.waitForTimeout(300);
      } catch { /* Optional */ }
    }

    if (formData.nombreFirmante) {
      try {
        await page.locator('input[id*="txtColNombreFirmante"], input[id*="nombreFirmante"]').first().fill(formData.nombreFirmante);
        await page.waitForTimeout(300);
      } catch { /* Optional */ }
    }

    // Country — MEXICO value 895
    try {
      const paisSelect = page.locator('select[id*="cmbPais"]').first();
      if (await paisSelect.isVisible({ timeout: 2000 })) {
        try {
          await paisSelect.selectOption({ label: 'MEXICO' });
        } catch {
          await paisSelect.selectOption('895');
        }
        await page.waitForTimeout(500);
      }
    } catch { /* Pre-filled from session */ }

    // Address fields
    const addressFields: { placeholder: string; value: string | undefined }[] = [
      { placeholder: 'estado', value: formData.estadoFirmante },
      { placeholder: 'Municipio', value: formData.municipioFirmante },
      { placeholder: 'colonia', value: formData.coloniaFirmante },
    ];
    for (const { placeholder, value } of addressFields) {
      if (!value) continue;
      try {
        await page.locator(`input[placeholder*="${placeholder}" i]`).first().fill(value);
        await page.waitForTimeout(200);
      } catch { /* Optional */ }
    }

    try {
      const calleTextarea = page.locator('textarea[placeholder*="calle" i]').first();
      if (await calleTextarea.isVisible({ timeout: 1000 })) await calleTextarea.fill(formData.calleFirmante);
      else await page.locator('input[placeholder*="calle" i]').first().fill(formData.calleFirmante);
      await page.waitForTimeout(200);
    } catch { /* Optional */ }

    try {
      await page.locator('input[placeholder*="Núm. Ext" i], input[id*="txtNumExt"]').first().fill(formData.numExtFirmante);
      await page.waitForTimeout(200);
    } catch { /* Optional */ }

    if (formData.numIntFirmante) {
      try {
        await page.locator('input[id*="txtNumInt"]').first().fill(formData.numIntFirmante);
        await page.waitForTimeout(200);
      } catch { /* Optional */ }
    }

    try {
      await page.locator('input[id*="txtCP"]').first().fill(formData.cpFirmante);
      await page.waitForTimeout(200);
    } catch { /* Optional */ }

    stepName = 'tab5-siguiente';
    await page.locator('button, input[type="button"]').filter({ hasText: /siguiente/i }).first().click();
    await page.waitForTimeout(2000);
    await dismissAutoSaveDialog(page);

    // ── Step 11: Fill Tab 6 — Priority Claim ────────────────────────────────
    stepName = 'fill-tab6-priority';

    if (formData.tienePrioridad === 'si') {
      try {
        await page.locator('input[id*="radioPrioridad"][value="1"]').first().click();
        await page.waitForTimeout(1500);

        if (formData.paisPrioridad) {
          await page.locator('input[placeholder*="país" i], input[id*="pais" i]').last().fill(formData.paisPrioridad);
          await page.waitForTimeout(200);
        }
        if (formData.fechaPrioridad) {
          const formatted = formData.fechaPrioridad.split('-').reverse().join('/');
          await page.locator('input[id*="fecha" i], input[type="text"]').last().fill(formatted);
          await page.waitForTimeout(200);
        }
        if (formData.numExpedientePrioridad) {
          await page.locator('input[id*="expediente" i], input[id*="numExp" i]').last().fill(formData.numExpedientePrioridad);
          await page.waitForTimeout(200);
        }
      } catch (e) {
        console.warn(`[worker][${jobId}] Tab6: Error filling priority claim:`, (e as Error).message);
      }
    } else {
      try {
        await page.locator('input[id*="radioPrioridad"][value="0"]').first().click();
        await page.waitForTimeout(500);
      } catch { /* May already be default */ }
    }

    // ── Step 12: STOP — Extract Application ID ──────────────────────────────
    stepName = 'extract-application-id';
    await page.waitForTimeout(3000);

    let applicationId = 'ID not captured';
    try {
      const bannerLocator = page.locator('text=/solicitud \\d+ se ha guardado/i').first();
      if (await bannerLocator.isVisible({ timeout: 5000 })) {
        const bannerText = await bannerLocator.textContent() ?? '';
        const match = bannerText.match(/solicitud\s+(\d+)/i);
        if (match) applicationId = match[1];
      }
    } catch {
      // Try alternate extraction from page title or header
      try {
        const pageText = await page.locator('body').innerText();
        const match = pageText.match(/solicitud\s+(\d+)/i);
        if (match) applicationId = match[1];
      } catch { /* Use placeholder */ }
    }

    console.log(`[worker][${jobId}] Application ID captured: ${applicationId}`);

    // Take screenshot
    try {
      await page.screenshot({ path: screenshotPath, fullPage: false });
    } catch (e) {
      console.warn(`[worker][${jobId}] Screenshot failed:`, (e as Error).message);
    }

    await browser.close();
    browser = null;

    // Send success email
    stepName = 'send-success-email';
    await sendSuccessEmail(formData, applicationId, jobId);
    console.log(`[worker][${jobId}] Done — draft saved, notification sent.`);

  } catch (err) {
    const error = err as Error;
    console.error(`[worker][${jobId}] FAILED at step "${stepName}":`, error.message);

    // Try to take error screenshot
    if (page) {
      try {
        await page.screenshot({ path: `/tmp/impi-error-${jobId}.png`, fullPage: false });
      } catch { /* Screenshot not critical */ }
    }

    // Send failure email
    try {
      await sendFailureEmail(formData, stepName, error, jobId);
    } catch (emailErr) {
      console.error(`[worker][${jobId}] Also failed to send failure email:`, (emailErr as Error).message);
    }
  } finally {
    if (browser) {
      try { await browser.close(); } catch { /* Ignore close errors */ }
    }
    // Clean up local logo file if created
    try {
      const files = fs.readdirSync('/tmp');
      for (const f of files) {
        if (f.startsWith(`logo-${jobId}`)) fs.unlinkSync(`/tmp/${f}`);
      }
    } catch { /* Cleanup not critical */ }
  }
}
