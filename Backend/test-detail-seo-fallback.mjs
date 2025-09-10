// Backend/test-detail-seo-fallback.mjs
// Node 18+ (tiene fetch nativo). Requiere: npm i cheerio
import { load } from "cheerio";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const TEST_ID = process.env.TEST_ID; // Opción rápida: usar ID específico

// Parse CLI arguments for --id=<uuid>
function parseCliArgs() {
  const args = process.argv.slice(2);
  let cliId = null;
  
  for (const arg of args) {
    if (arg.startsWith('--id=')) {
      cliId = arg.split('=')[1];
      break;
    }
  }
  
  return { cliId };
}

// Create AbortController with 10s timeout
function createTimeoutController() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  return { controller, timeoutId };
}

async function get(path, opts = {}) {
  const { controller, timeoutId } = createTimeoutController();
  try {
    const res = await fetch(`${BASE}${path}`, { 
      redirect: "manual", 
      signal: controller.signal,
      ...opts 
    });
    const text = await res.text();
    clearTimeout(timeoutId);
    return { status: res.status, ok: res.ok, text, headers: Object.fromEntries(res.headers.entries()) };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout (10s) for ${path}`);
    }
    throw error;
  }
}

async function getJson(path) {
  const { controller, timeoutId } = createTimeoutController();
  try {
    const res = await fetch(`${BASE}${path}`, { signal: controller.signal });
    const raw = await res.text();
    let json = null;
    try { json = JSON.parse(raw); } catch {}
    clearTimeout(timeoutId);
    return { status: res.status, ok: res.ok, json, raw };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout (10s) for ${path}`);
    }
    throw error;
  }
}

function line(msg) { console.log(`• ${msg}`); }
function section(title) { console.log(`\n=== ${title} ===`); }

(async () => {
  section(`BASE`);
  line(BASE);

  const { cliId } = parseCliArgs();
  let idValid;

  // 1) Obtener un ID válido
  if (cliId) {
    section("Step 1: Usando --id CLI proporcionado");
    idValid = cliId;
    line(`CLI --id: ${idValid}`);
  } else if (TEST_ID) {
    section("Step 1: Usando TEST_ID proporcionado");
    idValid = TEST_ID;
    line(`TEST_ID: ${idValid}`);
  } else {
    section("Step 1: ID válido desde /api/properties?limit=1");
    const list = await getJson("/api/properties?limit=1");
    if (!list.ok) {
      console.error("❌ No pude leer /api/properties. Status:", list.status, list.raw?.slice(0, 200));
      process.exit(2);
    }
    
    // Fail-fast: check if items array is empty
    const items = list?.json?.items || list?.json || [];
    if (!Array.isArray(items) || items.length === 0) {
      console.error("❌ No hay propiedades en la base de datos. La respuesta está vacía.");
      console.error("   Ejecuta primero: npm run seed o crea propiedades manualmente");
      console.error("   O usa: node Backend/test-detail-seo-fallback.mjs --id=<UUID>");
      process.exit(2);
    }
    
    idValid = items[0]?.id;
    if (!idValid) {
      console.error("❌ No encontré ningún id válido en la primera propiedad.");
      console.error("   Respuesta:", JSON.stringify(items[0], null, 2));
      process.exit(2);
    }
    line(`ID válido: ${idValid}`);
  }

  // 2) ID Guard
  section("Step 2: ID Guard en /api/properties/[id]");
  const invalid = await get("/api/properties/xxx");
  line(`GET /api/properties/xxx → status ${invalid.status} (esperado 404)`);
  const valid = await get(`/api/properties/${idValid}`);
  line(`GET /api/properties/${idValid} → status ${valid.status} (esperado 200)`);

  // 3) SEO (title/description/og/twitter) y JSON-LD en la página
  section(`Step 3: SEO + JSON-LD en /properties/${idValid}`);
  const htmlResp = await get(`/properties/${idValid}`);
  if (!htmlResp.ok) {
    console.error(`No pude cargar /properties/${idValid}. Status:`, htmlResp.status);
    process.exit(1);
  }
  const $ = load(htmlResp.text);
  const title = $("title").first().text().trim();
  const desc = $('meta[name="description"]').attr("content");
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const ogImage =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="og:image"]').attr("content");
  const twCard = $('meta[name="twitter:card"]').attr("content");
  const jsonLdText = $('script[type="application/ld+json"]').first().text().trim();
  let hasJsonLd = false;
  try {
    const parsed = JSON.parse(jsonLdText || "{}");
    hasJsonLd = !!parsed["@context"];
  } catch { /* ignore */ }

  line(`title: ${title || "(no encontrado)"}`);
  line(`description: ${desc ? desc.slice(0, 120) + "..." : "(no encontrada)"}`);
  line(`og:title: ${ogTitle || "(no encontrado)"}`);
  line(`og:image: ${ogImage || "(no encontrado)"}`);
  line(`twitter:card: ${twCard || "(no encontrada)"}`);
  line(`JSON-LD presente: ${hasJsonLd ? "sí" : "no"}`);

  // 4) Fallback de imágenes (API vs og:image)
  section("Step 4: Fallback de imágenes (API vs og:image)");
  let apiDetailJson = null;
  try { apiDetailJson = JSON.parse(valid.text); } catch { /* could already be text */ }
  const apiImages =
    apiDetailJson?.images ??
    apiDetailJson?.property?.images ?? // por si viene envuelto
    [];
  const imagesLen = Array.isArray(apiImages) ? apiImages.length : 0;
  line(`API images length: ${imagesLen}`);
  if (imagesLen === 0 && ogImage) {
    line("Fallback OK: no hay imágenes en API, pero og:image está presente.");
  } else if (imagesLen > 0) {
    line("API ya trae imágenes (fallback no necesario).");
  } else {
    line("Atención: ni API ni og:image aportan imágenes.");
  }

  // 5) Resumen / GO-NO GO
  section("Resumen");
  const idGuardOk = invalid.status === 404 && valid.status === 200;
  const seoOk = !!title && !!desc && !!ogTitle && !!twCard; // og:image puede depender de bucket
  const fallbackOk = (imagesLen === 0 && !!ogImage) || imagesLen > 0;

  line(`ID Guard: ${idGuardOk ? "OK" : "FALLA"}`);
  line(`SEO base (title/description/og/twitter): ${seoOk ? "OK" : "FALTAN TAGS"}`);
  line(`Fallback imágenes: ${fallbackOk ? "OK" : "NO OK"}`);

  const go = idGuardOk && seoOk && fallbackOk;
  console.log(`\nRESULTADO: ${go ? "GO ✅" : "NO-GO ⚠️"}`);
  
  // Show usage examples
  console.log(`\n📖 USAGE:`);
  console.log(`   node Backend/test-detail-seo-fallback.mjs --id=<UUID>`);
  console.log(`   node Backend/test-detail-seo-fallback.mjs`);
  console.log(`   TEST_ID=<UUID> node Backend/test-detail-seo-fallback.mjs`);
  
  process.exit(go ? 0 : 2);
})().catch((e) => {
  console.error("❌ Error en test:", e.message || e);
  if (e.message?.includes('timeout')) {
    console.error("   El servidor puede estar lento o no responder");
  }
  process.exit(2);
});
