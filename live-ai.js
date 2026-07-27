/* Tiyatro Teknik El Kitabı · canlı model istemcisi */
(() => {
  'use strict';

  const ENDPOINT = window.LIVE_AI_ENDPOINT || (
    location.hostname === 'hermesmurat.github.io'
      ? 'https://teknik-tiyatro-el-kitabi.netlify.app/api/ai'
      : '/api/ai'
  );
  const history = [];
  const localAnswer = window.TTEKRehber?.answer || null;

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
      if (context) return String(context).slice(0, 30000);
    }

    const candidates = [];
    document.querySelectorAll('#content, [data-chapter-content], main .chapter-content, .reader-content').forEach((node) => {
      const text = node.innerText?.trim();
      if (text) candidates.push(text);
    });

    return candidates.join('\n\n').slice(0, 30000);
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

  async function liveAnswer(question) {
    const q = String(question || '').trim();
    if (!q) return;

    const userMessage = addMessage(escapeHtml(q), 'user');
    const loading = addMessage('<strong>Canlı model araştırıyor…</strong><br><small>El kitabı ve güncel resmî kaynaklar birlikte inceleniyor.</small>');

    try {
      const mode = document.querySelector('input[name="mode"]:checked')?.value || 'hybrid';
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question: q,
          context: await collectContext(q, mode),
          history: history.slice(-6),
          mode,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Canlı model yanıt veremedi.');

      const provider = data.provider === 'gemini' ? 'Gemini ücretsiz katmanı' : 'canlı model';
      loading.innerHTML = `<div class="research-answer"><p>${markdown(data.answer)}</p></div>${sourceList(data.sources)}<div class="notice"><strong>${escapeHtml(provider)} yanıtı</strong><br>Yanıt el kitabı bağlamı${mode === 'book' ? '' : ' ve güncel resmî Devlet Tiyatroları kaynakları'} kullanılarak oluşturuldu. Resmî metin ve kurumun yetkili kararı önceliklidir.</div>`;
      history.push({ role: 'user', content: q }, { role: 'assistant', content: data.answer });
    } catch (error) {
      if (localAnswer) {
        userMessage?.remove();
        loading?.remove();
        try { await localAnswer(q); } catch (_) {}
      } else {
        loading.innerHTML = `<strong>Canlı model şu anda kullanılamıyor.</strong><br>${escapeHtml(error.message || error)}<div class="notice">Lütfen kısa süre sonra yeniden deneyin.</div>`;
      }
    }
  }

  window.TTEKRehber?.setAnswerHandler(liveAnswer);

  const button = document.querySelector('#openAI');
  if (button) button.textContent = 'Yapay zekâ ile ara';
  const header = document.querySelector('#ai .dlghead > div');
  if (header) header.innerHTML = '<b>Canlı Teknik Rehber</b><br><small>Ücretsiz Gemini modeli + el kitabı + resmî Devlet Tiyatroları kaynakları</small>';
})();
