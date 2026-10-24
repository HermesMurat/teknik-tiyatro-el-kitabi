/* Devlet Tiyatroları Çalışma ve Uygulama Rehberi · canlı model istemcisi */
(() => {
  'use strict';

  const ENDPOINT = window.LIVE_AI_ENDPOINT || (
    location.hostname === 'hermesmurat.github.io'
      ? 'https://teknik-tiyatro-el-kitabi.netlify.app/api/ai'
      : '/api/ai'
  );
  const PUTER_SRC = 'https://js.puter.com/v2/';
  const history = [];
  const localAnswer = window.TTEKRehber?.answer || null;
  let puterLoader = null;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function markdown(text) {
    const safe = escapeHtml(text);
    return safe
      .replace(/^###\s+(.+)$/gm, '<h4>$1</h4>')
      .replace(/^##\s+(.+)$/gm, '<h3>$1</h3>')
      .replace(/^#\s+(.+)$/gm, '<h2>$1</h2>')
      .replace(/^\s*[-•]\s+(.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a class="source" href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }

  function addMessage(html, className = '') {
    const box = document.querySelector('#messages');
    if (!box) return null;
    const node = document.createElement('div');
    node.className = `msg ${className}`.trim();
    node.innerHTML = html;
    box.appendChild(node);
    box.scrollTop = box.scrollHeight;
    return node;
  }

  async function collectContext(question, mode) {
    if (typeof window.TTEKRehber?.buildLiveContext === 'function') {
      const context = await window.TTEKRehber.buildLiveContext(question, { mode });
      if (context) return String(context).slice(0, 12000);
    }

    const candidates = [];
    document.querySelectorAll('#content, [data-chapter-content], main .chapter-content, .reader-content').forEach((node) => {
      const text = node.innerText?.trim();
      if (text) candidates.push(text);
    });

    return candidates.join('\n\n').slice(0, 12000);
  }

  function sourceList(sources) {
    if (!Array.isArray(sources) || !sources.length) return '';
    const links = sources.map((source) => {
      try {
        const url = new URL(source.url);
        if (!/^https?:$/.test(url.protocol)) return '';
        const title = escapeHtml(source.title || url.hostname);
        return `<a class="source" href="${escapeHtml(url.href)}" target="_blank" rel="noopener noreferrer">${title}</a>`;
      } catch {
        return '';
      }
    }).filter(Boolean);
    return links.length
      ? `<div class="rag-sources"><strong>Canlı modelin kullandığı resmî kaynaklar</strong>${links.join('')}</div>`
      : '';
  }

  function loadPuter() {
    if (window.puter?.ai?.chat) return Promise.resolve(window.puter);
    if (puterLoader) return puterLoader;
    puterLoader = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${PUTER_SRC}"]`);
      const script = existing || document.createElement('script');
      const timer = setTimeout(() => reject(new Error('Ücretsiz model yüklenemedi.')), 15000);
      script.addEventListener('load', () => {
        clearTimeout(timer);
        if (window.puter?.ai?.chat) resolve(window.puter);
        else reject(new Error('Ücretsiz model başlatılamadı.'));
      }, { once: true });
      script.addEventListener('error', () => {
        clearTimeout(timer);
        reject(new Error('Ücretsiz model bağlantısı kurulamadı.'));
      }, { once: true });
      if (!existing) {
        script.src = PUTER_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
    });
    return puterLoader;
  }

  function puterText(response) {
    const content = response?.message?.content;
    if (typeof content === 'string') return content.trim();
    if (Array.isArray(content)) {
      return content.map((part) => (
        typeof part === 'string' ? part : part?.text || ''
      )).join('\n').trim();
    }
    return typeof response?.text === 'string' ? response.text.trim() : '';
  }

  async function askPuter(question, context) {
    await loadPuter();
    const messages = [{
      role: 'system',
      content: `Sen Türkiye Cumhuriyeti Devlet Tiyatrolarının teknik, sanatsal ve idarî işleyişi için çalışan bir uzman rehbersin.
Önce verilen Devlet Tiyatroları Çalışma ve Uygulama Rehberi kanıt paketini kullan. Yalnız paketteki konuya doğrudan ilişkin resmî kamu kaynaklarına dayan. Kaynakta bulunmayan görev, yetki, süre, madde veya kurumsal uygulama uydurma.
Yanıtı Türkçe ve kısa yaz. Şu başlıkları kullan: "Kısa cevap", "İlgili kanun maddeleri", "Araştırma özeti", "Uygulama adımları", "Akıllı çözüm önerileri", "Yetki ve güvenlik sınırı". El kitabı kanıtlarını [K], mevzuat kanıtlarını [M] olarak göster. Ciddi güvenlik riskinde işi güvenli biçimde durdurmayı ve yetkili teknik/İSG değerlendirmesini öner. Hukuki mütalaa verdiğini iddia etme.`
    }, ...history.slice(-4), {
      role: 'user',
      content: `${context ? `REHBER VE RESMÎ KAYNAK KANIT PAKETİ:\n${context}\n\n` : ''}SORU:\n${question}`
    }];
    const response = await window.puter.ai.chat(messages, {
      model: 'gemini-3.5-flash-lite',
      temperature: 0.2,
      max_tokens: 1400,
    });
    const answer = puterText(response);
    if (!answer) throw new Error('Ücretsiz model boş yanıt verdi.');
    return answer;
  }

  async function askPuterIdeas(question, context) {
    await loadPuter();
    const messages = [{
      role: 'system',
      content: `Sen Devlet Tiyatrolarında teknik yönetim alanında deneyimli bir yaratıcı çözüm danışmanısın. Verilen kanıtlara dayanarak uygulanabilir, özgün fikirler üret.
Mevzuata aykırı, güvenlik riski taşıyan veya kaynakta olmayan yetki/süre/madde uyduran öneri verme. Kanun maddesi uydurma; dayanak varsa [M] veya [K] ile bağla.
5 fikir üret; her biri için "### 1. Fikir adı", "Nasıl uygulanır:", "Kazanç:", "Risk / ön koşul:" başlıklarını kullan. En az biri düşük maliyetli, biri kurum içi işbirliği, biri süreç sadeleştirme olsun. Türkçe yaz, 500 kelimeyi geçme ve sonda önerilerin bağlayıcı olmadığını belirt.`
    }, {
      role: 'user',
      content: `${context ? `KANIT PAKETİ:\n${context}\n\n` : ''}SORU:\n${question}`
    }];
    const response = await window.puter.ai.chat(messages, {
      model: 'gemini-3.5-flash-lite',
      temperature: 0.7,
      max_tokens: 1200,
    });
    const answer = puterText(response);
    if (!answer) throw new Error('Ücretsiz model boş yanıt verdi.');
    return answer;
  }

  window.TTEKLiveAI = { askIdeas: askPuterIdeas };

  function renderAnswer(node, answer, mode, provider, sources = [], durationMs = 0) {
    const seconds = durationMs ? `${(durationMs / 1000).toFixed(1)} sn` : '';
    const trace = `<div class="research-trace"><b>Araştırma:</b> ${sources.length} resmî kaynak · ${mode === 'book' ? 'yalnız el kitabı' : 'el kitabı + resmî siteler'}${seconds ? ` · yanıt ${seconds}` : ''}</div>`;
    node.innerHTML = `${trace}<div class="research-answer"><p>${markdown(answer)}</p></div>${sourceList(sources)}<div class="notice"><strong>${escapeHtml(provider)} yanıtı</strong><br>Yanıt rehber bağlamı${mode === 'book' ? '' : ' ve ilgili güncel resmî kamu kaynakları'} kullanılarak oluşturuldu. Resmî metin ve kurumun yetkili kararı önceliklidir.</div><button class="btn secondary ideas-open" type="button" data-ideas="1">💡 Yaratıcı öneriler</button>`;
  }

  async function liveAnswer(question) {
    const q = String(question || '').trim();
    if (!q) return;

    const started = performance.now();
    const userMessage = addMessage(escapeHtml(q), 'user');
    const loading = addMessage('<strong>Araştırma başladı…</strong><br><small class="research-timer">El kitabı hazırlanıyor · 0 sn</small>');
    const mode = document.querySelector('input[name="mode"]:checked')?.value || 'hybrid';
    let context = '';
    const timer = setInterval(() => {
      if (!loading?.isConnected) return;
      const small = loading.querySelector('.research-timer');
      const seconds = Math.round((performance.now() - started) / 1000);
      if (small) small.textContent = `El kitabı + resmî kaynaklar taranıyor · ${seconds} sn`;
    }, 400);

    try {
      context = await collectContext(q, mode);
      if (loading?.isConnected) {
        const small = loading.querySelector('.research-timer');
        if (small) small.textContent = 'Yanıt yazılıyor…';
      }
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question: q,
          context,
          history: history.slice(-4),
          mode,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const failure = new Error(data.error || 'Canlı model yanıt veremedi.');
        failure.quota = response.status === 429;
        throw failure;
      }

      const provider = data.provider === 'gemini' ? 'Gemini ücretsiz katmanı' : 'canlı model';
      renderAnswer(loading, data.answer, mode, provider, data.sources, performance.now() - started);
      history.push({ role: 'user', content: q }, { role: 'assistant', content: data.answer });
    } catch (error) {
      try {
        loading.innerHTML = error.quota
          ? '<strong>Ücretsiz model kotası doldu.</strong><br><small class="research-timer">Yedek model deneniyor; bu birkaç saniye sürebilir.</small>'
          : '<strong>Ücretsiz modele bağlanılıyor…</strong><br><small class="research-timer">API anahtarı gerektirmeyen yedek model hazırlanıyor.</small>';
        const answer = await askPuter(q, context || await collectContext(q, mode));
        renderAnswer(loading, answer, mode, 'Puter üzerinden ücretsiz Gemini', [], performance.now() - started);
        history.push({ role: 'user', content: q }, { role: 'assistant', content: answer });
      } catch (puterError) {
        if (localAnswer) {
          userMessage?.remove();
          loading?.remove();
          try { await localAnswer(q); } catch (_) {}
        } else {
          loading.innerHTML = `<strong>Canlı model şu anda kullanılamıyor.</strong><br>${escapeHtml(puterError.message || error.message || error)}<div class="notice">Lütfen kısa süre sonra yeniden deneyin.</div>`;
        }
      }
    } finally {
      clearInterval(timer);
    }
  }

  window.TTEKRehber?.setAnswerHandler(liveAnswer);

  const button = document.querySelector('#openAI');
  if (button) button.textContent = 'Yapay zekâ ile ara';
  const header = document.querySelector('#ai .dlghead > div');
  if (header) header.innerHTML = '<b>Hızlı Çalışma Rehberi + Öneri Atölyesi</b><br><small>30 bölümlü rehber + resmî kaynaklar · API anahtarı gerekmez</small>';
})();
