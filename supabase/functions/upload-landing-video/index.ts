import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function fetchGoogleDriveFile(fileId: string): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  // Step 1: hit the standard download URL — for large files Google returns an HTML
  // confirmation page with a warning form. We need to extract the confirm token.
  const initialUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  const initialRes = await fetch(initialUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
    redirect: "follow",
  });

  if (!initialRes.ok) {
    throw new Error(`Initial request failed: ${initialRes.status} ${initialRes.statusText}`);
  }

  const contentType = initialRes.headers.get("content-type") ?? "";

  // If the response is not HTML, Google gave us the file directly (small file)
  if (!contentType.includes("text/html")) {
    const buffer = await initialRes.arrayBuffer();
    return { buffer, contentType };
  }

  // Large file — Google shows a virus scan warning page.
  // Extract the confirm token and cookie from the response.
  const html = await initialRes.text();

  // Extract confirm token from the form action or hidden input
  const confirmMatch = html.match(/confirm=([0-9A-Za-z_-]+)/);
  const uuidMatch = html.match(/uuid=([0-9A-Za-z_-]+)/);

  // Also grab the Set-Cookie header for the download_warning cookie
  const setCookie = initialRes.headers.get("set-cookie") ?? "";
  const cookieMatch = setCookie.match(/(download_warning_[^=]+=\S+?)(?:;|$)/);
  const warningCookie = cookieMatch ? cookieMatch[1] : "";

  let downloadUrl: string;

  if (uuidMatch) {
    // Newer Google Drive format uses uuid
    downloadUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t&uuid=${uuidMatch[1]}`;
  } else if (confirmMatch) {
    downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirmMatch[1]}`;
  } else {
    // Try the usercontent domain which sometimes bypasses the warning
    downloadUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
  }

  console.log(`Large file detected — downloading with confirm URL: ${downloadUrl}`);

  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  };
  if (warningCookie) headers["Cookie"] = warningCookie;

  const fileRes = await fetch(downloadUrl, { headers, redirect: "follow" });

  if (!fileRes.ok) {
    throw new Error(`Download failed: ${fileRes.status} ${fileRes.statusText}`);
  }

  const fileContentType = fileRes.headers.get("content-type") ?? "video/mp4";

  // Sanity-check: if we still got HTML it means auth failed
  if (fileContentType.includes("text/html")) {
    const snippet = await fileRes.text();
    throw new Error(`Google Drive returned HTML instead of a file. Make sure sharing is set to "Anyone with the link". Preview: ${snippet.slice(0, 300)}`);
  }

  const buffer = await fileRes.arrayBuffer();
  return { buffer, contentType: fileContentType };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const fileId: string = body.fileId ?? "";
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

    console.log(`Fetching file ${fileId} from Google Drive…`);
    const { buffer, contentType } = await fetchGoogleDriveFile(fileId);

    console.log(`Downloaded ${buffer.byteLength} bytes (${contentType})`);

    if (buffer.byteLength < 10_000) {
      const text = new TextDecoder().decode(buffer);
      throw new Error(`File too small (${buffer.byteLength} bytes) — likely an error page: ${text.slice(0, 400)}`);
    }

    const mimeType = contentType.startsWith("video/") ? contentType : "video/mp4";

    const { error: uploadError } = await supabase.storage
      .from("landing-videos")
      .upload(filename, buffer, { contentType: mimeType, upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("landing-videos")
      .getPublicUrl(filename);

    return new Response(
      JSON.stringify({ success: true, url: urlData.publicUrl, sizeBytes: buffer.byteLength }),
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
