import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = "test-key";
process.env.GEMINI_MODEL = "gemini-2.5-flash";
delete process.env.OPENAI_API_KEY;

const { handler } = await import("../netlify/functions/ai.mjs");

const blocked = await handler({
  httpMethod: "POST",
  headers: { origin: "https://example.com", "x-forwarded-for": "192.0.2.10" },
  body: JSON.stringify({ question: "Bu soru engellenmeli." }),
});
assert.equal(blocked.statusCode, 403);
assert.equal(blocked.headers["access-control-allow-origin"], undefined);

let requestBody = null;
let requestUrl = null;
globalThis.fetch = async (url, options) => {
  requestUrl = String(url);
  requestBody = JSON.parse(options.body);
  return {
    ok: true,
    status: 200,
    async json() {
      return {
        responseId: "gemini_test",
        candidates: [{
          content: {
            parts: [{ text: "Kaynaklara dayalı canlı yanıt." }],
          },
        }],
      };
    },
  };
};

const hybrid = await handler({
  httpMethod: "POST",
  headers: { origin: "https://hermesmurat.github.io", "x-forwarded-for": "192.0.2.11" },
  body: JSON.stringify({
    question: "Dekoratörün görev sınırı nedir?",
    context: "[K1] El kitabı kanıtı\n[M1] Resmî kaynak\nhttps://teftis.ktb.gov.tr/TR-264533/devlet-tiyatrolari-gorev-ve-calisma-yonergesi.html",
    mode: "hybrid",
  }),
});
assert.equal(hybrid.statusCode, 200);
assert.equal(hybrid.headers["access-control-allow-origin"], "https://hermesmurat.github.io");
assert.match(requestUrl, /gemini-2\.5-flash:generateContent$/);
assert.match(requestBody.systemInstruction.parts[0].text, /Devlet Tiyatrolarında teknik yönetim/);
assert.equal(requestBody.contents.at(-1).role, "user");
assert.equal(JSON.parse(hybrid.body).provider, "gemini");
assert.equal(JSON.parse(hybrid.body).sources.length, 1);

await handler({
  httpMethod: "POST",
  headers: { origin: "https://hermesmurat.github.io", "x-forwarded-for": "192.0.2.12" },
  body: JSON.stringify({
    question: "Yalnız kitaptan yanıtla.",
    context: "[K1] El kitabı kanıtı",
    mode: "book",
  }),
});
assert.equal(requestBody.tools, undefined);
assert.equal(requestBody.contents.at(-1).role, "user");

console.log("Gemini canlı model işlevi, kaynak filtresi ve CORS doğrulandı.");
