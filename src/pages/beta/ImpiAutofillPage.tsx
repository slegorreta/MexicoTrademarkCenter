import { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const BETA_SECRET = import.meta.env.VITE_BETA_SECRET as string;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type TipoMarca = 'marca' | 'marca_colectiva' | 'aviso_comercial' | 'nombre_comercial';
type Composicion = 'palabra' | 'diseno' | 'palabra_diseno';
type MetodoClasificacion = 'descripcion_libre' | 'lista_alfabetica' | 'titulos_clases';
type TipoDueno = 'persona_fisica' | 'empresa';

interface FormState {
  denominacion: string;
  tipoMarca: TipoMarca;
  composicion: Composicion;
  leyendasFig: string;
  traduccion: string;
  metodoClasificacion: MetodoClasificacion;
  productosServicios: string;
  claseNiza: string;
  tipoDueno: TipoDueno;
  nombreDueno: string;
  primerApellido: string;
  segundoApellido: string;
  razonSocial: string;
  rfcCurpDueno: string;
  nacionalidadDueno: string;
  telefonoDueno: string;
  emailDueno: string;
  haMarcaUsado: 'si' | 'no';
  fechaPrimerUso: string;
  tieneEstablecimiento: 'si' | 'no';
  direccionEstablecimiento: string;
  curpFirmante: string;
  nombreFirmante: string;
  telefonoFirmante: string;
  emailFirmante: string;
  paisFirmante: string;
  estadoFirmante: string;
  municipioFirmante: string;
  coloniaFirmante: string;
  calleFirmante: string;
  numExtFirmante: string;
  numIntFirmante: string;
  cpFirmante: string;
  tienePrioridad: 'si' | 'no';
  paisPrioridad: string;
  fechaPrioridad: string;
  numExpedientePrioridad: string;
  clienteNombre: string;
  clienteEmail: string;
}

const initialForm: FormState = {
  denominacion: '',
  tipoMarca: 'marca',
  composicion: 'palabra',
  leyendasFig: '',
  traduccion: '',
  metodoClasificacion: 'descripcion_libre',
  productosServicios: '',
  claseNiza: '',
  tipoDueno: 'persona_fisica',
  nombreDueno: '',
  primerApellido: '',
  segundoApellido: '',
  razonSocial: '',
  rfcCurpDueno: '',
  nacionalidadDueno: '',
  telefonoDueno: '',
  emailDueno: '',
  haMarcaUsado: 'no',
  fechaPrimerUso: '',
  tieneEstablecimiento: 'no',
  direccionEstablecimiento: '',
  curpFirmante: '',
  nombreFirmante: '',
  telefonoFirmante: '',
  emailFirmante: 'sergiolegorreta@yahoo.com',
  paisFirmante: 'MEXICO',
  estadoFirmante: '',
  municipioFirmante: '',
  coloniaFirmante: '',
  calleFirmante: '',
  numExtFirmante: '',
  numIntFirmante: '',
  cpFirmante: '',
  tienePrioridad: 'no',
  paisPrioridad: '',
  fechaPrioridad: '',
  numExpedientePrioridad: '',
  clienteNombre: '',
  clienteEmail: '',
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const selectCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const textareaCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y';

function SectionHeader({ num, title }: { num: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-2 border-b border-gray-200">
      <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">{num}</span>
      <h2 className="text-base font-bold text-gray-800">{title}</h2>
    </div>
  );
}

export default function ImpiAutofillPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [form, setForm] = useState<FormState>(initialForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  if (!BETA_SECRET || token !== BETA_SECRET) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 500, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '32px 24px' }}>
          <h1 style={{ color: '#b91c1c', fontSize: 24, marginBottom: 8 }}>403 — Access Denied</h1>
          <p style={{ color: '#6b7280', fontSize: 14 }}>
            This page requires a valid beta access token.<br />
            Append <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>?token=YOUR_TOKEN</code> to the URL.
          </p>
        </div>
      </div>
    );
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      let logoStoragePath: string | undefined;

      // Upload logo to Supabase Storage first if provided
      if (logoFile) {
        const ext = logoFile.name.split('.').pop() ?? 'pdf';
        const path = `logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('beta-logo-uploads').upload(path, logoFile);
        if (uploadError) throw new Error(`Logo upload failed: ${uploadError.message}`);
        logoStoragePath = path;
      }

      const payload = {
        ...form,
        logoStoragePath,
        token,
      };

      const res = await fetch('/api/beta/impi-autofill/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`);

      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '60px auto', padding: '0 24px' }}>
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '32px 24px' }}>
          <h2 style={{ color: '#166534', fontSize: 20, marginBottom: 12 }}>Application Queued Successfully</h2>
          <p style={{ color: '#374151', lineHeight: 1.6 }}>
            Your application has been queued. IMPI auto-fill is running in the background.
            You will receive an email at <strong>sergio.legorreta@lawtaem.com</strong> when complete.
          </p>
          <button
            onClick={() => { setSuccess(false); setForm(initialForm); setLogoFile(null); }}
            style={{ marginTop: 20, padding: '8px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
          >
            Submit another application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#f9fafb' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ background: '#1d4ed8', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.05em' }}>BETA</span>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>IMPI Auto-Fill — Marca en Línea</h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
            Complete all required fields. The form will be automatically submitted to IMPI's Marca en Línea portal as a draft.
            The attorney will receive a confirmation email when the draft is ready for review.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ── Section 1 — Trademark Details ────────────────────────────── */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '24px', marginBottom: 20 }}>
            <SectionHeader num={1} title="Trademark Details (Tab 1 — ¿Qué quieres registrar?)" />

            <Field label="Trademark Name (Denominación)" required>
              <input className={inputCls} required value={form.denominacion} onChange={e => set('denominacion', e.target.value)} placeholder="e.g. MARCATEST" />
            </Field>

            <Field label="Trademark Type (Tipo de marca)" required>
              <select className={selectCls} value={form.tipoMarca} onChange={e => set('tipoMarca', e.target.value as TipoMarca)}>
                <option value="marca">Marca</option>
                <option value="marca_colectiva">Marca colectiva</option>
                <option value="aviso_comercial">Aviso comercial</option>
                <option value="nombre_comercial">Nombre comercial</option>
              </select>
            </Field>

            <Field label="Mark Composition (Composición)" required>
              <select className={selectCls} value={form.composicion} onChange={e => set('composicion', e.target.value as Composicion)}>
                <option value="palabra">Palabra(s) — Word only</option>
                <option value="diseno">Diseño(s) — Design only</option>
                <option value="palabra_diseno">Palabras con diseños — Word + Design</option>
              </select>
            </Field>

            <Field label="Non-Registrable Elements (Leyendas figurativas — optional)">
              <textarea className={textareaCls} rows={2} value={form.leyendasFig} onChange={e => set('leyendasFig', e.target.value)} placeholder="Elements that cannot be registered exclusively" />
            </Field>

            <Field label="Translation of foreign words (optional)">
              <textarea className={textareaCls} rows={2} value={form.traduccion} onChange={e => set('traduccion', e.target.value)} placeholder="Translation if mark contains non-Spanish words" />
            </Field>

            {(form.composicion === 'diseno' || form.composicion === 'palabra_diseno') && (
              <Field label="Logo / Design File (PDF only — optional)">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/svg+xml"
                  onChange={e => setLogoFile(e.target.files?.[0] ?? null)}
                  className={inputCls}
                />
                {logoFile && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Selected: {logoFile.name} ({(logoFile.size / 1024).toFixed(0)} KB)</p>}
              </Field>
            )}
          </div>

          {/* ── Section 2 — Products & Services ──────────────────────────── */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '24px', marginBottom: 20 }}>
            <SectionHeader num={2} title="Products & Services (Tab 2 — Descripción de productos o servicios)" />

            <Field label="Classification Method (Método de clasificación)" required>
              <select className={selectCls} value={form.metodoClasificacion} onChange={e => set('metodoClasificacion', e.target.value as MetodoClasificacion)}>
                <option value="descripcion_libre">Descripción libre (recommended for beta)</option>
                <option value="lista_alfabetica">Lista alfabética</option>
                <option value="titulos_clases">Títulos de clases</option>
              </select>
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Descripción libre is recommended — other methods require manual completion by the attorney.</p>
            </Field>

            <Field label="Products / Services Description" required>
              <textarea className={textareaCls} rows={4} required value={form.productosServicios} onChange={e => set('productosServicios', e.target.value)} placeholder="Describe the goods or services covered by this trademark..." />
            </Field>

            <Field label="Nice Class Number(s)" required>
              <input className={inputCls} required value={form.claseNiza} onChange={e => set('claseNiza', e.target.value)} placeholder='e.g. "25" or "25, 35"' />
            </Field>
          </div>

          {/* ── Section 3 — Owner / Applicant ────────────────────────────── */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '24px', marginBottom: 20 }}>
            <SectionHeader num={3} title="Owner / Applicant (Tab 3 — Datos del dueño de la marca)" />

            <Field label="Owner Type (Tipo de persona)" required>
              <select className={selectCls} value={form.tipoDueno} onChange={e => set('tipoDueno', e.target.value as TipoDueno)}>
                <option value="persona_fisica">Persona física (Individual)</option>
                <option value="empresa">Empresa (Company)</option>
              </select>
            </Field>

            {form.tipoDueno === 'persona_fisica' ? (
              <>
                <Field label="First Name(s) (Nombre)" required>
                  <input className={inputCls} required value={form.nombreDueno} onChange={e => set('nombreDueno', e.target.value)} />
                </Field>
                <Field label="First Surname (Primer apellido)" required>
                  <input className={inputCls} required value={form.primerApellido} onChange={e => set('primerApellido', e.target.value)} />
                </Field>
                <Field label="Second Surname (Segundo apellido — optional)">
                  <input className={inputCls} value={form.segundoApellido} onChange={e => set('segundoApellido', e.target.value)} />
                </Field>
              </>
            ) : (
              <>
                <Field label="Company Name (Razón social)" required>
                  <input className={inputCls} required value={form.razonSocial} onChange={e => set('razonSocial', e.target.value)} />
                </Field>
                <Field label="RFC / CURP (optional)">
                  <input className={inputCls} value={form.rfcCurpDueno} onChange={e => set('rfcCurpDueno', e.target.value)} />
                </Field>
              </>
            )}

            <Field label="Nationality (Nacionalidad)" required>
              <input className={inputCls} required value={form.nacionalidadDueno} onChange={e => set('nacionalidadDueno', e.target.value)} placeholder="e.g. MEXICO or ESTADOS UNIDOS" />
            </Field>

            <Field label="Phone (optional)">
              <input className={inputCls} value={form.telefonoDueno} onChange={e => set('telefonoDueno', e.target.value)} placeholder="e.g. 5512345678" />
            </Field>

            <Field label="Email" required>
              <input className={inputCls} type="email" required value={form.emailDueno} onChange={e => set('emailDueno', e.target.value)} />
            </Field>
          </div>

          {/* ── Section 4 — Prior Use ─────────────────────────────────────── */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '24px', marginBottom: 20 }}>
            <SectionHeader num={4} title="Prior Use (Tab 4 — ¿Has usado tu marca?)" />

            <Field label="Has the mark been used?" required>
              <div style={{ display: 'flex', gap: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                  <input type="radio" value="si" checked={form.haMarcaUsado === 'si'} onChange={() => set('haMarcaUsado', 'si')} /> Yes
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                  <input type="radio" value="no" checked={form.haMarcaUsado === 'no'} onChange={() => set('haMarcaUsado', 'no')} /> No
                </label>
              </div>
            </Field>

            {form.haMarcaUsado === 'si' && (
              <Field label="First Use Date (Fecha de primer uso)" required>
                <input className={inputCls} type="date" required value={form.fechaPrimerUso} onChange={e => set('fechaPrimerUso', e.target.value)} />
              </Field>
            )}

            <Field label="Does applicant have a physical establishment?" required>
              <div style={{ display: 'flex', gap: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                  <input type="radio" value="si" checked={form.tieneEstablecimiento === 'si'} onChange={() => set('tieneEstablecimiento', 'si')} /> Yes
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                  <input type="radio" value="no" checked={form.tieneEstablecimiento === 'no'} onChange={() => set('tieneEstablecimiento', 'no')} /> No
                </label>
              </div>
            </Field>

            {form.tieneEstablecimiento === 'si' && (
              <Field label="Establishment Address" required>
                <textarea className={textareaCls} rows={3} required value={form.direccionEstablecimiento} onChange={e => set('direccionEstablecimiento', e.target.value)} placeholder="Full address of the establishment" />
              </Field>
            )}
          </div>

          {/* ── Section 5 — Signatory / Attorney ─────────────────────────── */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '24px', marginBottom: 20 }}>
            <SectionHeader num={5} title="Signatory / Attorney (Tab 5 — Datos de quien firma la solicitud)" />
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, background: '#f3f4f6', padding: '8px 12px', borderRadius: 6 }}>
              Most fields are pre-filled from your PASE account. Update only if they differ.
            </p>

            <Field label="CURP del firmante (optional — IMPI may pre-fill from session)">
              <input className={inputCls} value={form.curpFirmante} onChange={e => set('curpFirmante', e.target.value)} placeholder="Leave blank to use PASE account CURP" />
            </Field>

            <Field label="Name (optional)">
              <input className={inputCls} value={form.nombreFirmante} onChange={e => set('nombreFirmante', e.target.value)} />
            </Field>

            <Field label="Phone (optional)">
              <input className={inputCls} value={form.telefonoFirmante} onChange={e => set('telefonoFirmante', e.target.value)} />
            </Field>

            <Field label="Email (optional)">
              <input className={inputCls} type="email" value={form.emailFirmante} onChange={e => set('emailFirmante', e.target.value)} />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Country" required>
                <input className={inputCls} required value={form.paisFirmante} onChange={e => set('paisFirmante', e.target.value)} />
              </Field>
              <Field label="State (Estado)" required>
                <input className={inputCls} required value={form.estadoFirmante} onChange={e => set('estadoFirmante', e.target.value)} />
              </Field>
              <Field label="Municipality (Municipio)" required>
                <input className={inputCls} required value={form.municipioFirmante} onChange={e => set('municipioFirmante', e.target.value)} />
              </Field>
              <Field label="Colonia" required>
                <input className={inputCls} required value={form.coloniaFirmante} onChange={e => set('coloniaFirmante', e.target.value)} />
              </Field>
            </div>

            <Field label="Street (Calle)" required>
              <input className={inputCls} required value={form.calleFirmante} onChange={e => set('calleFirmante', e.target.value)} />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Field label="Ext. Number" required>
                <input className={inputCls} required value={form.numExtFirmante} onChange={e => set('numExtFirmante', e.target.value)} />
              </Field>
              <Field label="Int. Number (optional)">
                <input className={inputCls} value={form.numIntFirmante} onChange={e => set('numIntFirmante', e.target.value)} />
              </Field>
              <Field label="Postal Code (CP)" required>
                <input className={inputCls} required value={form.cpFirmante} onChange={e => set('cpFirmante', e.target.value)} />
              </Field>
            </div>
          </div>

          {/* ── Section 6 — Priority Claim ────────────────────────────────── */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '24px', marginBottom: 20 }}>
            <SectionHeader num={6} title="Priority Claim (Tab 6 — ¿Has presentado tu marca en otro país?)" />

            <Field label="Priority claim?" required>
              <div style={{ display: 'flex', gap: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                  <input type="radio" value="si" checked={form.tienePrioridad === 'si'} onChange={() => set('tienePrioridad', 'si')} /> Yes
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                  <input type="radio" value="no" checked={form.tienePrioridad === 'no'} onChange={() => set('tienePrioridad', 'no')} /> No
                </label>
              </div>
            </Field>

            {form.tienePrioridad === 'si' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Country of Priority" required>
                  <input className={inputCls} required value={form.paisPrioridad} onChange={e => set('paisPrioridad', e.target.value)} />
                </Field>
                <Field label="Priority Date" required>
                  <input className={inputCls} type="date" required value={form.fechaPrioridad} onChange={e => set('fechaPrioridad', e.target.value)} />
                </Field>
                <div style={{ gridColumn: '1/-1' }}>
                  <Field label="Foreign Application Number" required>
                    <input className={inputCls} required value={form.numExpedientePrioridad} onChange={e => set('numExpedientePrioridad', e.target.value)} />
                  </Field>
                </div>
              </div>
            )}
          </div>

          {/* ── Section 7 — Client Contact ────────────────────────────────── */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '24px', marginBottom: 24 }}>
            <SectionHeader num={7} title="Client Contact (for confirmation email records)" />

            <Field label="Client Name" required>
              <input className={inputCls} required value={form.clienteNombre} onChange={e => set('clienteNombre', e.target.value)} placeholder="Client's full name" />
            </Field>

            <Field label="Client Email" required>
              <input className={inputCls} type="email" required value={form.clienteEmail} onChange={e => set('clienteEmail', e.target.value)} placeholder="client@example.com" />
            </Field>
          </div>

          {/* Error message */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: '#b91c1c' }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px',
              background: submitting ? '#93c5fd' : '#1d4ed8',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'background 0.2s',
            }}
          >
            {submitting ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                Submitting to IMPI in the background...
              </>
            ) : (
              'Submit & Auto-Fill IMPI'
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 24 }}>
          Beta — internal use only. This form automatically fills the IMPI Marca en Línea portal and stops before "Finalizar captura".
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
