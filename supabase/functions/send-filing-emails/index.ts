import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = "Mexico Trademark Center <tm@mexicotrademarkcenter.com>";
const FILING_TO_EMAIL = "tm@mexicotrademarkcenter.com";
const FILING_CC_EMAIL = "sergiolegorreta@yahoo.com";

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  cc?: string[]
) {
  const body: Record<string, unknown> = { from: FROM_EMAIL, to: [to], subject, html };
  if (cc?.length) body.cc = cc;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

/** A bordered copy-paste value box — monospace, light background */
function copyBox(value: string): string {
  if (!value || value === "—") {
    return `<span style="color:#999;font-style:italic;font-size:13px;">— not provided —</span>`;
  }
  return `<span style="display:inline-block;font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:600;background:#f4f4f4;border:1px solid #ccc;border-radius:3px;padding:3px 10px;letter-spacing:0.02em;color:#111;">${value}</span>`;
}

/** Section header with a dark-green left accent */
function sectionHeader(step: string, impiLabel: string, subtitle?: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 10px;">
    <tr>
      <td style="border-left:4px solid #1a2e1a;padding:6px 14px;background:#f0f4f0;">
        <div style="font-size:11px;font-weight:700;color:#1a2e1a;letter-spacing:0.12em;text-transform:uppercase;">${step}</div>
        <div style="font-size:14px;font-weight:700;color:#111;margin-top:2px;">${impiLabel}</div>
        ${subtitle ? `<div style="font-size:11px;color:#666;margin-top:2px;">${subtitle}</div>` : ""}
      </td>
    </tr>
  </table>`;
}

/** A standard two-column field row: IMPI label | value */
function fieldRow(impiLabel: string, value: string, note?: string): string {
  return `
  <tr>
    <td style="padding:7px 12px;border:1px solid #ddd;background:#fafafa;width:38%;font-size:12px;font-weight:700;color:#444;vertical-align:top;">${impiLabel}</td>
    <td style="padding:7px 12px;border:1px solid #ddd;font-size:13px;color:#111;vertical-align:top;">
      ${copyBox(value)}
      ${note ? `<div style="font-size:11px;color:#888;margin-top:4px;">${note}</div>` : ""}
    </td>
  </tr>`;
}

/** Warning banner (amber) */
function warningBox(msg: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0;">
    <tr>
      <td style="background:#fff8e1;border:1px solid #f5c842;border-radius:4px;padding:10px 14px;font-size:12px;color:#7a5500;">
        &#9888;&nbsp; ${msg}
      </td>
    </tr>
  </table>`;
}

/** Per-class goods/services block */
function classBlock(c: Record<string, unknown>, idx: number): string {
  const classNum = String(c.class_number ?? "?");
  const titleEn = String(c.class_title_en ?? "");
  const gsEs = String(c.goods_services_es ?? c.goods_services_en ?? "");
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;border:1px solid #ccc;border-radius:4px;overflow:hidden;">
    <tr>
      <td style="background:#1a2e1a;padding:7px 14px;">
        <span style="font-size:13px;font-weight:700;color:#c9a84c;font-family:'Courier New',Courier,monospace;">
          CLASE ${classNum}${titleEn ? ` — ${titleEn}` : ""}
        </span>
        <span style="font-size:11px;color:#9db89d;margin-left:10px;">(Solicitud #${idx + 1} ante el IMPI)</span>
      </td>
    </tr>
    <tr>
      <td style="padding:10px 14px;background:#fff;">
        <div style="font-size:11px;font-weight:700;color:#666;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.08em;">Descripción de productos o servicios (Spanish — paste verbatim into IMPI)</div>
        <div style="font-family:'Courier New',Courier,monospace;font-size:13px;background:#f4f4f4;border:1px solid #ccc;border-radius:3px;padding:10px 12px;line-height:1.7;color:#111;word-break:break-word;">${gsEs || "<em style='color:#999;'>— No Spanish description available — translate before filing —</em>"}</div>
      </td>
    </tr>
  </table>`;
}

export function buildInstructionFormHtml(
  app: Record<string, unknown>,
  client: Record<string, unknown>,
  trademark: Record<string, unknown>,
  classes: Record<string, unknown>[],
  _goodsServices: Record<string, unknown> | null,
  logoUrl: string | null
): string {

  // ── Derived values ──────────────────────────────────────────────────────────

  const markType = String(trademark.mark_type ?? "word");
  const impiFigureType = String(trademark.impi_figure_type ?? "marca");

  const figureTypeLabel: Record<string, string> = {
    marca: "Marca",
    marca_colectiva: "Marca Colectiva",
    aviso_comercial: "Aviso Comercial",
    nombre_comercial: "Nombre Comercial",
    imagen_comercial: "Imagen Comercial",
  };

  const markTypeLabel: Record<string, string> = {
    word: "Denominativa (solo palabras)",
    design: "Figurativa (solo diseño / logotipo)",
    combined: "Mixta (palabras + diseño)",
    three_dimensional: "Tridimensional",
    trade_name: "Nombre Comercial",
    slogan: "Aviso Comercial (eslogan)",
  };

  const isDesignMark = markType === "design" || markType === "combined";
  const isCollective = impiFigureType === "marca_colectiva";
  const hasLogo = !!logoUrl;

  // Priority claims — prefer new array, fall back to legacy single fields
  type PriorityClaim = { country: string; app_number?: string; appNumber?: string; filing_date?: string; filingDate?: string };
  let priorityClaims: PriorityClaim[] = [];
  if (Array.isArray(app.priority_claims) && (app.priority_claims as PriorityClaim[]).length > 0) {
    priorityClaims = app.priority_claims as PriorityClaim[];
  } else if (app.priority_claimed && app.priority_country) {
    priorityClaims = [{
      country: String(app.priority_country ?? ""),
      app_number: String(app.priority_app_number ?? ""),
      filing_date: String(app.priority_filing_date ?? ""),
    }];
  }

  // Co-owners
  type CoOwner = { legalName?: string; legal_name?: string; country?: string; address?: string; city?: string };
  const coOwners: CoOwner[] = Array.isArray(client.co_owners) ? (client.co_owners as CoOwner[]) : [];

  // Establishment address
  type AddressObj = { address?: string; city?: string; stateProvince?: string; state_province?: string; postalCode?: string; postal_code?: string; country?: string };
  const estAddr = app.establishment_address as AddressObj | null;
  const notifAddr = app.notification_address as AddressObj | null;

  const colorValue = trademark.claims_color
    ? String(trademark.color_description ?? "Como se muestra en color")
    : "Blanco y negro / sin reivindicación de color";

  const unprotectedElements = String(trademark.unprotected_elements ?? "").trim();
  const meaningSpanish = String(trademark.meaning_spanish ?? "").trim();
  const transliteration = String(trademark.transliteration ?? "").trim();
  const rfc = String(client.rfc ?? "").trim();
  const curp = String(client.curp ?? "").trim();
  const authorizedRep = String(client.authorized_representative ?? "").trim();

  // ── Section: Logo ──────────────────────────────────────────────────────────
  const logoSection = isDesignMark
    ? `
    ${sectionHeader("PASO 2b · IMPI CAMPO", "Logotipo de la Marca", "Cargar archivo GIF (máx. 1 MB) en el portal IMPI")}
    ${!hasLogo ? warningBox("No se cargó ningún logotipo. Para marcas de diseño o mixtas, el IMPI requiere un archivo GIF del logotipo (máx. 1 MB). Solicitar el archivo al cliente antes de presentar.") : ""}
    <table width="100%" cellpadding="0" cellspacing="0">
      <tbody>
        ${fieldRow("Archivo del logotipo", hasLogo ? "Ver imagen abajo — convertir a GIF si es necesario" : "— FALTA —", "El IMPI solo acepta formato GIF, máximo 1 MB. El nombre del archivo debe ser corto, sin acentos.")}
        ${fieldRow("Color", colorValue)}
      </tbody>
    </table>
    ${hasLogo ? `<div style="text-align:center;margin:12px 0;padding:12px;background:#f9f9f9;border:1px solid #ddd;border-radius:4px;"><img src="${logoUrl}" style="max-width:240px;max-height:150px;object-fit:contain;" alt="Logotipo de la marca"></div>` : ""}
    ${warningBox("Verificar que el archivo sea GIF y no supere 1 MB antes de cargar en IMPI.")}
    `
    : `
    ${sectionHeader("PASO 2b · IMPI CAMPO", "Logotipo de la Marca")}
    <table width="100%" cellpadding="0" cellspacing="0"><tbody>
      ${fieldRow("Tipo de marca", "MARCA DENOMINATIVA — no se requiere logotipo")}
    </tbody></table>
    `;

  // ── Section: Priority claims ───────────────────────────────────────────────
  const prioritySection = app.priority_claimed
    ? `
    ${sectionHeader("PASO 6 · IMPI CAMPO", "¿Has presentado tu marca en otro país? (Derecho de Prioridad)", `${priorityClaims.length} prioridad(es) — IMPI permite hasta 3`)}
    ${warningBox("Adjuntar copia certificada del documento de prioridad en la sección Anexos del portal. Si el documento no está en español, adjuntar también la traducción.")}
    <table width="100%" cellpadding="0" cellspacing="0"><tbody>
      ${fieldRow("¿Reclama prioridad?", "SÍ")}
    </tbody></table>
    ${priorityClaims.map((p, i) => `
    <div style="margin-top:10px;padding:10px 14px;border:1px solid #c8e0c8;border-radius:4px;background:#f0f7f0;">
      <div style="font-size:11px;font-weight:700;color:#1a2e1a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Prioridad ${i + 1} de ${priorityClaims.length}</div>
      <table width="100%" cellpadding="0" cellspacing="0"><tbody>
        ${fieldRow("País de prioridad", String(p.country ?? "—"))}
        ${fieldRow("Número de solicitud", String(p.app_number ?? p.appNumber ?? "—"))}
        ${fieldRow("Fecha de presentación", String(p.filing_date ?? p.filingDate ?? "—"))}
      </tbody></table>
    </div>`).join("")}
    `
    : `
    ${sectionHeader("PASO 6 · IMPI CAMPO", "¿Has presentado tu marca en otro país?")}
    <table width="100%" cellpadding="0" cellspacing="0"><tbody>
      ${fieldRow("¿Reclama prioridad?", "NO")}
    </tbody></table>
    `;

  // ── Section: Co-owners ─────────────────────────────────────────────────────
  const coOwnersSection = coOwners.length > 0
    ? `
    ${sectionHeader("PASO 4b · IMPI CAMPO", "Co-Titulares de la Marca", "IMPI permite múltiples titulares. Solo el domicilio del primer titular aparece en el formulario; los demás van en un anexo PDF.")}
    ${warningBox("Adjuntar documento con datos de los co-titulares en la sección Anexos. Indicar en el formulario cuántos titulares hay.")}
    ${coOwners.map((co, i) => `
    <div style="margin-top:10px;padding:10px 14px;border:1px solid #ddd;border-radius:4px;background:#fafafa;">
      <div style="font-size:11px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Co-Titular ${i + 1}</div>
      <table width="100%" cellpadding="0" cellspacing="0"><tbody>
        ${fieldRow("Nombre o Razón Social", String(co.legalName ?? co.legal_name ?? "—"))}
        ${fieldRow("País", String(co.country ?? "—"))}
        ${fieldRow("Ciudad", String(co.city ?? "—"))}
        ${fieldRow("Domicilio", String(co.address ?? "—"))}
      </tbody></table>
    </div>`).join("")}
    `
    : "";

  // ── Section: Establishment address ────────────────────────────────────────
  const establishmentSection = app.prior_use || app.usedInMexico || estAddr
    ? `
    ${sectionHeader("PASO 5b · IMPI CAMPO", "Datos del Establecimiento", "Requerido cuando se indica fecha de primer uso en México")}
    <table width="100%" cellpadding="0" cellspacing="0"><tbody>
      ${fieldRow("Calle y Número", String(estAddr?.address ?? client.address ?? "—"))}
      ${fieldRow("Ciudad", String(estAddr?.city ?? client.city ?? "—"))}
      ${fieldRow("Estado / Provincia", String(estAddr?.stateProvince ?? estAddr?.state_province ?? client.state_province ?? "—"))}
      ${fieldRow("Código Postal", String(estAddr?.postalCode ?? estAddr?.postal_code ?? client.postal_code ?? "—"))}
      ${fieldRow("País", String(estAddr?.country ?? client.country ?? "—"))}
    </tbody></table>
    `
    : "";

  // ── Section: Notification address ─────────────────────────────────────────
  const notificationSection = notifAddr
    ? `
    ${sectionHeader("PASO 4c · IMPI CAMPO", "Domicilio para Oír y Recibir Notificaciones", "Domicilio designado separado del comercial del titular (normalmente el despacho legal)")}
    <table width="100%" cellpadding="0" cellspacing="0"><tbody>
      ${fieldRow("Calle y Número", String(notifAddr.address ?? "—"))}
      ${fieldRow("Ciudad", String(notifAddr.city ?? "—"))}
      ${fieldRow("Estado", String(notifAddr.stateProvince ?? notifAddr.state_province ?? "—"))}
      ${fieldRow("Código Postal", String(notifAddr.postalCode ?? notifAddr.postal_code ?? "—"))}
      ${fieldRow("País", String(notifAddr.country ?? "—"))}
    </tbody></table>
    `
    : "";

  // ── Section: Annexes checklist ─────────────────────────────────────────────
  const hasRulesOfUse = !!trademark.rules_of_use_file_path;
  const hasPriorityDocs = priorityClaims.length > 0;

  function annexRow(doc: string, required: boolean, present: boolean, note: string): string {
    const status = present
      ? `<span style="color:#1a7a1a;font-weight:700;">&#10003; Adjuntar</span>`
      : required
      ? `<span style="color:#c0392b;font-weight:700;">&#9888; REQUERIDO — pendiente</span>`
      : `<span style="color:#aaa;">No aplica</span>`;
    return `<tr>
      <td style="padding:7px 12px;border:1px solid #ddd;font-size:13px;color:#111;">${doc}</td>
      <td style="padding:7px 12px;border:1px solid #ddd;font-size:12px;text-align:center;">${status}</td>
      <td style="padding:7px 12px;border:1px solid #ddd;font-size:11px;color:#666;">${note}</td>
    </tr>`;
  }

  const annexesSection = `
    ${sectionHeader("PASO 7 · IMPI CAMPO", "Anexos (Documentos a adjuntar en el portal IMPI)", "Verificar que cada documento requerido esté listo ANTES de iniciar la captura en IMPI")}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <thead>
        <tr style="background:#1a2e1a;">
          <th style="padding:8px 12px;font-size:12px;font-weight:700;color:#c9a84c;text-align:left;border:1px solid #0d1f0d;">Documento</th>
          <th style="padding:8px 12px;font-size:12px;font-weight:700;color:#c9a84c;text-align:center;border:1px solid #0d1f0d;width:160px;">Estado</th>
          <th style="padding:8px 12px;font-size:12px;font-weight:700;color:#c9a84c;text-align:left;border:1px solid #0d1f0d;">Nota</th>
        </tr>
      </thead>
      <tbody>
        ${annexRow(
          "Logotipo (GIF, máx. 1 MB)",
          isDesignMark,
          hasLogo,
          isDesignMark ? "Convertir a GIF si es necesario. Nombre de archivo corto, sin acentos." : "No requerido para marca denominativa."
        )}
        ${annexRow(
          "Documento de prioridad (copia certificada)",
          hasPriorityDocs,
          false,
          hasPriorityDocs ? "Obtener copia certificada del documento de prioridad de la oficina de origen." : "No aplica."
        )}
        ${annexRow(
          "Traducción al español del documento de prioridad",
          hasPriorityDocs,
          false,
          hasPriorityDocs ? "Requerida si el documento de prioridad no está en español." : "No aplica."
        )}
        ${annexRow(
          "Reglamento de Uso (PDF)",
          isCollective,
          hasRulesOfUse,
          isCollective ? "Obligatorio para marcas colectivas. Adjuntar en formato PDF." : "No aplica."
        )}
        ${annexRow(
          "Autorización / Poder Notarial",
          client.country !== "MX",
          !!authorizedRep,
          "Para solicitantes extranjeros se requiere autorización escrita. Una autorización por correo es suficiente según el IMPI."
        )}
        ${annexRow(
          "Datos de co-titulares (documento anexo)",
          coOwners.length > 1,
          coOwners.length > 1,
          coOwners.length > 1 ? `Hay ${coOwners.length} co-titulares. Solo el domicilio del primer titular va en el formulario.` : "No aplica."
        )}
      </tbody>
    </table>
  `;

  // ── Section: Per-class submission reminder ────────────────────────────────
  const multiClassReminder = classes.length > 1
    ? `
    ${sectionHeader("AVISO IMPORTANTE", "México es país de una sola clase — presentar solicitudes separadas", `${classes.length} solicitudes IMPI independientes — ${classes.length} pagos de derechos`)}
    ${warningBox(`Esta instrucción incluye ${classes.length} clases de Niza. En México se debe presentar una solicitud por separado ante el IMPI para cada clase. Cada una generará su propio número de expediente y requerirá su propio pago de derechos gubernamentales.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:8px;">
      <thead>
        <tr style="background:#f0f0f0;">
          <th style="padding:7px 12px;font-size:12px;font-weight:700;color:#333;text-align:center;border:1px solid #ddd;width:80px;">Clase</th>
          <th style="padding:7px 12px;font-size:12px;font-weight:700;color:#333;text-align:left;border:1px solid #ddd;">Título (EN)</th>
          <th style="padding:7px 12px;font-size:12px;font-weight:700;color:#333;text-align:center;border:1px solid #ddd;width:120px;">Solicitud #</th>
        </tr>
      </thead>
      <tbody>
        ${classes.map((c, i) => `<tr>
          <td style="padding:7px 12px;border:1px solid #ddd;font-size:13px;font-weight:700;text-align:center;background:#fafafa;">${c.class_number}</td>
          <td style="padding:7px 12px;border:1px solid #ddd;font-size:13px;color:#333;">${String(c.class_title_en ?? "")}</td>
          <td style="padding:7px 12px;border:1px solid #ddd;font-size:12px;color:#888;text-align:center;">Solicitud ${i + 1} de ${classes.length}</td>
        </tr>`).join("")}
      </tbody>
    </table>
    `
    : "";

  // ── Assemble full HTML ─────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
</head>
<body style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111;max-width:820px;margin:0 auto;padding:0;background:#f5f5f5;">

<!-- HEADER -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a2e1a;">
  <tr>
    <td style="padding:16px 28px;">
      <div style="font-size:10px;letter-spacing:3px;color:#c9a84c;font-weight:700;text-transform:uppercase;">Mexico Trademark Center</div>
      <div style="font-size:16px;font-weight:700;color:#fff;margin-top:4px;">HOJA DE INSTRUCCIÓN PARA TRÁMITE ANTE EL IMPI</div>
      <div style="font-size:11px;color:#9db89d;margin-top:3px;">IMPI Marca en Línea — Guía de captura en orden de portal</div>
    </td>
    <td style="padding:16px 28px;text-align:right;vertical-align:middle;">
      <div style="font-size:10px;color:#9db89d;margin-bottom:3px;">Referencia MTC</div>
      <div style="font-family:'Courier New',Courier,monospace;font-size:18px;font-weight:700;color:#c9a84c;letter-spacing:0.06em;">${String(app.case_number)}</div>
      <div style="font-size:10px;color:#9db89d;margin-top:3px;">${new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}</div>
    </td>
  </tr>
</table>

<!-- COPY-PASTE TIP BANNER -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0;">
  <tr>
    <td style="background:#fff8e1;border-bottom:2px solid #f5c842;padding:10px 28px;">
      <span style="font-size:12px;color:#7a5500;font-weight:700;">&#128203; INSTRUCCIONES PARA EL TRAMITADOR:</span>
      <span style="font-size:12px;color:#7a5500;margin-left:6px;">Cada sección de este documento corresponde exactamente a un paso del portal <strong>Marca en Línea del IMPI</strong>, en el mismo orden de captura. Los valores en cajas grises deben copiarse y pegarse tal cual en el portal. Verificar todos los anexos antes de iniciar.</span>
    </td>
  </tr>
</table>

<!-- CONTENT WRAPPER -->
<div style="background:#fff;padding:0 28px 28px;">

  <!-- ═══════════════════════════════════════════════════════════════════════
       PASO 1 · ¿QUÉ QUIERES REGISTRAR?
       ═══════════════════════════════════════════════════════════════════════ -->
  ${sectionHeader("PASO 1 · IMPI CAMPO", "¿Qué quieres registrar?", "Seleccionar la figura legal y el tipo de signo en el portal")}
  <table width="100%" cellpadding="0" cellspacing="0"><tbody>
    ${fieldRow("Figura legal (Tipo de solicitud)", figureTypeLabel[impiFigureType] ?? impiFigureType)}
    ${fieldRow("Tipo de signo (composición)", markTypeLabel[markType] ?? markType)}
  </tbody></table>
  ${isCollective ? warningBox("MARCA COLECTIVA: El IMPI requiere adjuntar el Reglamento de Uso en PDF en la sección Anexos. Verificar que esté disponible antes de continuar.") : ""}

  <!-- ═══════════════════════════════════════════════════════════════════════
       PASO 2a · NOMBRE DE LA MARCA
       ═══════════════════════════════════════════════════════════════════════ -->
  ${sectionHeader("PASO 2a · IMPI CAMPO", "Nombre de la Marca", "Escribir exactamente el nombre tal como aparecerá en el registro")}
  <table width="100%" cellpadding="0" cellspacing="0"><tbody>
    ${fieldRow("Nombre de la marca", String(trademark.mark_name ?? "—"))}
    ${fieldRow("Idioma de la marca", String(trademark.mark_language ?? "—"))}
    ${trademark.contains_non_spanish
      ? fieldRow("Significado en español", meaningSpanish || "— pendiente —", "El IMPI requiere el significado en español de palabras extranjeras")
      : ""}
    ${transliteration
      ? fieldRow("Transliteración", transliteration, "Para marcas con caracteres no latinos")
      : ""}
  </tbody></table>

  <!-- ═══════════════════════════════════════════════════════════════════════
       PASO 2b / 2c · LOGOTIPO + COLOR
       ═══════════════════════════════════════════════════════════════════════ -->
  ${logoSection}

  <!-- ═══════════════════════════════════════════════════════════════════════
       PASO 2d · ELEMENTOS SIN PROTECCIÓN
       ═══════════════════════════════════════════════════════════════════════ -->
  ${sectionHeader("PASO 2d · IMPI CAMPO", "Elementos sobre los cuales NO se solicita protección", "Solo aplica a marcas con diseño — dejar vacío en marcas denominativas")}
  <table width="100%" cellpadding="0" cellspacing="0"><tbody>
    ${fieldRow(
      "Elementos sin protección",
      isDesignMark && unprotectedElements ? unprotectedElements : isDesignMark ? "— no proporcionado — verificar con cliente —" : "N/A — Marca denominativa",
      isDesignMark ? "Incluir letras, palabras, números o frases que aparecen en el diseño pero NO se reivindican (ej. Hecho en México, Cont. Neto 750 ml, talla M)" : ""
    )}
  </tbody></table>

  <!-- ═══════════════════════════════════════════════════════════════════════
       PASO 3 · DESCRIPCIÓN DE PRODUCTOS O SERVICIOS (POR CLASE)
       ═══════════════════════════════════════════════════════════════════════ -->
  ${sectionHeader("PASO 3 · IMPI CAMPO", "Descripción de Productos o Servicios", "Una entrada por clase — separar los conceptos con punto y coma")}
  <div style="font-size:11px;color:#666;margin-bottom:10px;padding:8px 12px;background:#f9f9f9;border:1px solid #e0e0e0;border-radius:3px;">
    <strong>Formato IMPI:</strong> Indicar los productos o servicios separados por punto y coma. Ejemplo: <em>Bujías de encendido para motores; máquinas industriales; herramientas manuales.</em>
    Si se registran varias clases, el sistema IMPI creará solicitudes separadas para cada una al finalizar la captura.
  </div>
  ${classes.map((c, i) => classBlock(c, i)).join("")}

  <!-- ═══════════════════════════════════════════════════════════════════════
       PASO 4 · DATOS DEL DUEÑO DE LA MARCA
       ═══════════════════════════════════════════════════════════════════════ -->
  ${sectionHeader("PASO 4 · IMPI CAMPO", "Datos del Dueño de la Marca", "Persona física o empresa — ingresar exactamente como aparece en documentos oficiales")}
  <table width="100%" cellpadding="0" cellspacing="0"><tbody>
    ${fieldRow("Nombre o Razón Social del titular", String(client.legal_name ?? "—"))}
    ${fieldRow("Tipo de persona", client.applicant_type === "company" ? "Persona Moral (empresa)" : "Persona Física (individual)")}
    ${rfc ? fieldRow("RFC", rfc, "Registro Federal de Contribuyentes — para titulares mexicanos") : ""}
    ${curp ? fieldRow("CURP", curp, "Para personas físicas mexicanas — se usa para firmar con CURP en el portal IMPI") : ""}
    ${fieldRow("Calle y Número", String(client.address ?? "—"))}
    ${client.state_province ? fieldRow("Estado / Provincia", String(client.state_province)) : ""}
    ${fieldRow("Ciudad", String(client.city ?? "—"))}
    ${fieldRow("Código Postal", String(client.postal_code ?? "—"))}
    ${fieldRow("País", String(client.country ?? "—"))}
    ${authorizedRep ? fieldRow("Representante autorizado / Apoderado", authorizedRep, "Nombre de quien firma la solicitud ante el IMPI") : ""}
  </tbody></table>

  <!-- Co-titulares (si aplica) -->
  ${coOwnersSection}

  <!-- Domicilio para notificaciones (si aplica) -->
  ${notificationSection}

  <!-- ═══════════════════════════════════════════════════════════════════════
       PASO 5 · ¿HAS USADO TU MARCA?
       ═══════════════════════════════════════════════════════════════════════ -->
  ${sectionHeader("PASO 5 · IMPI CAMPO", "¿Has usado tu marca en México?", "Indicar fecha de primer uso continuo e ininterrumpido, si aplica")}
  <table width="100%" cellpadding="0" cellspacing="0"><tbody>
    ${fieldRow("¿Ha usado la marca en México?", app.used_in_mexico || app.usedInMexico ? "SÍ" : "NO")}
    ${(app.used_in_mexico || app.usedInMexico) && app.first_use_date
      ? fieldRow("Fecha de primer uso (ininterrumpido)", String(app.first_use_date), "Formato: DD/MM/AAAA en el portal IMPI")
      : ""}
    ${(app.used_in_mexico || app.usedInMexico) && app.firstUseDate
      ? fieldRow("Fecha de primer uso (ininterrumpido)", String(app.firstUseDate), "Formato: DD/MM/AAAA en el portal IMPI")
      : ""}
  </tbody></table>

  <!-- Datos del establecimiento (si aplica) -->
  ${establishmentSection}

  <!-- ═══════════════════════════════════════════════════════════════════════
       PASO 6 · PRIORIDAD
       ═══════════════════════════════════════════════════════════════════════ -->
  ${prioritySection}

  <!-- ═══════════════════════════════════════════════════════════════════════
       PASO 7 · ANEXOS
       ═══════════════════════════════════════════════════════════════════════ -->
  ${annexesSection}

  <!-- ═══════════════════════════════════════════════════════════════════════
       AVISO POR CLASE (si hay más de 1)
       ═══════════════════════════════════════════════════════════════════════ -->
  ${multiClassReminder}

</div>

<!-- FOOTER -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a2e1a;margin-top:0;">
  <tr>
    <td style="padding:14px 28px;text-align:center;">
      <div style="font-size:11px;color:#9db89d;font-family:Arial,sans-serif;font-weight:700;letter-spacing:1px;">MEXICO TRADEMARK CENTER</div>
      <div style="font-size:11px;color:#6a8a6a;margin-top:3px;">mexicotrademarkcenter.com &nbsp;·&nbsp; tm@mexicotrademarkcenter.com</div>
      <div style="font-size:10px;color:#4a6a4a;margin-top:5px;">Generado: ${new Date().toISOString()} &nbsp;·&nbsp; Referencia: ${String(app.case_number)}</div>
    </td>
  </tr>
</table>

</body>
</html>`;
}

const CLIENT_EMAIL_COPY: Record<string, Record<string, string>> = {
  subject: {
    en: "Your Trademark Application Has Been Received",
    es: "Tu Solicitud de Marca Ha Sido Recibida",
    zh: "您的商标申请已收到",
    de: "Ihre Markenanmeldung wurde erhalten",
    fr: "Votre demande de marque a été reçue",
    hi: "आपका ट्रेडमार्क आवेदन प्राप्त हो गया है",
    pt: "Sua Solicitação de Marca Foi Recebida",
    ja: "商標出願を受け付けました",
  },
  heading: {
    en: "Official Filing Confirmation",
    es: "Confirmación Oficial de Presentación",
    zh: "官方申请确认",
    de: "Offizielle Anmeldebestätigung",
    fr: "Confirmation officielle de dépôt",
    hi: "आधिकारिक दाखिल पुष्टि",
    pt: "Confirmação Oficial de Protocolo",
    ja: "正式な出願確認",
  },
  greeting: {
    en: "Dear",
    es: "Estimado/a",
    zh: "尊敬的",
    de: "Sehr geehrte/r",
    fr: "Cher/Chère",
    hi: "प्रिय",
    pt: "Prezado/a",
    ja: "様",
  },
  intro: {
    en: "Thank you for your trademark filing instruction. Your payment has been confirmed and our team has received your filing details. We will begin processing your application immediately.",
    es: "Gracias por tu instrucción de solicitud de marca. Tu pago ha sido confirmado y nuestro equipo ha recibido los detalles de tu solicitud. Comenzaremos a procesarla de inmediato.",
    zh: "感谢您的商标申请指令。您的付款已确认，我们的团队已收到您的申请详情，将立即开始处理您的申请。",
    de: "Vielen Dank für Ihren Markenanmeldeauftrag. Ihre Zahlung wurde bestätigt und unser Team hat Ihre Anmeldedetails erhalten. Wir werden Ihren Antrag sofort bearbeiten.",
    fr: "Merci pour votre instruction de dépôt de marque. Votre paiement a été confirmé et notre équipe a reçu vos détails de dépôt. Nous commencerons à traiter votre demande immédiatement.",
    hi: "आपके ट्रेडमार्क दाखिल निर्देश के लिए धन्यवाद। आपका भुगतान पुष्टि हो गया है और हमारी टीम को आपके दाखिल विवरण प्राप्त हो गए हैं। हम तुरंत आपके आवेदन को प्रोसेस करना शुरू करेंगे।",
    pt: "Obrigado pela sua instrução de protocolo de marca. Seu pagamento foi confirmado e nossa equipe recebeu seus detalhes de protocolo. Começaremos a processar sua solicitação imediatamente.",
    ja: "商標出願のご依頼ありがとうございます。お支払いが確認され、チームが出願詳細を受領しました。直ちに処理を開始いたします。",
  },
  refLabel: {
    en: "Your Reference Number",
    es: "Tu Número de Referencia",
    zh: "您的参考编号",
    de: "Ihre Referenznummer",
    fr: "Votre numéro de référence",
    hi: "आपका संदर्भ नंबर",
    pt: "Seu Número de Referência",
    ja: "参照番号",
  },
  sectionTrademark: {
    en: "Trademark Details",
    es: "Detalles de la Marca",
    zh: "商标详情",
    de: "Markendetails",
    fr: "Détails de la marque",
    hi: "ट्रेडमार्क विवरण",
    pt: "Detalhes da Marca",
    ja: "商標詳細",
  },
  labelMarkName: {
    en: "Mark Name / Identifier",
    es: "Nombre / Identificador de la Marca",
    zh: "商标名称 / 标识",
    de: "Markenname / Kennung",
    fr: "Nom de la marque / Identifiant",
    hi: "चिह्न नाम / पहचानकर्ता",
    pt: "Nome da Marca / Identificador",
    ja: "商標名 / 識別子",
  },
  labelMarkType: {
    en: "Mark Type",
    es: "Tipo de Marca",
    zh: "商标类型",
    de: "Markentyp",
    fr: "Type de marque",
    hi: "चिह्न प्रकार",
    pt: "Tipo de Marca",
    ja: "商標の種類",
  },
  labelClasses: {
    en: "Classes Filed",
    es: "Clases Solicitadas",
    zh: "申请类别",
    de: "Angemeldete Klassen",
    fr: "Classes déposées",
    hi: "दाखिल कक्षाएं",
    pt: "Classes Protocoladas",
    ja: "出願区分",
  },
  labelFilingDate: {
    en: "Filing Date",
    es: "Fecha de Presentación",
    zh: "申请日期",
    de: "Anmeldedatum",
    fr: "Date de dépôt",
    hi: "दाखिल तिथि",
    pt: "Data de Protocolo",
    ja: "出願日",
  },
  sectionClasses: {
    en: "International Classes",
    es: "Clases Internacionales",
    zh: "国际分类",
    de: "Internationale Klassen",
    fr: "Classes internationales",
    hi: "अंतर्राष्ट्रीय वर्ग",
    pt: "Classes Internacionais",
    ja: "国際分類",
  },
  classLabel: {
    en: "Class",
    es: "Clase",
    zh: "第",
    de: "Klasse",
    fr: "Classe",
    hi: "वर्ग",
    pt: "Classe",
    ja: "第",
  },
  classLabelSuffix: {
    en: "",
    es: "",
    zh: "类",
    de: "",
    fr: "",
    hi: "",
    pt: "",
    ja: "類",
  },
  sectionPayment: {
    en: "Payment Summary",
    es: "Resumen de Pago",
    zh: "付款摘要",
    de: "Zahlungsübersicht",
    fr: "Récapitulatif du paiement",
    hi: "भुगतान सारांश",
    pt: "Resumo do Pagamento",
    ja: "お支払い概要",
  },
  labelServiceFee: {
    en: "Professional Service Fee",
    es: "Honorarios Profesionales",
    zh: "专业服务费",
    de: "Professionelles Honorar",
    fr: "Honoraires professionnels",
    hi: "पेशेवर सेवा शुल्क",
    pt: "Honorários Profissionais",
    ja: "専門サービス料",
  },
  labelGovFee: {
    en: "Government Filing Fee",
    es: "Derechos de Tramitación Gubernamental",
    zh: "政府申请费",
    de: "Staatliche Anmeldegebühr",
    fr: "Frais officiels de dépôt",
    hi: "सरकारी दाखिल शुल्क",
    pt: "Taxa Governamental de Protocolo",
    ja: "政府出願費",
  },
  labelTotal: {
    en: "Total Paid",
    es: "Total Pagado",
    zh: "实付总额",
    de: "Gesamtbetrag",
    fr: "Total payé",
    hi: "कुल भुगतान",
    pt: "Total Pago",
    ja: "合計支払額",
  },
  sectionTrack: {
    en: "Track Your Application",
    es: "Seguimiento de Tu Solicitud",
    zh: "跟踪您的申请",
    de: "Ihre Anmeldung verfolgen",
    fr: "Suivre votre demande",
    hi: "अपने आवेदन को ट्रैक करें",
    pt: "Acompanhe Sua Solicitação",
    ja: "出願状況の確認",
  },
  trackBody: {
    en: "Monitor every stage of your trademark prosecution through your secure client portal — from filing receipt to registration certificate.",
    es: "Monitorea cada etapa del proceso de tu marca a través de tu portal seguro de cliente, desde el recibo de presentación hasta el certificado de registro.",
    zh: "通过您的安全客户门户，从申请收据到注册证书，全程跟踪您的商标审查进度。",
    de: "Verfolgen Sie jeden Schritt Ihres Markenverfahrens über Ihr sicheres Kundenportal — vom Einreichungsbeleg bis zur Registrierungsurkunde.",
    fr: "Suivez chaque étape de la procédure de votre marque via votre portail client sécurisé — du récépissé de dépôt au certificat d'enregistrement.",
    hi: "अपने सुरक्षित क्लाइंट पोर्टल के माध्यम से अपने ट्रेडमार्क अभियोजन के हर चरण की निगरानी करें — दाखिल रसीद से पंजीकरण प्रमाणपत्र तक।",
    pt: "Acompanhe cada etapa do processo de sua marca pelo seu portal seguro do cliente — do recibo de protocolo ao certificado de registro.",
    ja: "セキュアなクライアントポータルから出願受領書から登録証まで、商標審査のすべての段階を追跡できます。",
  },
  ctaBtn: {
    en: "Access Your Client Portal",
    es: "Acceder a Tu Portal de Cliente",
    zh: "访问您的客户门户",
    de: "Auf Ihr Kundenportal zugreifen",
    fr: "Accéder à votre portail client",
    hi: "अपने क्लाइंट पोर्टल तक पहुंचें",
    pt: "Acessar Seu Portal do Cliente",
    ja: "クライアントポータルへアクセス",
  },
  questions: {
    en: "Questions? Contact us at",
    es: "¿Preguntas? Contáctanos en",
    zh: "有问题？请联系我们：",
    de: "Fragen? Kontaktieren Sie uns unter",
    fr: "Des questions ? Contactez-nous à",
    hi: "प्रश्न? हमसे संपर्क करें:",
    pt: "Dúvidas? Fale conosco em",
    ja: "ご質問は：",
  },
  footer: {
    en: "This email confirms your paid filing instruction. Please retain it for your records.",
    es: "Este correo confirma tu instrucción de presentación pagada. Por favor, consérvalo para tus registros.",
    zh: "此电子邮件确认您已付费的申请指令。请保留以备记录。",
    de: "Diese E-Mail bestätigt Ihren bezahlten Anmeldeauftrag. Bitte bewahren Sie sie für Ihre Unterlagen auf.",
    fr: "Cet e-mail confirme votre instruction de dépôt payée. Veuillez le conserver pour vos dossiers.",
    hi: "यह ईमेल आपके भुगतान किए गए दाखिल निर्देश की पुष्टि करता है। कृपया इसे अपने रिकॉर्ड के लिए रखें।",
    pt: "Este e-mail confirma sua instrução de protocolo paga. Por favor, guarde-o para seus registros.",
    ja: "このメールは支払い済みの出願指示を確認するものです。記録として保管してください。",
  },
};

function ce(key: string, lang: string): string {
  const map = CLIENT_EMAIL_COPY[key];
  if (!map) return "";
  return map[lang] ?? map["en"] ?? "";
}

function buildClientEmail(
  app: Record<string, unknown>,
  client: Record<string, unknown>,
  trademark: Record<string, unknown>,
  classes: Record<string, unknown>[],
  totalPaid: number,
  language: string
) {
  const lang = CLIENT_EMAIL_COPY["subject"][language] ? language : "en";
  const classCount = classes.length;
  const govFeePerClass = 170;
  const govFeeTotal = classCount * govFeePerClass;
  const serviceFee = totalPaid - govFeeTotal;

  const dateLocale = lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : lang === "de" ? "de-DE" : lang === "fr" ? "fr-FR" : lang === "es" ? "es-MX" : lang === "pt" ? "pt-BR" : lang === "hi" ? "hi-IN" : "en-US";
  const filingDate = new Date().toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" });

  const classSuffix = ce("classLabelSuffix", lang);
  const classLabel = ce("classLabel", lang);
  const classList = classes
    .map((c) => {
      const classTitle = String(c.class_title_en ?? c.goods_services_en ?? "");
      const classNum = String(c.class_number);
      const label = lang === "zh" || lang === "ja"
        ? `${classLabel}${classNum}${classSuffix} — ${classTitle}`
        : `${classLabel} ${classNum} — ${classTitle}`;
      return `<li>${label}</li>`;
    })
    .join("");

  const clientName = String(client.legal_name ?? client.contact_person ?? (lang === "zh" ? "尊敬的客户" : lang === "ja" ? "お客様" : lang === "es" ? "Estimado/a cliente/a" : lang === "de" ? "Geehrter Kunde" : lang === "fr" ? "Client estimé" : lang === "hi" ? "प्रिय ग्राहक" : lang === "pt" ? "Prezado cliente" : "Valued Client"));

  const classCountLabel = lang === "zh"
    ? `${classCount}个类别`
    : lang === "ja"
    ? `${classCount}区分`
    : lang === "es"
    ? `${classCount} clase${classCount !== 1 ? "s" : ""}`
    : lang === "de"
    ? `${classCount} Klasse${classCount !== 1 ? "n" : ""}`
    : lang === "fr"
    ? `${classCount} classe${classCount !== 1 ? "s" : ""}`
    : lang === "hi"
    ? `${classCount} वर्ग`
    : lang === "pt"
    ? `${classCount} classe${classCount !== 1 ? "s" : ""}`
    : `${classCount} class${classCount !== 1 ? "es" : ""}`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: Georgia, serif; color: #1a1a1a; background: #f9f8f6; margin: 0; padding: 0; }
.wrapper { max-width: 600px; margin: 32px auto; background: #fff; border: 1px solid #e0ddd8; }
.header { background: #1a2e1a; padding: 32px 40px; }
.body { padding: 40px; }
.case-banner { background: #f0f7f0; border: 1px solid #c8e0c8; border-radius: 6px; padding: 20px 24px; margin-bottom: 32px; }
.case-banner .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #5a7a5a; }
.case-banner .value { font-size: 24px; font-weight: 700; color: #1a2e1a; margin-top: 4px; font-family: monospace; }
.section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8a7a6a; border-bottom: 1px solid #e8e4de; padding-bottom: 8px; margin: 28px 0 14px; }
table.data { width: 100%; border-collapse: collapse; font-size: 14px; }
table.data td { padding: 7px 0; vertical-align: top; }
table.data td:first-child { color: #6a6a6a; width: 48%; }
table.data td:last-child { font-weight: 500; }
.inv-row { display: flex; justify-content: space-between; padding: 9px 0; font-size: 14px; border-bottom: 1px solid #f0ece6; }
.inv-total { display: flex; justify-content: space-between; padding: 14px 0 0; font-size: 16px; font-weight: 700; color: #1a2e1a; }
ul.classes { font-size: 14px; color: #3a4a3a; padding-left: 20px; line-height: 1.8; margin: 0; }
.cta { text-align: center; margin: 36px 0; }
.cta a { background: #1a2e1a; color: #fff !important; text-decoration: none; padding: 14px 36px; border-radius: 4px; font-size: 14px; letter-spacing: 0.05em; display: inline-block; }
</style></head>
<body>
<div class="wrapper">
  <div class="header" style="text-align:center">
    <div style="margin-bottom:10px"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
    <div style="font-size:10px;letter-spacing:3px;color:#c9a84c;font-family:Arial,sans-serif;text-transform:uppercase;margin-bottom:6px;font-weight:bold">Mexico Trademark Center</div>
    <h1 style="margin:0;font-size:19px;font-weight:bold;font-family:Georgia,serif;color:#fff;">${ce("heading", lang)}</h1>
  </div>
  <div class="body">
    <p style="font-size:15px;">${ce("greeting", lang)} ${clientName},</p>
    <p style="font-size:14px;color:#4a4a4a;line-height:1.7;">${ce("intro", lang)}</p>

    <div class="case-banner">
      <div class="label">${ce("refLabel", lang)}</div>
      <div class="value">${String(app.case_number)}</div>
    </div>

    <div class="section-title">${ce("sectionTrademark", lang)}</div>
    <table class="data">
      <tr><td>${ce("labelMarkName", lang)}</td><td>${String(trademark.mark_name ?? "—")}</td></tr>
      <tr><td>${ce("labelMarkType", lang)}</td><td>${String(trademark.mark_type ?? "—")}</td></tr>
      <tr><td>${ce("labelClasses", lang)}</td><td>${classCountLabel}</td></tr>
      <tr><td>${ce("labelFilingDate", lang)}</td><td>${filingDate}</td></tr>
    </table>

    <div class="section-title">${ce("sectionClasses", lang)}</div>
    <ul class="classes">${classList}</ul>

    <div class="section-title">${ce("sectionPayment", lang)}</div>
    <div class="inv-row"><span>${ce("labelServiceFee", lang)}</span><span>USD ${formatCurrency(serviceFee)}</span></div>
    <div class="inv-row"><span>${ce("labelGovFee", lang)} (${classCountLabel} × USD ${govFeePerClass})</span><span>USD ${formatCurrency(govFeeTotal)}</span></div>
    <div class="inv-total"><span>${ce("labelTotal", lang)}</span><span>USD ${formatCurrency(totalPaid)}</span></div>

    <div class="section-title">${ce("sectionTrack", lang)}</div>
    <p style="font-size:14px;color:#4a4a4a;line-height:1.7;">${ce("trackBody", lang)}</p>

    <div class="cta">
      <a href="https://mexicotrademarkcenter.com/login">${ce("ctaBtn", lang)}</a>
    </div>

    <p style="font-size:13px;color:#6a6a6a;line-height:1.7;">${ce("questions", lang)} <a href="mailto:tm@mexicotrademarkcenter.com" style="color:#1a2e1a;">tm@mexicotrademarkcenter.com</a></p>
  </div>
  <div style="background:#1a2e1a;padding:18px 40px;text-align:center">
    <p style="font-size:11px;color:#9db89d;margin:0 0 4px;font-family:Arial,sans-serif;font-weight:bold;letter-spacing:1px">MEXICO TRADEMARK CENTER</p>
    <p style="font-size:11px;color:#6a8a6a;margin:0;font-family:Arial,sans-serif">mexicotrademarkcenter.com &nbsp;·&nbsp; tm@mexicotrademarkcenter.com</p>
    <p style="font-size:11px;color:#4a6a4a;margin:6px 0 0;font-family:Arial,sans-serif">${ce("footer", lang)}</p>
  </div>
</div>
</body></html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { application_id } = await req.json();
    if (!application_id) {
      return new Response(JSON.stringify({ error: "application_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: app, error: appErr } = await supabase
      .from("applications")
      .select("*")
      .eq("id", application_id)
      .maybeSingle();
    if (appErr || !app) throw new Error("Application not found");

    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("id", app.client_id)
      .maybeSingle();

    const { data: trademark } = await supabase
      .from("trademarks")
      .select("*")
      .eq("application_id", application_id)
      .maybeSingle();

    const { data: classes } = await supabase
      .from("trademark_classes")
      .select("*")
      .eq("application_id", application_id)
      .order("class_number");

    const { data: goodsServices } = await supabase
      .from("goods_services")
      .select("*")
      .eq("application_id", application_id)
      .maybeSingle();

    const { data: payment } = await supabase
      .from("payments")
      .select("amount_usd")
      .eq("application_id", application_id)
      .eq("status", "paid")
      .order("paid_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const totalPaid = payment?.amount_usd ?? app.total_amount_usd ?? 0;
    const safeClasses = (classes ?? []) as Record<string, unknown>[];
    const safeTrademark = (trademark ?? {}) as Record<string, unknown>;
    const safeClient = (client ?? {}) as Record<string, unknown>;
    const searchLanguage = String(app.search_language ?? app.language ?? "en");

    let logoUrl: string | null = null;
    if (safeTrademark.logo_file_path) {
      const { data: signedUrl } = await supabase.storage
        .from("trademark-assets")
        .createSignedUrl(String(safeTrademark.logo_file_path), 60 * 60 * 24 * 7);
      logoUrl = signedUrl?.signedUrl ?? (safeTrademark.logo_preview_url as string) ?? null;
    }

    const formHtml = buildInstructionFormHtml(
      app,
      safeClient,
      safeTrademark,
      safeClasses,
      goodsServices as Record<string, unknown> | null,
      logoUrl
    );

    const results: Record<string, unknown> = {};

    // 1. Client confirmation email
    if (safeClient.email) {
      const clientHtml = buildClientEmail(
        app,
        safeClient,
        safeTrademark,
        safeClasses,
        Number(totalPaid),
        searchLanguage
      );
      const clientSubject = `${ce("subject", searchLanguage)} — ${app.case_number}`;
      const clientResult = await sendEmail(
        String(safeClient.email),
        clientSubject,
        clientHtml
      );
      results.client_email = clientResult;

      await supabase.from("email_log").insert({
        application_id,
        recipient_email: safeClient.email,
        template_key: "client_confirmation",
        subject: clientSubject,
        status: clientResult.ok ? "sent" : "failed",
        resend_message_id: clientResult.data?.id,
        error_message: clientResult.ok ? null : JSON.stringify(clientResult.data),
      });
    }

    // 2. Staff instruction form email
    const staffResult = await sendEmail(
      FILING_TO_EMAIL,
      `NEW FILING INSTRUCTION — ${app.case_number} — ${safeTrademark.mark_name ?? "Trademark"}`,
      formHtml,
      [FILING_CC_EMAIL]
    );
    results.staff_email = staffResult;

    const sentAt = new Date().toISOString();

    await supabase.from("email_log").insert({
      application_id,
      recipient_email: FILING_TO_EMAIL,
      template_key: "filing_instruction_form",
      subject: `NEW FILING INSTRUCTION — ${app.case_number}`,
      status: staffResult.ok ? "sent" : "failed",
      resend_message_id: staffResult.data?.id,
      error_message: staffResult.ok ? null : JSON.stringify(staffResult.data),
    });

    // 3. Persist form record for admin dashboard
    await supabase.from("filing_instruction_forms").insert({
      application_id,
      html_content: formHtml,
      sent_at: staffResult.ok ? sentAt : null,
      sent_to_email: FILING_TO_EMAIL,
      status: staffResult.ok ? "sent" : "generated",
    });

    // 4. Timeline event
    await supabase.from("timeline_events").insert({
      application_id,
      event_type: "payment_confirmed",
      title: "Payment confirmed — filing instructions sent",
      description: `Payment of USD ${Number(totalPaid).toFixed(2)} confirmed. Instruction form dispatched to ${FILING_TO_EMAIL}. Application is now in queue for processing.`,
      is_visible_to_client: true,
    });

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-filing-emails error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
