import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import type { ImpiFormData } from './types.js';
import { REQUIRED_FIELDS } from './types.js';

function makeSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  return createClient(url, key);
}

export const maxDuration = 10;

const ALLOWED_ORIGINS = [
    'https://mexicotrademarkcenter.com',
    'https://www.mexicotrademarkcenter.com',
    'http://localhost:5173',
    'http://localhost:3000',
  ];

function setCors(req: VercelRequest, res: VercelResponse) {
    const origin = req.headers.origin as string | undefined;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
          res.setHeader('Access-Control-Allow-Origin', 'https://mexicotrademarkcenter.com');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-beta-token');
    res.setHeader('Access-Control-Max-Age', '86400');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCors(req, res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
        return res.status(204).end();
  }

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

  // Persist job row immediately so the status page can show "queued"
  try {
    const supabase = makeSupabase();
    await supabase.from('impi_jobs').insert({
      id: jobId,
      status: 'queued',
      current_step: 'queued',
      mark_name: formData.denominacion ?? '',
      cliente_nombre: formData.clienteNombre ?? '',
      cliente_email: formData.clienteEmail ?? '',
    });
  } catch (err) {
    console.error(`[submit] Failed to insert impi_jobs row for ${jobId}:`, (err as Error).message);
  }

  // Fire-and-forget: trigger the Playwright worker
  const workerBase = process.env.VERCEL_URL ? ('https://' + process.env.VERCEL_URL) : 'http://localhost:3000';
  const workerUrl = workerBase + '/api/beta/impi-autofill/worker';

  fetch(workerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': process.env.BETA_SECRET || '',
    },
    body: JSON.stringify({ formData, jobId }),
  }).then(function(r) {
    console.log('[submit] Worker triggered, status: ' + r.status);
  }).catch(function(err) {
    console.error('[submit] Worker error: ' + err.message);
  });

  // Return immediately
  return res.status(200).json({ success: true, jobId });
}
