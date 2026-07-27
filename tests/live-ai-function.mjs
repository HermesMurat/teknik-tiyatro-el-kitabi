import assert from "node:assert/strict";

process.env.OPENAI_API_KEY = "test-key";
process.env.OPENAI_MODEL = "gpt-5.6-terra";

const { handler } = await import("../netlify/functions/ai.mjs");

const blocked = await handler({
  httpMethod: "POST",
  headers: { origin: "https://example.com", "x-forwarded-for": "192.0.2.10" },
  body: JSON.stringify({ question: "Bu soru engellenmeli." }),
});
assert.equal(blocked.statusCode, 403);
assert.equal(blocked.headers["access-control-allow-origin"], undefined);

let requestBody = null;
globalThis.fetch = async (_url, options) => {
  requestBody = JSON.parse(options.body);
  return {
    ok: true,
    status: 200,
    async json() {
      return {
        id: "resp_test",
        output: [{
          type: "message",
          content: [{
            type: "output_text",
            text: "Kaynaklara dayalı canlı yanıt.",
            annotations: [{
              type: "url_citation",
              title: "Devlet Tiyatroları Görev ve Çalışma Yönergesi",
              url: "https://teftis.ktb.gov.tr/TR-264533/devlet-tiyatrolari-gorev-ve-calisma-yonergesi.html",
            }],
          }],
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
    context: "[K1] El kitabı kanıtı",
    mode: "hybrid",
  }),
});
assert.equal(hybrid.statusCode, 200);
assert.equal(hybrid.headers["access-control-allow-origin"], "https://hermesmurat.github.io");
assert.equal(requestBody.model, "gpt-5.6-terra");
assert.equal(requestBody.tools[0].type, "web_search");
assert.deepEqual(requestBody.tools[0].filters.allowed_domains.sort(), ["devtiyatro.gov.tr", "teftis.ktb.gov.tr"]);
assert.equal(requestBody.reasoning.effort, "medium");
assert.match(requestBody.safety_identifier, /^tte_[a-f0-9]{32}$/);
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
assert.equal(requestBody.tool_choice, undefined);

console.log("Canlı model işlevi, kaynak filtresi ve CORS doğrulandı.");
