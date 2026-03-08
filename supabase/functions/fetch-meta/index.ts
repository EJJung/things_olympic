import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/* ── Metadata parser: OG → Twitter cards → JSON-LD → <h1> / <title> ── */
function parseMetadata(html: string, url: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const q  = (s: string) => doc.querySelector(s)?.getAttribute("content")?.trim() ?? "";
  const qs = (s: string) => doc.querySelector(s)?.textContent?.trim() ?? "";

  // 1) JSON-LD (schema.org – most e-commerce sites, Amazon, etc.)
  let jsonldName = "", jsonldImage = "", jsonldDesc = "";
  doc.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
    try {
      const data = JSON.parse(el.textContent ?? "");
      const nodes: any[] = Array.isArray(data)
        ? data
        : (data["@graph"] ?? [data]);
      for (const n of nodes) {
        if (!jsonldName  && n.name)        jsonldName  = String(n.name).trim().slice(0, 120);
        if (!jsonldImage && n.image)       jsonldImage = typeof n.image === "string"
          ? n.image
          : (n.image?.url ?? n.image?.[0]?.url ?? "");
        if (!jsonldDesc  && n.description) jsonldDesc  = String(n.description).trim().slice(0, 220);
      }
    } catch { /* skip malformed JSON-LD */ }
  });

  // 2) OG tags
  const ogImage = q('meta[property="og:image"]') || q('meta[property="og:image:url"]') || q('meta[name="og:image"]');

  // 3) Twitter card tags
  const twImage = q('meta[name="twitter:image"]') || q('meta[name="twitter:image:src"]');
  const twTitle = q('meta[name="twitter:title"]');
  const twDesc  = q('meta[name="twitter:description"]');

  // 4) Resolve relative image URLs
  const rawImage = ogImage || twImage || jsonldImage;
  let image = rawImage;
  if (image && !/^https?:\/\//.test(image)) {
    try { image = new URL(image, url).href; } catch { image = ""; }
  }

  // 5) Best name — priority: OG → Twitter → JSON-LD → first <h1> → <title> → hostname
  const name = (
    q('meta[property="og:title"]') ||
    q('meta[name="og:title"]')     ||
    twTitle                        ||
    jsonldName                     ||
    qs("h1")                       ||
    doc.title                      ||
    new URL(url).hostname
  ).trim().slice(0, 120);

  // 6) Best description
  const description = (
    q('meta[property="og:description"]') ||
    q('meta[name="description"]')        ||
    twDesc                               ||
    jsonldDesc                           ||
    ""
  ).trim().slice(0, 220);

  return { name, image, description, url };
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { url: rawUrl } = await req.json();
    if (!rawUrl) throw new Error("Missing 'url' in request body");
    const url = /^https?:\/\//.test(rawUrl) ? rawUrl : "https://" + rawUrl;

    // Fetch with a realistic browser User-Agent so most sites don't block us
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      // Follow redirects (handles shortened URLs, affiliate links, etc.)
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) throw new Error(`Upstream HTTP ${res.status}`);

    // Only parse HTML responses
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("html")) throw new Error(`Non-HTML content-type: ${ct}`);

    const html = await res.text();
    const meta = parseMetadata(html, url);

    return new Response(JSON.stringify({ success: true, ...meta }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
