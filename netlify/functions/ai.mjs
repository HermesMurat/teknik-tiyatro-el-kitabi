import { createHash } from "node:crypto";

const OPENAI_URL = "https://api.openai.com/v1/responses";
const GEMINI_INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const officialDomains = new Set([
  "teftis.ktb.gov.tr",
  "devtiyatro.gov.tr",
  "resmigazete.gov.tr",
  "ihale.gov.tr",
  "sbb.gov.tr",
  "hmb.gov.tr",
]);
const rateLimits = new Map();
const MAX_CONTEXT = 14000;
const MAX_QUESTION = 1600;
const MAX_ANSWER_TOKENS = 1500;
const MAX_IDEA_TOKENS = 1100;
const REQUEST_TIMEOUT_MS = 22000;

const allowedOrigins = new Set([
  "https://hermesmurat.github.io",
  "https://teknik-tiyatro-el-kitabi.netlify.app",
  "http://localhost:8888",
  "http://127.0.0.1:8888",
  ...String(process.env.ALLOWED_ORIGINS || "").split(",").map((item) => item.trim()).filter(Boolean),
]);

function json(statusCode, body, origin = "", extraHeaders = {}) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...extraHeaders,
  };
  if (origin) {
    headers["access-control-allow-origin"] = origin;
    headers["access-control-allow-headers"] = "content-type";
    headers["access-control-allow-methods"] = "POST, OPTIONS";
    headers.vary = "Origin";
  }
  return { statusCode, headers, body: JSON.stringify(body) };
}

function clientKey(event) {
  return String(
    event.headers?.["x-nf-client-connection-ip"] ||
    event.headers?.["x-forwarded-for"] ||
    event.headers?.["client-ip"] ||
    "anonymous"
  ).split(",")[0].trim();
}

function safetyIdentifier(event) {
  const salt = process.env.SAFETY_ID_SALT || "tte-live-guide";
  return `tte_${createHash("sha256").update(`${salt}:${clientKey(event)}`).digest("hex").slice(0, 32)}`;
}

function withinRateLimit(key) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const current = rateLimits.get(key);
  if (!current || now - current.startedAt >= windowMs) {
    rateLimits.set(key, { count: 1, startedAt: now });
    return true;
  }
  current.count += 1;
  return current.count <= 12;
}

function officialSource(source) {
  try {
    const url = new URL(source?.url || source?.url_citation?.url || "");
    return [...officialDomains].some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function extractResult(response) {
  const textParts = [];
  const sources = [];
  for (const item of response?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && content?.text) textParts.push(content.text);
      for (const annotation of content?.annotations ?? []) {
        if (annotation?.type !== "url_citation") continue;
        sources.push({
          title: annotation.title || annotation.url_citation?.title || "",
          url: annotation.url || annotation.url_citation?.url || "",
        });
      }
    }
    if (item?.type === "web_search_call") {
      for (const source of item?.action?.sources ?? []) {
        sources.push({ title: source.title || "", url: source.url || "" });
      }
    }
  }
  const uniqueSources = [...new Map(
    sources.filter(officialSource).map((source) => [source.url, source])
  ).values()].slice(0, 10);
  return {
    answer: String(response?.output_text || textParts.join("\n")).trim(),
    sources: uniqueSources,
  };
}

function contextSources(context) {
  const sources = [];
  const urlPattern = /https?:\/\/[^\s<>"')\]]+/g;
  for (const match of String(context || "").matchAll(urlPattern)) {
    const url = match[0].replace(/[.,;:]+$/, "");
    const source = { title: "", url };
    if (!officialSource(source)) continue;
    try {
      source.title = new URL(url).hostname;
    } catch {
      continue;
    }
    sources.push(source);
  }
  return [...new Map(sources.map((source) => [source.url, source])).values()].slice(0, 10);
}

function extractGeminiResult(response, context) {
  const answer = (response?.steps ?? [])
    .filter((step) => step?.type === "model_output")
    .flatMap((step) => step?.content ?? [])
    .filter((content) => content?.type === "text")
    .map((content) => content?.text || "")
    .join("\n")
    .trim();
  return { answer, sources: contextSources(context) };
}

const ANSWER_INSTRUCTIONS = `Sen Türkiye Cumhuriyeti Devlet Tiyatrolarında teknik yönetim için çalışan bir uzman rehbersin. Hızlı, doğru ve kısa yanıt ver.

ÖNCELİK SIRASI:
1. El kitabı kanıt paketini ([K]) kullan.
2. Yalnız resmî kamu kaynaklarını ([M]) kullan.
3. Kaynakta açıkça bulunmayan görev, yetki, süre, madde numarası, tarih veya kurumsal uygulama uydurma.

YANIT BİÇİMİ (başlıkları aynen kullan):
## Kısa cevap
En fazla 100 kelime; doğrudan hüküm.
## İlgili kanun maddeleri
[M] varsa ilgili madde/başlık; yoksa "Doğrudan hüküm bulunamadı" yaz.
## Araştırma özeti
Hangi [K] bölüm/başlık ve hangi resmî site incelendi; tek kısa paragraf.
## Uygulama adımları
3-6 numaralı, uygulanabilir adım.
## Akıllı çözüm önerileri
2-3 kısa ve pratik fikir; bağlayıcı olmadığını belirt.
## Yetki ve güvenlik sınırı
Kimin karar vermesi gerektiği; yakın tehlike varsa işi durdurma uyarısı.

Kurallar: Türkçe yaz; toplam 450 kelimeyi geçme; gereksiz gerekçe ve tekrar yapma; hukuki mütalaa verdiğini iddia etme; [K] ve [M] işaretlerini koru.`;

const IDEAS_INSTRUCTIONS = `Sen Devlet Tiyatrolarında teknik yönetim alanında deneyimli bir yaratıcı çözüm danışmanısın. El kitabı ve resmî kaynak kanıtlarına dayanarak uygulanabilir, özgün fikirler üret.

KURALLAR:
- Mevzuata aykırı, güvenlik riski taşıyan veya kaynakta olmayan yetki/süre/madde uyduran öneri verme.
- Kanun maddesi uydurma; dayanak varsa [M] veya [K] ile bağla.
- 5 fikir üret. Her fikri şu biçimde yaz:
  "### 1. Fikir adı"
  "Nasıl uygulanır:" 2-3 cümle
  "Kazanç:" tek cümle
  "Risk / ön koşul:" tek cümle
- En az biri düşük maliyetli, biri kurum içi işbirliği, biri süreç sadeleştirme olsun.
- Türkçe yaz, 500 kelimeyi geçme. Sonda tek cümleyle önerilerin bağlayıcı olmadığını belirt.`;

export async function handler(event) {
  const origin = event.headers?.origin || "";
  if (!allowedOrigins.has(origin)) {
    return json(403, { error: "Bu istemci canlı model hizmetini kullanamaz." });
  }

  if (event.httpMethod === "OPTIONS") return json(204, {}, origin);
  if (event.httpMethod !== "POST") return json(405, { error: "Yalnız POST kabul edilir." }, origin);
  if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    return json(503, { error: "Canlı model anahtarı henüz sunucuya tanımlanmamış." }, origin);
  }
  if (!withinRateLimit(clientKey(event))) {
    return json(
      429,
      { error: "Kısa sürede çok fazla soru gönderildi. Lütfen birkaç dakika sonra yeniden deneyin." },
      origin,
      { "retry-after": "600" }
    );
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Geçersiz istek." }, origin);
  }

  const question = String(payload.question || "").trim().slice(0, MAX_QUESTION);
  const context = String(payload.context || "").trim().slice(0, MAX_CONTEXT);
  const conversation = Array.isArray(payload.history) ? payload.history.slice(-4) : [];
  const mode = ["book", "hybrid", "ideas"].includes(payload.mode) ? payload.mode : "hybrid";
  if (question.length < 3) return json(400, { error: "Lütfen daha açık bir soru yazın." }, origin);

  const instructions = mode === "ideas" ? IDEAS_INSTRUCTIONS : ANSWER_INSTRUCTIONS;

  const input = [
    ...conversation.map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: String(message.content || "").slice(0, 1500),
    })),
    {
      role: "user",
      content: `${context ? `EL KİTABI KANIT PAKETİ:\n${context}\n\n` : ""}SORU:\n${question}`,
    },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const useGemini = Boolean(process.env.GEMINI_API_KEY) && process.env.AI_PROVIDER !== "openai";
    let response;
    let data;
    let result;
    let provider;

    if (useGemini) {
      provider = "gemini";
      const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
      const transcript = conversation.map((message) => (
        `${message.role === "assistant" ? "REHBER" : "KULLANICI"}:\n${String(message.content || "")}`
      )).join("\n\n");
      const geminiBody = {
        model,
        system_instruction: instructions,
        input: [
          transcript,
          context ? `EL KİTABI KANIT PAKETİ:\n${context}` : "",
          `SORU:\n${question}`,
        ].filter(Boolean).join("\n\n"),
        store: false,
        generation_config: {
          temperature: mode === "ideas" ? 0.7 : 0.25,
          max_output_tokens: mode === "ideas" ? MAX_IDEA_TOKENS : MAX_ANSWER_TOKENS,
        },
      };
      response = await fetch(GEMINI_INTERACTIONS_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "x-goog-api-key": process.env.GEMINI_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify(geminiBody),
      });
      data = await response.json();
      result = extractGeminiResult(data, context);
    } else {
      provider = "openai";
      const requestBody = {
        model: process.env.OPENAI_MODEL || "gpt-5.6-terra",
        instructions,
        input,
        reasoning: {
          effort: process.env.OPENAI_REASONING_EFFORT || "low",
        },
        max_output_tokens: mode === "ideas" ? MAX_IDEA_TOKENS : MAX_ANSWER_TOKENS,
        safety_identifier: safetyIdentifier(event),
      };

      if (mode === "hybrid") {
        requestBody.tools = [{
          type: "web_search",
          filters: {
            allowed_domains: [...officialDomains],
          },
          search_context_size: "high",
          user_location: {
            type: "approximate",
            country: "TR",
            city: "İzmir",
            region: "İzmir",
            timezone: "Europe/Istanbul",
          },
        }];
        requestBody.tool_choice = "auto";
        requestBody.include = ["web_search_call.action.sources"];
      }

      response = await fetch(OPENAI_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      data = await response.json();
      result = extractResult(data);
    }

    if (!response.ok) {
      console.error(`${provider} error`, response.status, data);
      return json(
        response.status,
        { error: "Canlı model yanıt veremedi. Lütfen kısa süre sonra yeniden deneyin." },
        origin
      );
    }

    if (!result.answer) return json(502, { error: "Model boş yanıt verdi." }, origin);
    return json(200, {
      ...result,
      provider,
      requestId: data.id || data.responseId || null,
    }, origin);
  } catch (error) {
    const message = error?.name === "AbortError"
      ? "Canlı araştırma zaman aşımına uğradı."
      : "Canlı model bağlantısı kurulamadı.";
    return json(504, { error: message }, origin);
  } finally {
    clearTimeout(timeout);
  }
}
