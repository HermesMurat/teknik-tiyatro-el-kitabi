"use strict";

const assert = require("node:assert/strict");
const search = require("../arama.js");

assert.equal(search.normalize("DEKORATÖR"), "dekorator");
assert.equal(search.matches("Dekoratörlerin görev ve sorumlulukları", "dekorator"), true);
assert.equal(search.matches("Sahne dekoratörlüğünde görev paylaşımı", "dekoratör"), true);
assert.equal(search.matches("Dekoratör ve sahne tasarımcısı", "dekoratör sahne"), true);
assert.match(search.snippet("Görev: dekoratör bütün tasarım planlarını hazırlar.", "dekoratör"), /dekoratör/i);

console.log("Türkçe tam metin araması doğrulandı.");
