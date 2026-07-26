/* Tiyatro Teknik Müdürlüğü El Kitabı · Bağlamlı araştırma rehberi v5 */
(() => {
  "use strict";

  const OFFICIAL_HOSTS = [
    "mevzuat.gov.tr",
    "resmigazete.gov.tr",
    "csgb.gov.tr",
    "ktb.gov.tr",
    "devtiyatro.gov.tr",
    "kvkk.gov.tr",
    "ihale.gov.tr",
    "aile.gov.tr",
    "csb.gov.tr",
    "telifhaklari.gov.tr",
  ];

  const LAW_SOURCES = [
    {
      title: "6331 sayılı İş Sağlığı ve Güvenliği Kanunu",
      area: "İş sağlığı ve güvenliği",
      articles: "Özellikle md. 4, 10, 11, 12, 16, 17 ve 19",
      url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6331.pdf",
      keys: "iş sağlığı güvenliği isg risk tehlike kaza ramak çalışan işveren eğitim temsil prova",
      summary: "Risklerin önlenmesi, risk değerlendirmesi, acil durum, bilgilendirme ve eğitim yükümlülüklerini düzenler.",
      action: "İşe özgü risk değerlendirmesini, görevlendirmeyi ve kontrol tedbirlerini doğrulayın.",
      high: true,
    },
    {
      title: "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği",
      area: "İş ekipmanı",
      articles: "md. 5–11 ve EK-III",
      url: "https://www.mevzuat.gov.tr/",
      keys: "ekipman makine motor vinç kaldırma truss caraskal ceraskal platform periyodik kontrol muayene bakım arıza elektrik",
      summary: "Ekipmanın işe uygun, güvenli ve bakımlı olmasını; gerekli kontrollerin yetkili kişilerce yapılmasını düzenler.",
      action: "Kontrol raporunu, kapsamını, tarihini, uygunsuzlukları ve hizmete dönüş kararını yazılı doğrulayın.",
      high: true,
    },
    {
      title: "Binaların Yangından Korunması Hakkında Yönetmelik",
      area: "Yangın ve tahliye",
      articles: "Kaçış yolları, acil çıkışlar, algılama, söndürme ve tahliye hükümleri",
      url: "https://www.mevzuat.gov.tr/",
      keys: "yangın duman alev tahliye acil çıkış kaçış yolu dekor perde sprinkler söndürücü seyirci kapasite",
      summary: "Kaçış yolları ile yangın güvenlik sistemlerinin erişilebilir, işler ve kullanıma hazır tutulmasını düzenler.",
      action: "Kaçış yolunu ve güvenlik sistemlerini engelleyen durumu kaldırmadan alanı kullanıma açmayın.",
      high: true,
    },
    {
      title: "Devlet Tiyatroları Görev ve Çalışma Yönergesi",
      area: "Görev, yetki ve organizasyon",
      articles: "İlgili birim ve görev tanımları",
      url: "https://teftis.ktb.gov.tr/TR-264219/devlet-tiyatrolari-gorev-ve-calisma-yonergesi.html",
      keys: "devlet tiyatroları görev yetki sorumluluk sanat teknik müdür teknik müdür başrealizatör kondüvit sahne amiri atölye turne",
      summary: "Devlet Tiyatrolarındaki birimlerin, yöneticilerin ve teknik görevlerin kurumsal sorumluluk çerçevesini belirler.",
      action: "İşlem ve onayı, güncel görev tanımında belirtilen yetki zinciri üzerinden yazılı yürütün.",
    },
    {
      title: "6698 sayılı Kişisel Verilerin Korunması Kanunu",
      area: "Kişisel veri",
      articles: "Özellikle md. 4, 5, 6, 10 ve 12",
      url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6698.pdf",
      keys: "kvkk kişisel veri fotoğraf video kamera kayıt prova oyuncu çalışan sağlık telefon paylaşım açık rıza aydınlatma",
      summary: "Kişisel verinin hukuki sebebe, belirli amaca ve ölçülülük ilkesine göre işlenmesini ve korunmasını düzenler.",
      action: "Amaç, hukuki sebep, aydınlatma, erişim ve saklama süresini paylaşım öncesinde doğrulayın.",
      high: true,
    },
    {
      title: "5846 sayılı Fikir ve Sanat Eserleri Kanunu",
      area: "Fikrî haklar",
      articles: "İşleme md. 21, çoğaltma md. 22, yayma md. 23, temsil md. 24",
      url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.3.5846.pdf",
      keys: "telif eser temsil uyarlama işleme müzik görsel video yayın kayıt çoğaltma tasarım lisans çeviri",
      summary: "Eserin işlenmesi, çoğaltılması, yayılması, temsili ve farklı mecralarda kullanılmasına ilişkin hakları düzenler.",
      action: "Hak sahibi, mecra, süre, bölge, temsil, kayıt ve yayın izinlerini ayrı ayrı kontrol edin.",
      high: true,
    },
    {
      title: "4734 ve 4735 sayılı kamu alımı mevzuatı",
      area: "Kamu alımı",
      articles: "İhtiyaç, teknik şartname, ihale, sözleşme ve kabul süreçleri",
      url: "https://www.ihale.gov.tr/Mevzuat.aspx?AnaSayfa=true",
      keys: "ihale satın alma doğrudan temin teknik şartname yaklaşık maliyet muayene kabul teslim yüklenici sözleşme malzeme hizmet",
      summary: "Kamu alımının ihtiyaç tanımından sözleşme ve kabule kadar olan idari ve teknik çerçevesini düzenler.",
      action: "İhtiyacı ölçülebilir performans, güvenlik, teslim, test ve kabul ölçütleriyle tanımlayın.",
    },
    {
      title: "5378 sayılı Engelliler Hakkında Kanun ve erişilebilirlik mevzuatı",
      area: "Erişilebilirlik",
      articles: "Umuma açık yapılar, hizmetler, izleme ve denetim",
      url: "https://www.aile.gov.tr/eyhgm/mevzuat/ulusal-mevzuat/",
      keys: "erişilebilirlik engelli tekerlekli sandalye rampa işitme görme altyazı işaret dili sesli betimleme refakatçi tahliye",
      summary: "Umuma açık yapı ve hizmetlerde bağımsız, güvenli ve eşit erişimin sağlanmasına ilişkin çerçeveyi belirler.",
      action: "Seyirci, çalışan ve sanatçı yolculuğunu girişten güvenli çıkışa kadar birlikte değerlendirin.",
    },
  ];

  const state = {
    index: [],
    chapters: new Map(),
    currentChapter: null,
    currentSection: null,
    loadingAll: null,
  };

  const $ = (selector) => document.querySelector(selector);
  const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"]/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
    })[char]);

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

  const STOP_WORDS = new Set(
    "acaba ama ancak ben bir bu da de diye en gibi hangi ile için kadar ki kim mi mı mu mü nasıl ne neden nedir olan olarak olur şu ve veya ya".split(" ")
  );

  function tokens(value) {
    return [...new Set(normalize(value).split(/\s+/).filter((word) => word.length > 2 && !STOP_WORDS.has(word)))];
  }

  function scoreText(text, queryTokens, title = "") {
    const haystack = normalize(text);
    const heading = normalize(title);
    let score = 0;
    let hits = 0;
    for (const word of queryTokens) {
      const stem = word.length > 6 ? word.slice(0, word.length - 2) : word;
      if (heading.includes(word) || heading.includes(stem)) score += 9;
      if (haystack.includes(word)) {
        score += 4;
        hits += 1;
      } else if (stem.length > 3 && haystack.includes(stem)) {
        score += 2;
        hits += 1;
      }
    }
    return score + (queryTokens.length ? (hits / queryTokens.length) * 16 : 0);
  }

  async function fetchJSON(url) {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) throw new Error(`${url}: ${response.status}`);
    return response.json();
  }

  async function ensureIndex() {
    if (state.index.length) return state.index;
    state.index = await fetchJSON("chapters/index.json");
    return state.index;
  }

  async function loadChapter(number) {
    if (state.chapters.has(number)) return state.chapters.get(number);
    const chapter = await fetchJSON(`chapters/${String(number).padStart(2, "0")}.json`);
    state.chapters.set(number, chapter);
    return chapter;
  }

  async function loadAllChapters() {
    if (state.loadingAll) return state.loadingAll;
    state.loadingAll = (async () => {
      const index = await ensureIndex();
      const batchSize = 6;
      for (let start = 0; start < index.length; start += batchSize) {
        await Promise.all(index.slice(start, start + batchSize).map((item) => loadChapter(item.number)));
      }
      return [...state.chapters.values()];
    })();
    return state.loadingAll;
  }

  function setChapter(chapter) {
    state.currentChapter = chapter;
    state.chapters.set(chapter.number, chapter);
  }

  function setSection(section) {
    state.currentSection = section || null;
  }

  function sectionFullText(section) {
    return [
      ...(section.paragraphs || []),
      ...(section.bullets || []),
      ...((section.tables || []).flatMap((table) => [
        ...(table.headers || []),
        ...(table.rows || []).flat(),
      ])),
    ].join(" ");
  }

  function handbookSegments(chapters) {
    const result = [];
    for (const chapter of chapters) {
      chapter.sections.forEach((section, sectionIndex) => {
        const text = sectionFullText(section);
        if (!text.trim()) return;
        result.push({
          chapter: chapter.number,
          chapterTitle: chapter.title,
          section: section.title,
          sectionIndex,
          text,
        });
      });
    }
    return result;
  }

  async function searchHandbook(question, limit = 7) {
    const chapters = await loadAllChapters();
    const queryTokens = tokens(question);
    const preferred = state.currentSection
      ? `${state.currentChapter?.title || ""} ${state.currentSection.title} ${state.currentSection.text || ""}`
      : "";
    return handbookSegments(chapters)
      .map((item) => {
        let score = scoreText(item.text, queryTokens, `${item.chapterTitle} ${item.section}`);
        if (state.currentChapter?.number === item.chapter) score += 4;
        if (preferred && normalize(preferred).includes(normalize(item.section))) score += 14;
        return { ...item, score };
      })
      .filter((item) => item.score > 7)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  function searchLaws(question, limit = 4) {
    const queryTokens = tokens(question);
    return LAW_SOURCES
      .map((source) => ({
        ...source,
        score: scoreText(
          `${source.area} ${source.articles} ${source.keys} ${source.summary} ${source.action}`,
          queryTokens,
          source.title
        ),
      }))
      .filter((source) => source.score > 7)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  function isOfficialURL(url) {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, "");
      return OFFICIAL_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
    } catch {
      return false;
    }
  }

  function isLegalQuestion(question, lawMatches) {
    return lawMatches.length > 0 || /(mevzuat|kanun|yönetmelik|yönerge|madde|hukuk|yetki|zorunlu|yasak|uygun mu|yapılabilir mi)/i.test(question);
  }

  async function timedFetch(url, milliseconds = 16000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), milliseconds);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "text/plain, application/json;q=0.9, */*;q=0.8" },
      });
      if (!response.ok) throw new Error(String(response.status));
      return response;
    } finally {
      clearTimeout(timer);
    }
  }

  function parseSearchMarkdown(markdown, officialOnly) {
    const results = [];
    const seen = new Set();
    const linkPattern = /\[([^\]]{3,180})\]\((https?:\/\/[^)\s]+)\)/g;
    let match;
    while ((match = linkPattern.exec(markdown)) && results.length < 10) {
      const title = match[1].replace(/\s+/g, " ").trim();
      const url = match[2].replace(/[.,]+$/, "");
      if (seen.has(url) || /jina\.ai|google\.com\/search|bing\.com\/search/.test(url)) continue;
      if (officialOnly && !isOfficialURL(url)) continue;
      const after = markdown.slice(match.index + match[0].length, match.index + match[0].length + 900);
      const snippet = after
        .split(/\n#{1,4}\s|\n\s*\n/)[0]
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 650);
      seen.add(url);
      results.push({ title, url, snippet });
    }
    return results;
  }

  async function searchJina(question, officialOnly, legal) {
    const officialScope = legal
      ? " (site:mevzuat.gov.tr OR site:resmigazete.gov.tr OR site:csgb.gov.tr OR site:ktb.gov.tr OR site:kvkk.gov.tr OR site:ihale.gov.tr OR site:aile.gov.tr)"
      : "";
    const query = `${question}${officialOnly ? officialScope : ""}`;
    const encoded = encodeURIComponent(query);
    const gateways = [
      `https://s.jina.ai/?q=${encoded}`,
      `https://r.jina.ai/https://www.google.com/search?q=${encoded}`,
      `https://r.jina.ai/https://www.bing.com/search?q=${encoded}`,
    ];
    let lastError = null;
    for (const gateway of gateways) {
      try {
        const response = await timedFetch(gateway);
        const markdown = await response.text();
        const parsed = parseSearchMarkdown(markdown, officialOnly);
        if (parsed.length) return parsed;
      } catch (error) {
        lastError = error;
      }
    }
    if (lastError) throw lastError;
    return [];
  }

  async function searchWikipedia(question) {
    const url = new URL("https://tr.wikipedia.org/w/api.php");
    url.search = new URLSearchParams({
      origin: "*",
      action: "query",
      format: "json",
      generator: "search",
      gsrlimit: "4",
      prop: "extracts|info",
      inprop: "url",
      exintro: "1",
      explaintext: "1",
      gsrsearch: question,
    });
    const response = await timedFetch(url.toString(), 12000);
    const json = await response.json();
    return Object.values(json.query?.pages || {})
      .sort((a, b) => (a.index || 0) - (b.index || 0))
      .slice(0, 4)
      .map((item) => ({
        title: item.title,
        url: item.fullurl,
        snippet: String(item.extract || "").slice(0, 800),
      }));
  }

  async function readSource(result, question) {
    if (!result.url || result.snippet?.length > 260) return result;
    try {
      const response = await timedFetch(`https://r.jina.ai/${result.url}`, 13000);
      const text = await response.text();
      const queryTokens = tokens(question);
      const paragraphs = text
        .split(/\n\s*\n/)
        .map((part) => part.replace(/^#{1,5}\s*/gm, "").replace(/\s+/g, " ").trim())
        .filter((part) => part.length > 100 && part.length < 1800)
        .map((part) => ({ part, score: scoreText(part, queryTokens) }))
        .sort((a, b) => b.score - a.score);
      return { ...result, snippet: paragraphs[0]?.part.slice(0, 850) || result.snippet || "" };
    } catch {
      return result;
    }
  }

  async function researchWeb(question, officialOnly, legal, lawMatches) {
    let results = [];
    try {
      results = await searchJina(question, officialOnly, legal);
    } catch {
      results = [];
    }

    if (legal) {
      const known = lawMatches.map(({ title, url, summary }) => ({ title, url, snippet: summary }));
      results = [...results, ...known];
    } else if (!officialOnly && results.length < 3) {
      try {
        results = [...results, ...(await searchWikipedia(question))];
      } catch {
        // The source list below remains usable.
      }
    }

    const unique = [...new Map(results.filter((item) => item.url).map((item) => [item.url, item])).values()]
      .filter((item) => !officialOnly || isOfficialURL(item.url))
      .slice(0, 6);
    return Promise.all(unique.map((item) => readSource(item, question)));
  }

  function evidenceText(bookResults, lawResults, webResults) {
    const book = bookResults.map(
      (item, index) =>
        `[K${index + 1}] El kitabı, Bölüm ${item.chapter}, ${item.section}\n${item.text.slice(0, 1100)}`
    );
    const laws = lawResults.map(
      (item, index) =>
        `[M${index + 1}] ${item.title}, ${item.articles}\n${item.summary}\nÖnerilen kontrol: ${item.action}`
    );
    const web = webResults.map(
      (item, index) => `[W${index + 1}] ${item.title}\n${item.snippet || "Kaynak bulundu; metin özeti alınamadı."}\n${item.url}`
    );
    return [...book, ...laws, ...web].join("\n\n");
  }

  async function browserModel() {
    if (window.LanguageModel?.create) {
      const availability = await window.LanguageModel.availability();
      if (availability === "unavailable") return null;
      return window.LanguageModel.create({
        initialPrompts: [{
          role: "system",
          content:
            "Sen tiyatro teknik yönetimi alanında Türkçe çalışan bir araştırma rehberisin. Yalnız verilen kanıtlara dayan; mevzuat maddesi, tarih, kurum kararı veya alıntı uydurma. Soruyu doğrudan yanıtla. Mevzuat sorularında Değerlendirme, Mevzuat dayanağı, İzlenecek yol, Yetki ve Kaynak sınırı başlıklarını kullan. Her önemli iddiayı [K1], [M1] veya [W1] biçiminde kanıta bağla. Çelişki veya güncellik belirsizliğini açıkça belirt. Ciddi ve yakın tehlikede işe başlanmamasını veya işin güvenli biçimde durdurulmasını açıkça yaz.",
        }],
      });
    }
    if (window.ai?.languageModel?.create) {
      const capabilities = await window.ai.languageModel.capabilities?.();
      if (capabilities?.available === "no") return null;
      return window.ai.languageModel.create({
        systemPrompt:
          "Yalnız verilen kaynaklara dayanarak Türkçe yanıtla; bilgi ve mevzuat maddesi uydurma. İddiaları [K1], [M1] ve [W1] ile kaynaklandır.",
      });
    }
    return null;
  }

  async function synthesize(question, bookResults, lawResults, webResults) {
    let model = null;
    try {
      model = await browserModel();
      if (!model) return null;
      const prompt = `SORU:\n${question}\n\nKANITLAR:\n${evidenceText(bookResults, lawResults, webResults)}\n\nYanıtın sonunda hangi noktaların ayrıca güncel resmî metinden veya kurum yetkilisinden doğrulanması gerektiğini belirt.`;
      const response = await model.prompt(prompt);
      model.destroy?.();
      return String(response || "").trim();
    } catch (error) {
      console.warn("Tarayıcı yapay zekâsı kullanılamadı.", error);
      model.destroy?.();
      return null;
    }
  }

  function isCritical(question, lawResults) {
    return lawResults.some((item) => item.high) &&
      /(yangın|duman|alev|patlama|elektrik|vinç|kaldırma|truss|yüksekte|çökme|kopma|yaralanma|acil|tahliye|kontrol süresi|arıza)/i.test(question);
  }

  function linkSources(bookResults, lawResults, webResults) {
    const book = bookResults.slice(0, 5).map(
      (item, index) =>
        `<a class="source" href="chapter.html?id=${item.chapter}#${encodeURIComponent(`section-${item.sectionIndex}`)}">[K${index + 1}] Bölüm ${item.chapter} · ${escapeHTML(item.section)}</a>`
    );
    const laws = lawResults.slice(0, 4).map(
      (item, index) =>
        `<a class="source" href="${escapeHTML(item.url)}" target="_blank" rel="noopener">[M${index + 1}] ${escapeHTML(item.title)} · ${escapeHTML(item.articles)}</a>`
    );
    const web = webResults.slice(0, 6).map(
      (item, index) =>
        `<a class="source" href="${escapeHTML(item.url)}" target="_blank" rel="noopener">[W${index + 1}] ${escapeHTML(item.title)}</a>`
    );
    return `<div class="rag-sources"><b>Kullanılan kaynaklar</b>${[...book, ...laws, ...web].join("")}</div>`;
  }

  function renderModelAnswer(text, bookResults, lawResults, webResults) {
    const safe = escapeHTML(text)
      .replace(/^###?\s+(.+)$/gm, "<h4>$1</h4>")
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/\n/g, "<br>");
    return `<div class="research-answer">${safe}</div>${linkSources(bookResults, lawResults, webResults)}`;
  }

  function renderEvidenceAnswer(question, bookResults, lawResults, webResults) {
    const lead = lawResults.length
      ? `Soru en güçlü biçimde <b>${escapeHTML(lawResults[0].area)}</b> alanına giriyor. Aşağıdaki değerlendirme el kitabındaki ilgili metin, kayıtlı mevzuat eşleşmesi ve erişilebilen güncel internet kaynaklarının birlikte okunmasıyla oluşturuldu.`
      : bookResults.length
        ? "El kitabında soruyla doğrudan ilişkili metinler bulundu. İnternet kaynakları ayrıca tarandı; kesin karar gerektiren durumda kurumun güncel prosedürü ve yetkili görüşü kontrol edilmelidir."
        : "El kitabında güçlü bir eşleşme bulunmadı. Aşağıdaki sonuçlar genel internet araştırmasına dayanıyor.";
    const critical = isCritical(question, lawResults)
      ? '<div class="rag-alert"><b>Güvenlik kararı:</b> Ciddi ve yakın tehlike, çalışmayan güvenlik sistemi, süresi geçmiş zorunlu kontrol veya belirsiz yetki varsa işe ya da temsile başlanmamalı; başladıysa çalışma güvenli biçimde durdurulmalıdır.</div>'
      : "";
    const lawCards = lawResults.length
      ? `<h4>Mevzuat eşleşmesi</h4>${lawResults.map((item, index) => `
          <div class="rag-law">
            <b>[M${index + 1}] ${escapeHTML(item.title)}</b><br>
            <small>${escapeHTML(item.articles)}</small>
            <p>${escapeHTML(item.summary)}</p>
          </div>`).join("")}`
      : "";
    const bookCards = bookResults.length
      ? `<h4>El kitabından ilgili içerik</h4>${bookResults.slice(0, 4).map((item, index) => `
          <div class="evidence-card">
            <b>[K${index + 1}] Bölüm ${item.chapter} · ${escapeHTML(item.section)}</b>
            <p>${escapeHTML(item.text.slice(0, 520))}${item.text.length > 520 ? "…" : ""}</p>
          </div>`).join("")}`
      : "";
    const webCards = webResults.length
      ? `<h4>Güncel internet araştırması</h4>${webResults.slice(0, 5).map((item, index) => `
          <div class="evidence-card">
            <b>[W${index + 1}] ${escapeHTML(item.title)}</b>
            <p>${escapeHTML((item.snippet || "Kaynak bulundu; otomatik metin özeti alınamadı.").slice(0, 620))}</p>
          </div>`).join("")}`
      : '<div class="notice">Canlı internet kaynağına şu anda ulaşılamadı. El kitabı ve kayıtlı resmî kaynak bağlantıları kullanılabilir.</div>';
    const steps = lawResults.length
      ? `<h4>İzlenecek yol</h4><ol>${lawResults.map((item) => `<li>${escapeHTML(item.action)}</li>`).join("")}</ol>`
      : "";
    return `
      <div class="research-answer">
        <h4>Değerlendirme</h4><p>${lead}</p>${critical}
        ${lawCards}${steps}${bookCards}${webCards}
        <div class="notice"><b>Yanıt biçimi:</b> Bu tarayıcıda yerleşik dil modeli kullanılamadığı için yorum uydurmak yerine bulunan metinler ve işlem adımları doğrudan gösterildi.</div>
      </div>
      ${linkSources(bookResults, lawResults, webResults)}`;
  }

  function messagesElement() {
    return $("#messages");
  }

  function addMessage(role, content, asHTML = false, id = "") {
    const container = messagesElement();
    if (!container) return null;
    const bubble = document.createElement("div");
    bubble.className = `msg ${role === "user" ? "user" : ""}`;
    if (id) bubble.id = id;
    if (asHTML) bubble.innerHTML = content;
    else bubble.textContent = content;
    container.append(bubble);
    container.scrollTop = container.scrollHeight;
    return bubble;
  }

  async function answer(question) {
    const mode = document.querySelector('input[name="mode"]:checked')?.value || "hybrid";
    const officialOnly = $("#officialOnly")?.checked ?? true;
    addMessage("user", question);
    const thinking = addMessage("assistant", "El kitabının tam metni ve güncel kaynaklar araştırılıyor…", false, "research-thinking");

    try {
      const bookResults = mode === "general" ? await searchHandbook(question, 3) : await searchHandbook(question, 7);
      const lawResults = searchLaws(question);
      const legal = isLegalQuestion(question, lawResults);
      const webResults = mode === "book"
        ? []
        : await researchWeb(question, legal ? officialOnly : false, legal, lawResults);
      if (thinking) thinking.textContent = "Bulunan kaynaklar birlikte değerlendiriliyor…";
      const modelAnswer = await synthesize(question, bookResults, lawResults, webResults);
      thinking?.remove();
      const html = modelAnswer
        ? renderModelAnswer(modelAnswer, bookResults, lawResults, webResults)
        : renderEvidenceAnswer(question, bookResults, lawResults, webResults);
      addMessage("assistant", `${html}<p class="rag-status"><b>Araştırma zamanı:</b> ${escapeHTML(new Date().toLocaleString("tr-TR"))}. Bu rehber hukuki mütalaa veya yetkili kurum kararı değildir; güncel resmî metin ve kurumun onaylı prosedürü önceliklidir.</p>`, true);
    } catch (error) {
      console.error(error);
      thinking?.remove();
      addMessage(
        "assistant",
        "Araştırma tamamlanamadı. İnternet bağlantısını kontrol edip yeniden deneyin; bölüm metinlerini okumaya devam edebilirsiniz."
      );
    }
  }

  function openDialog(prefill = "") {
    const dialog = $("#ai");
    if (!dialog) return;
    dialog.showModal();
    if (prefill) $("#question").value = prefill;
    $("#question")?.focus();
  }

  function bindUI() {
    $("#openAI")?.addEventListener("click", () => openDialog());
    $("#closeAI")?.addEventListener("click", () => $("#ai")?.close());
    $("#aiForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = $("#question");
      const question = input?.value.trim() || "";
      if (question.length < 3) return;
      input.value = "";
      answer(question);
    });
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-ask-context]");
      if (!button) return;
      openDialog(button.dataset.askContext || "");
    });
  }

  const style = document.createElement("style");
  style.textContent = `
    .msg h4{margin:14px 0 7px;font:700 18px Georgia}
    .msg ol,.msg ul{margin:7px 0 12px 20px;padding:0}
    .msg li{margin:6px 0}
    .rag-alert{border-left:4px solid #962f2f;background:#f8e8e3;padding:11px 13px;border-radius:8px;margin:12px 0;color:#3a1515}
    .rag-law,.evidence-card{padding:11px 0;border-bottom:1px solid var(--line)}
    .rag-law:last-child,.evidence-card:last-child{border-bottom:0}
    .rag-law p,.evidence-card p{margin:5px 0}
    .rag-status{font-size:12px;color:var(--muted);margin-top:13px}
    .rag-sources{margin-top:15px;padding-top:12px;border-top:1px solid var(--line)}
    .rag-sources .source{display:block;color:var(--red);margin:7px 0;text-decoration:none}
    .research-answer>h4:first-child{margin-top:0}
  `;
  document.head.append(style);

  window.TTEKRehber = { answer, openDialog, setChapter, setSection, loadAllChapters };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindUI);
  else bindUI();
})();
