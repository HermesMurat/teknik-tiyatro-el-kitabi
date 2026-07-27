import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = "test-key";
process.env.GEMINI_MODEL = "gemini-flash-lite-latest";
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
        id: "gemini_test",
        status: "completed",
        steps: [{
          type: "model_output",
          content: [{ type: "text", text: "Kaynaklara dayalı canlı yanıt." }],
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
assert.equal(requestUrl, "https://generativelanguage.googleapis.com/v1beta/interactions");
assert.equal(requestBody.model, "gemini-flash-lite-latest");
assert.match(requestBody.system_instruction, /Devlet Tiyatrolarında teknik yönetim/);
assert.match(requestBody.input, /Dekoratörün görev sınırı nedir/);
assert.equal(requestBody.store, false);
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
assert.match(requestBody.input, /Yalnız kitaptan yanıtla/);

console.log("Gemini Interactions canlı model işlevi, kaynak filtresi ve CORS doğrulandı.");
