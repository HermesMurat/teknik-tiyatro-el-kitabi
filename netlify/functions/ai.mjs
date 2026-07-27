import { createHash } from "node:crypto";

const OPENAI_URL = "https://api.openai.com/v1/responses";
const officialDomains = new Set(["teftis.ktb.gov.tr", "devtiyatro.gov.tr"]);
const rateLimits = new Map();

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

export async function handler(event) {
  const origin = event.headers?.origin || "";
  if (!allowedOrigins.has(origin)) {
    return json(403, { error: "Bu istemci canlı model hizmetini kullanamaz." });
  }

  if (event.httpMethod === "OPTIONS") return json(204, {}, origin);
  if (event.httpMethod !== "POST") return json(405, { error: "Yalnız POST kabul edilir." }, origin);
  if (!process.env.OPENAI_API_KEY) {
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

  const question = String(payload.question || "").trim().slice(0, 2500);
  const context = String(payload.context || "").trim().slice(0, 30000);
  const conversation = Array.isArray(payload.history) ? payload.history.slice(-6) : [];
  const mode = payload.mode === "book" ? "book" : "hybrid";
  if (question.length < 3) return json(400, { error: "Lütfen daha açık bir soru yazın." }, origin);

  const instructions = `Sen Türkiye Cumhuriyeti Devlet Tiyatrolarında teknik yönetim için çalışan bir uzman rehbersin.

ÖNCELİK SIRASI:
1. Önce kullanıcının gönderdiği Tiyatro Teknik Müdürlüğü El Kitabı kanıt paketini kullan.
2. Web araması açıksa yalnız teftis.ktb.gov.tr ve devtiyatro.gov.tr alanlarındaki Devlet Tiyatroları kaynaklarını kullan.
3. Kaynakta açıkça bulunmayan görev, yetki, süre, madde numarası, tarih veya kurumsal uygulama uydurma.
4. Kaynaklar yetersiz veya çelişkiliyse bunu doğrudan belirt; genel mesleki bilgi ile bağlayıcı kurum hükmünü birbirine karıştırma.

YANIT BİÇİMİ:
- Önce doğrudan ve anlaşılır değerlendirme.
- Sonra "Dayanak" başlığında ilgili mevzuat veya el kitabı bölümleri.
- "İzlenecek yol" başlığında uygulanabilir, sıralı adımlar.
- "Yetki ve yönlendirme" başlığında kimin karar vermesi gerektiği.
- Kaynak adı ve bağlantısını belirt; el kitabı kanıtlarını [K], mevzuat kanıtlarını [M] diye işaretle.
- Yanıtı Türkçe yaz, gereksiz uzatma yapma.

GÜVENLİK:
Ciddi ve yakın tehlike, yangın, kaldırma ekipmanı, elektrik, rigging veya acil çıkış sorunlarında üretim ya da temsil devamlılığını can güvenliğinin önüne koyma. Belirsizlikte işi güvenli biçimde durdurmayı ve yetkili teknik/İSG değerlendirmesini öner. Hukuki mütalaa verdiğini iddia etme.`;

  const input = [
    ...conversation.map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: String(message.content || "").slice(0, 3000),
    })),
    {
      role: "user",
      content: `${context ? `EL KİTABI KANIT PAKETİ:\n${context}\n\n` : ""}SORU:\n${question}`,
    },
  ];

  const requestBody = {
    model: process.env.OPENAI_MODEL || "gpt-5.6-terra",
    instructions,
    input,
    reasoning: {
      effort: process.env.OPENAI_REASONING_EFFORT || "medium",
    },
    max_output_tokens: 2200,
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI error", response.status, data);
      return json(
        response.status,
        { error: "Canlı model yanıt veremedi. Lütfen kısa süre sonra yeniden deneyin." },
        origin
      );
    }

    const result = extractResult(data);
    if (!result.answer) return json(502, { error: "Model boş yanıt verdi." }, origin);
    return json(200, { ...result, requestId: data.id || null }, origin);
  } catch (error) {
    const message = error?.name === "AbortError"
      ? "Canlı araştırma zaman aşımına uğradı."
      : "Canlı model bağlantısı kurulamadı.";
    return json(504, { error: message }, origin);
  } finally {
    clearTimeout(timeout);
  }
}
