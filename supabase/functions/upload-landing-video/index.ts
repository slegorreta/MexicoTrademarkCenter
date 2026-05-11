import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const fileId: string = body.fileId ?? "1w1CTtufXgpO-vT-UogW1R9PCUcNxTRb6";
    const filename: string = body.filename ?? "zh-hero.mp4";

    if (!fileId) {
      return new Response(
        JSON.stringify({ success: false, error: "fileId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try direct download first, then fall back to confirm param for large files
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;

    console.log(`Downloading file ${fileId} from Google Drive…`);
    const response = await fetch(downloadUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "video/mp4";
    console.log(`Content-Type: ${contentType}`);

    const arrayBuffer = await response.arrayBuffer();
    console.log(`File size: ${arrayBuffer.byteLength} bytes`);

    if (arrayBuffer.byteLength < 1000) {
      const text = new TextDecoder().decode(arrayBuffer);
      throw new Error(`Downloaded file too small — likely an HTML error page: ${text.slice(0, 500)}`);
    }

    const { error: uploadError } = await supabase.storage
      .from("landing-videos")
      .upload(filename, arrayBuffer, {
        contentType: contentType.startsWith("video/") ? contentType : "video/mp4",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("landing-videos")
      .getPublicUrl(filename);

    return new Response(
      JSON.stringify({ success: true, url: urlData.publicUrl, sizeBytes: arrayBuffer.byteLength }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
