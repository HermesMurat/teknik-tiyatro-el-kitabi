const OPENAI_URL = "https://api.openai.com/v1/responses";

const allowedOrigins = new Set([
  "https://hermesmurat.github.io",
  "https://teknik-tiyatro-el-kitabi.netlify.app",
]);

function json(statusCode, body, origin = "*") {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": origin,
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "POST, OPTIONS",
      "cache-control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function extractText(response) {
  if (typeof response?.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }
  const parts = [];
  for (const item of response?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && content?.text) parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

export async function handler(event) {
  const origin = event.headers?.origin || "";
  const corsOrigin = allowedOrigins.has(origin) || origin.endsWith(".netlify.app") ? origin : "*";

  if (event.httpMethod === "OPTIONS") return json(204, {}, corsOrigin);
  if (event.httpMethod !== "POST") return json(405, { error: "Yalnız POST kabul edilir." }, corsOrigin);
  if (!process.env.OPENAI_API_KEY) {
    return json(503, { error: "Canlı model anahtarı henüz sunucuya tanımlanmamış." }, corsOrigin);
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Geçersiz istek." }, corsOrigin);
  }

  const question = String(payload.question || "").trim().slice(0, 2500);
  const context = String(payload.context || "").trim().slice(0, 30000);
  const conversation = Array.isArray(payload.history) ? payload.history.slice(-6) : [];
  if (question.length < 3) return json(400, { error: "Lütfen daha açık bir soru yazın." }, corsOrigin);

  const instructions = `Sen Türkiye'deki tiyatro teknik yönetimi için çalışan bir uzman rehbersin.

ÖNCELİK SIRASI:
1. Kullanıcının gönderdiği Tiyatro Teknik Müdürlüğü El Kitabı bağlamını kullan.
2. Güncel mevzuat sorularında web araması yap ve öncelikle resmigazete.gov.tr, mevzuat.gov.tr, csgb.gov.tr, ktb.gov.tr, devtiyatro.gov.tr, kvkk.gov.tr, ihale.gov.tr ve aile.gov.tr gibi resmî kaynaklara dayan.
3. Resmî kaynak bulunamazsa bunu açıkça belirt; genel mesleki bilgi ile mevzuat hükmünü birbirine karıştırma.

YANIT BİÇİMİ:
- Önce doğrudan ve anlaşılır değerlendirme.
- Sonra "Dayanak" başlığında ilgili mevzuat veya el kitabı bölümleri.
- "İzlenecek yol" başlığında uygulanabilir, sıralı adımlar.
- "Yetki ve yönlendirme" başlığında kimin karar vermesi gerektiği.
- Kaynakların tarihini ve bağlantılarını belirt.

GÜVENLİK:
Ciddi ve yakın tehlike, yangın, kaldırma ekipmanı, elektrik, rigging veya acil çıkış sorunlarında üretim ya da temsil devamlılığını can güvenliğinin önüne koyma. Belirsizlikte işi güvenli biçimde durdurmayı ve yetkili teknik/İSG değerlendirmesini öner. Hukuki mütalaa verdiğini iddia etme.`;

  const input = [
    ...conversation.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 3000),
    })),
    {
      role: "user",
      content: `${context ? `EL KİTABI BAĞLAMI:\n${context}\n\n` : ""}SORU:\n${question}`,
    },
  ];

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
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        instructions,
        input,
        tools: [{
          type: "web_search_preview",
          search_context_size: "high",
          user_location: {
            type: "approximate",
            country: "TR",
            city: "İzmir",
            region: "İzmir",
            timezone: "Europe/Istanbul",
          },
        }],
        max_output_tokens: 1800,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI error", response.status, data);
      return json(response.status, { error: "Canlı model yanıt veremedi. Lütfen kısa süre sonra yeniden deneyin." }, corsOrigin);
    }

    const answer = extractText(data);
    if (!answer) return json(502, { error: "Model boş yanıt verdi." }, corsOrigin);
    return json(200, { answer, requestId: data.id || null }, corsOrigin);
  } catch (error) {
    const message = error?.name === "AbortError" ? "Canlı araştırma zaman aşımına uğradı." : "Canlı model bağlantısı kurulamadı.";
    return json(504, { error: message }, corsOrigin);
  } finally {
    clearTimeout(timeout);
  }
}
