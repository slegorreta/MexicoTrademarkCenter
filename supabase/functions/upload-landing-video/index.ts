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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const fileId = "1w1CTtufXgpO-vT-UogW1R9PCUcNxTRb6";
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;

    console.log("Downloading video from Google Drive...");
    const response = await fetch(downloadUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "video/mp4";
    console.log(`Downloaded. Content-Type: ${contentType}, Status: ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();
    console.log(`File size: ${arrayBuffer.byteLength} bytes`);

    if (arrayBuffer.byteLength < 1000) {
      const text = new TextDecoder().decode(arrayBuffer);
      throw new Error(`Downloaded file too small — likely an HTML page: ${text.slice(0, 500)}`);
    }

    const { error: uploadError } = await supabase.storage
      .from("landing-videos")
      .upload("zh-hero.mp4", arrayBuffer, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("landing-videos")
      .getPublicUrl("zh-hero.mp4");

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
