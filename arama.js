/* Devlet Tiyatroları Çalışma ve Uygulama Rehberi · Türkçe tam metin araması */
(() => {
  "use strict";

  function normalize(value) {
    return String(value ?? "")
      .toLocaleLowerCase("tr-TR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ı/g, "i")
      .replace(/ş/g, "s")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function queryTokens(value) {
    return [...new Set(normalize(value).split(/\s+/).filter(Boolean))];
  }

  function matches(text, query) {
    const haystack = normalize(text);
    const words = queryTokens(query);
    return words.length > 0 && words.every((word) => {
      if (haystack.includes(word)) return true;
      const stem = word.length > 6 ? word.slice(0, -2) : word;
      return stem.length > 3 && haystack.includes(stem);
    });
  }

  function snippet(text, query, radius = 150) {
    const raw = String(text ?? "").replace(/\s+/g, " ").trim();
    const haystack = normalize(raw);
    const first = queryTokens(query)[0] || "";
    const position = first ? haystack.indexOf(first) : 0;
    const start = Math.max(0, position - radius);
    const excerpt = raw.slice(start, start + (radius * 2) + 10);
    return `${start ? "…" : ""}${excerpt}${start + excerpt.length < raw.length ? "…" : ""}`;
  }

  const api = { normalize, queryTokens, matches, snippet };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.TTEKArama = api;
})();
