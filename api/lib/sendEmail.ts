import type { ImpiFormData } from '../beta/impi-autofill/types.js';

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM = 'IMPI AutoFill Beta <tm@mexicotrademarkcenter.com>';
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL ?? 'sergio.legorreta@lawtaem.com';

async function sendViaResend(subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [NOTIFY_EMAIL], subject, html }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend API error ${res.status}: ${text}`);
  }
}

export async function sendSuccessEmail(
  formData: ImpiFormData,
  applicationId: string,
  jobId: string,
): Promise<void> {
  const owner =
    formData.tipoDueno === 'empresa'
      ? formData.razonSocial
      : `${formData.nombreDueno ?? ''} ${formData.primerApellido ?? ''}`.trim();

  const timestamp = new Date().toISOString();

  const subject = `IMPI Draft Ready — ${formData.denominacion} — Application ${applicationId}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Arial, sans-serif; color: #222; max-width: 640px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #1a7a4a;">IMPI Draft Application Loaded Successfully</h2>
  <p>The trademark application has been automatically filled in IMPI's Marca en Línea portal and saved as a draft.</p>

  <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
    <tr style="background:#f3f4f6;"><td style="padding:8px 12px; font-weight:bold; width:40%;">Application ID:</td><td style="padding:8px 12px;">${applicationId}</td></tr>
    <tr><td style="padding:8px 12px; font-weight:bold;">Trademark:</td><td style="padding:8px 12px;">${formData.denominacion}</td></tr>
    <tr style="background:#f3f4f6;"><td style="padding:8px 12px; font-weight:bold;">Type:</td><td style="padding:8px 12px;">${formData.tipoMarca}</td></tr>
    <tr><td style="padding:8px 12px; font-weight:bold;">Owner:</td><td style="padding:8px 12px;">${owner}</td></tr>
    <tr style="background:#f3f4f6;"><td style="padding:8px 12px; font-weight:bold;">Class(es):</td><td style="padding:8px 12px;">${formData.claseNiza}</td></tr>
    <tr><td style="padding:8px 12px; font-weight:bold;">Client:</td><td style="padding:8px 12px;">${formData.clienteNombre} (${formData.clienteEmail})</td></tr>
    <tr style="background:#f3f4f6;"><td style="padding:8px 12px; font-weight:bold;">Job ID:</td><td style="padding:8px 12px; font-size:12px; color:#666;">${jobId}</td></tr>
    <tr><td style="padding:8px 12px; font-weight:bold;">Filed at:</td><td style="padding:8px 12px;">${timestamp}</td></tr>
  </table>

  <h3>Next Steps</h3>
  <ol style="line-height:1.8;">
    <li>Log into IMPI at: <a href="https://marcaenlinea.impi.gob.mx/MarcaEnLinea/">https://marcaenlinea.impi.gob.mx/MarcaEnLinea/</a></li>
    <li>Go to "Mis solicitudes" and find application ID <strong>${applicationId}</strong></li>
    <li>Review all filled fields carefully</li>
    <li>Click "Finalizar captura"</li>
    <li>Complete payment</li>
    <li>Sign with your CURP or e.firma</li>
  </ol>

  <p style="color:#b91c1c; font-weight:bold; border:1px solid #fca5a5; background:#fef2f2; padding:12px; border-radius:6px;">
    Important: The application is saved as a draft but NOT yet submitted to IMPI.
    You must complete payment and digital signature to formally file it.
  </p>
</body>
</html>`;

  await sendViaResend(subject, html);
}

export async function sendFailureEmail(
  formData: ImpiFormData,
  stepName: string,
  error: Error,
  jobId: string,
): Promise<void> {
  const subject = `IMPI Auto-Fill Failed — ${formData.denominacion}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Arial, sans-serif; color: #222; max-width: 640px; margin: 0 auto; padding: 24px;">
  <h2 style="color:#b91c1c;">IMPI Auto-Fill Failed</h2>
  <p>The automated filing for <strong>${formData.denominacion}</strong> failed at step <strong>${stepName}</strong>.</p>

  <table style="border-collapse:collapse; width:100%; margin:16px 0;">
    <tr style="background:#fef2f2;"><td style="padding:8px 12px; font-weight:bold; width:30%;">Error:</td><td style="padding:8px 12px; font-family:monospace; font-size:13px;">${error.message}</td></tr>
    <tr><td style="padding:8px 12px; font-weight:bold;">Step:</td><td style="padding:8px 12px;">${stepName}</td></tr>
    <tr style="background:#fef2f2;"><td style="padding:8px 12px; font-weight:bold;">Job ID:</td><td style="padding:8px 12px;">${jobId}</td></tr>
  </table>

  <p>Please file this application manually at:<br/>
  <a href="https://marcaenlinea.impi.gob.mx/MarcaEnLinea/">https://marcaenlinea.impi.gob.mx/MarcaEnLinea/</a></p>

  <h3>Application data submitted by client:</h3>
  <pre style="background:#f3f4f6; padding:16px; border-radius:6px; font-size:12px; overflow:auto; white-space:pre-wrap;">${JSON.stringify(formData, null, 2)}</pre>
</body>
</html>`;

  await sendViaResend(subject, html);
}
