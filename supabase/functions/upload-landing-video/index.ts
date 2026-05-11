import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function fetchFromUrl(url: string): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  const contentType = res.headers.get("content-type") ?? "video/mp4";
  if (contentType.includes("text/html")) {
    const snippet = await res.text();
    throw new Error(`URL returned an HTML page instead of a file. Snippet: ${snippet.slice(0, 300)}`);
  }
  const buffer = await res.arrayBuffer();
  return { buffer, contentType };
}

async function fetchGoogleDriveFile(fileId: string): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  // Use drive.usercontent.google.com which handles large files more reliably
  // Make a HEAD/GET to get the real confirm token from the warning page
  const warningUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  const warningRes = await fetch(warningUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
    redirect: "follow",
  });

  const contentType = warningRes.headers.get("content-type") ?? "";

  // Small file — returned directly
  if (!contentType.includes("text/html")) {
    const buffer = await warningRes.arrayBuffer();
    if (buffer.byteLength > 10_000) return { buffer, contentType };
  }

  const html = await warningRes.text();
  const cookies = warningRes.headers.get("set-cookie") ?? "";

  // Extract uuid (newer format)
  const uuidMatch = html.match(/[?&]uuid=([^&"'\s]+)/);
  // Extract confirm token
  const confirmMatch = html.match(/[?&]confirm=([^&"'\s]+)/);
  // Extract download_warning cookie value
  const cookieMatch = cookies.match(/download_warning[^=]*=([^;]+)/);

  console.log("uuid:", uuidMatch?.[1], "confirm:", confirmMatch?.[1], "cookie:", cookieMatch?.[1]);

  let downloadUrl: string;
  const cookieHeader: Record<string, string> = {};

  if (uuidMatch) {
    downloadUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t&uuid=${uuidMatch[1]}`;
  } else if (confirmMatch && confirmMatch[1] !== "t") {
    downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirmMatch[1]}`;
  } else {
    // Last resort: usercontent with just confirm=t
    downloadUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
  }

  if (cookieMatch) {
    // Find the full cookie name from set-cookie
    const fullCookieMatch = cookies.match(/(download_warning[^=]*=[^;]+)/);
    if (fullCookieMatch) cookieHeader["Cookie"] = fullCookieMatch[1];
  }

  console.log("Downloading from:", downloadUrl);

  const fileRes = await fetch(downloadUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      ...cookieHeader,
    },
    redirect: "follow",
  });

  if (!fileRes.ok) throw new Error(`Download failed: ${fileRes.status} ${fileRes.statusText}`);

  const fileContentType = fileRes.headers.get("content-type") ?? "video/mp4";
  if (fileContentType.includes("text/html")) {
    const snippet = await fileRes.text();
    throw new Error(`Google Drive still returned HTML. Make sure the file is shared as "Anyone with the link can view". Snippet: ${snippet.slice(0, 300)}`);
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
    const directUrl: string = body.directUrl ?? "";
    const filename: string = body.filename ?? "zh-hero.mp4";

    if (!fileId && !directUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "fileId or directUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let result: { buffer: ArrayBuffer; contentType: string };

    if (directUrl) {
      console.log(`Fetching from direct URL: ${directUrl}`);
      result = await fetchFromUrl(directUrl);
    } else {
      console.log(`Fetching from Google Drive file ID: ${fileId}`);
      result = await fetchGoogleDriveFile(fileId);
    }

    const { buffer, contentType } = result;
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
