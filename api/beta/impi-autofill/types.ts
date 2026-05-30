export interface ImpiFormData {
  // Section 1 — Trademark Details
  denominacion: string;
  tipoMarca: 'marca' | 'marca_colectiva' | 'aviso_comercial' | 'nombre_comercial';
  composicion: 'palabra' | 'diseno' | 'palabra_diseno';
  leyendasFig?: string;
  traduccion?: string;
  logoStoragePath?: string; // Supabase Storage path after upload

  // Section 2 — Products & Services
  metodoClasificacion: 'descripcion_libre' | 'lista_alfabetica' | 'titulos_clases';
  productosServicios: string;
  claseNiza: string;

  // Section 3 — Owner
  tipoDueno: 'persona_fisica' | 'empresa';
  nombreDueno?: string;
  primerApellido?: string;
  segundoApellido?: string;
  razonSocial?: string;
  rfcCurpDueno?: string;
  nacionalidadDueno: string;
  telefonoDueno?: string;
  emailDueno: string;

  // Section 4 — Prior Use
  haMarcaUsado: 'si' | 'no';
  fechaPrimerUso?: string;
  tieneEstablecimiento: 'si' | 'no';
  direccionEstablecimiento?: string;

  // Section 5 — Signatory
  curpFirmante?: string;
  nombreFirmante?: string;
  telefonoFirmante?: string;
  emailFirmante?: string;
  paisFirmante: string;
  estadoFirmante: string;
  municipioFirmante: string;
  coloniaFirmante: string;
  calleFirmante: string;
  numExtFirmante: string;
  numIntFirmante?: string;
  cpFirmante: string;

  // Section 6 — Priority Claim
  tienePrioridad: 'si' | 'no';
  paisPrioridad?: string;
  fechaPrioridad?: string;
  numExpedientePrioridad?: string;

  // Section 7 — Client Contact
  clienteNombre: string;
  clienteEmail: string;

  // Internal
  token?: string;
}

export const REQUIRED_FIELDS: (keyof ImpiFormData)[] = [
  'denominacion',
  'tipoMarca',
  'composicion',
  'metodoClasificacion',
  'productosServicios',
  'claseNiza',
  'tipoDueno',
  'nacionalidadDueno',
  'emailDueno',
  'haMarcaUsado',
  'tieneEstablecimiento',
  'paisFirmante',
  'estadoFirmante',
  'municipioFirmante',
  'coloniaFirmante',
  'calleFirmante',
  'numExtFirmante',
  'cpFirmante',
  'tienePrioridad',
  'clienteNombre',
  'clienteEmail',
];
