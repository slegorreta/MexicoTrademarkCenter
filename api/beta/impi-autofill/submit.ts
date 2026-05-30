import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import type { ImpiFormData } from './types';
import { REQUIRED_FIELDS } from './types';

export const maxDuration = 10;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body as Partial<ImpiFormData> & { token?: string };

  // Token validation
  const token = body.token ?? req.headers['x-beta-token'];
  if (!token || token !== process.env.BETA_SECRET) {
    return res.status(403).json({ error: 'Invalid or missing beta token' });
  }

  // Required field validation
  const missing: string[] = [];
  for (const field of REQUIRED_FIELDS) {
    const val = body[field];
    if (val === undefined || val === null || val === '') {
      missing.push(field);
    }
  }

  // Conditional required fields
  if (body.tipoDueno === 'persona_fisica') {
    if (!body.nombreDueno) missing.push('nombreDueno');
    if (!body.primerApellido) missing.push('primerApellido');
  }
  if (body.tipoDueno === 'empresa') {
    if (!body.razonSocial) missing.push('razonSocial');
  }
  if (body.haMarcaUsado === 'si' && !body.fechaPrimerUso) {
    missing.push('fechaPrimerUso');
  }
  if (body.tieneEstablecimiento === 'si' && !body.direccionEstablecimiento) {
    missing.push('direccionEstablecimiento');
  }
  if (body.tienePrioridad === 'si') {
    if (!body.paisPrioridad) missing.push('paisPrioridad');
    if (!body.fechaPrioridad) missing.push('fechaPrioridad');
    if (!body.numExpedientePrioridad) missing.push('numExpedientePrioridad');
  }

  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  const jobId = randomUUID();
  const formData = { ...body } as ImpiFormData;
  delete formData.token;

  // Return immediately
  res.status(200).json({ success: true, jobId });

  // Fire-and-forget: trigger the Playwright worker asynchronously
  const workerUrl = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/beta/impi-autofill/worker`;

  fetch(workerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': process.env.BETA_SECRET ?? '',
    },
    body: JSON.stringify({ formData, jobId }),
  }).catch((err: Error) => {
    console.error(`[submit] Failed to trigger worker for job ${jobId}:`, err.message);
  });
}
