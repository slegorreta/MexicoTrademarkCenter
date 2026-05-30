import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const {
      userId,
      caseNumber,
      applicantType,
      legalName,
      country,
      address,
      city,
      stateProvince,
      postalCode,
      email,
      phone,
      wechat,
      whatsapp,
      taxId,
      contactPerson,
      markName,
      markType,
      containsNonSpanish,
      markLanguage,
      meaningSpanish,
      transliteration,
      markDescription,
      claimsColor,
      colorDescription,
      logoStoragePath,
      classEntries,
      totalClasses,
      serviceFeeUsd,
      governmentFeeUsd,
      totalAmountUsd,
      priorityClaimed,
      priorityCountry,
      priorityAppNumber,
      priorityFilingDate,
      language,
      clearanceOrderId,
      termsAccepted,
      disclaimerAccepted,
      disclaimerAcceptedAt,
    } = body as {
      userId?: string | null;
      caseNumber: string;
      applicantType: string;
      legalName: string;
      country: string;
      address: string;
      city: string;
      stateProvince: string;
      postalCode: string;
      email: string;
      phone: string;
      wechat: string;
      whatsapp: string;
      taxId: string;
      contactPerson: string;
      markName: string;
      markType: string;
      containsNonSpanish: boolean;
      markLanguage: string;
      meaningSpanish: string;
      transliteration: string;
      markDescription: string;
      claimsColor: boolean;
      colorDescription: string;
      logoStoragePath?: string | null;
      classEntries: Array<{
        description: string;
        businessIndustry: string;
        classNumber: number | null;
        classTitleEn: string;
        descriptionEn: string;
        descriptionEs: string;
        confidence: number;
        isConfirmed: boolean;
        fallbackClasses: number[];
      }>;
      totalClasses: number;
      serviceFeeUsd: number;
      governmentFeeUsd: number;
      totalAmountUsd: number;
      priorityClaimed: boolean;
      priorityCountry: string;
      priorityAppNumber: string;
      priorityFilingDate?: string | null;
      language: string;
      clearanceOrderId?: string | null;
      termsAccepted: boolean;
      disclaimerAccepted: boolean;
      disclaimerAcceptedAt?: string | null;
    };

    if (!caseNumber || !legalName || !email) {
      return new Response(
        JSON.stringify({ error: "caseNumber, legalName, and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If authenticated user, ensure profile exists
    if (userId) {
      await supabase.from("profiles").upsert(
        { id: userId, email, full_name: contactPerson || legalName, role: "client" },
        { onConflict: "id", ignoreDuplicates: true }
      );
    }

    // Insert client record (service role bypasses RLS)
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .insert({
        user_id: userId ?? null,
        applicant_type: applicantType,
        legal_name: legalName,
        country,
        address,
        city,
        state_province: stateProvince,
        postal_code: postalCode,
        email,
        phone,
        wechat,
        whatsapp,
        tax_id: taxId,
        contact_person: contactPerson,
      })
      .select()
      .maybeSingle();

    if (clientError || !clientData) {
      return new Response(
        JSON.stringify({ error: `Failed to create client record: ${clientError?.message ?? "no data returned"}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Free orders (100% coupon) are immediately confirmed
    const isFreeOrder = totalAmountUsd === 0;

    // Insert application
    const { data: appData, error: appError } = await supabase
      .from("applications")
      .insert({
        case_number: caseNumber,
        client_id: clientData.id,
        user_id: userId ?? null,
        payment_status: isFreeOrder ? "paid" : "pending",
        filing_status: isFreeOrder ? "received" : "pending_payment",
        total_classes: totalClasses,
        service_fee_usd: serviceFeeUsd,
        government_fee_usd: governmentFeeUsd,
        total_amount_usd: totalAmountUsd,
        priority_claimed: priorityClaimed,
        priority_country: priorityCountry,
        priority_app_number: priorityAppNumber,
        priority_filing_date: priorityFilingDate ?? null,
        source: "website",
        language,
        search_language: language,
        clearance_report_order_id: clearanceOrderId ?? null,
        terms_accepted: termsAccepted,
        disclaimer_accepted: disclaimerAccepted,
        disclaimer_accepted_at: disclaimerAcceptedAt ?? null,
      })
      .select()
      .maybeSingle();

    if (appError || !appData) {
      return new Response(
        JSON.stringify({ error: `Failed to create application record: ${appError?.message ?? "no data returned"}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert trademark
    await supabase.from("trademarks").insert({
      application_id: appData.id,
      mark_name: markName,
      mark_type: markType,
      contains_non_spanish: containsNonSpanish,
      mark_language: markLanguage,
      meaning_spanish: meaningSpanish,
      transliteration,
      mark_description: markDescription,
      claims_color: claimsColor,
      color_description: colorDescription,
      ...(logoStoragePath ? { logo_storage_path: logoStoragePath } : {}),
    });

    // Insert class entries
    for (const entry of classEntries) {
      const classNums = entry.isConfirmed && entry.classNumber !== null
        ? [entry.classNumber]
        : entry.fallbackClasses;
      if (classNums.length === 0) continue;

      await supabase.from("goods_services").insert({
        application_id: appData.id,
        description_original: entry.description,
        original_language: language,
        business_industry: entry.businessIndustry,
        sales_channels: [],
        countries_sold: [],
        mexico_launch_status: "planning",
      });

      for (const classNum of classNums) {
        const { error: tcError } = await supabase.from("trademark_classes").insert({
          application_id: appData.id,
          class_number: classNum,
          class_title_en: entry.classTitleEn || "",
          goods_services_en: entry.descriptionEn || "",
          goods_services_es: entry.descriptionEs || "",
          classification_source: entry.isConfirmed ? "suggested" : "user_selected",
          confidence_score: entry.confidence,
        });
        if (tcError) {
          console.error("trademark_classes insert error:", tcError.message, { classNum, entry });
        }
      }
    }

    return new Response(
      JSON.stringify({ clientId: clientData.id, applicationId: appData.id, caseNumber }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
