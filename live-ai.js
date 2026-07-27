/* Tiyatro Teknik El Kitabı · canlı model istemcisi */
(() => {
  'use strict';

  const ENDPOINT = window.LIVE_AI_ENDPOINT || '/api/ai';
  const history = [];
  const localAnswer = typeof window.answer === 'function' ? window.answer : null;

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

  function collectContext(question) {
    const candidates = [];
    document.querySelectorAll('[data-chapter-content], article, main .chapter-content, .reader-content').forEach((node) => {
      const text = node.innerText?.trim();
      if (text) candidates.push(text);
    });

    if (!candidates.length && Array.isArray(window.chapters || globalThis.chapters)) {
      const list = window.chapters || globalThis.chapters;
      const terms = String(question).toLocaleLowerCase('tr-TR').split(/\s+/).filter((x) => x.length > 2);
      const ranked = list.map((c) => {
        const text = [c[1], c[2], c[3], ...(c[4] || [])].join(' ');
        const normalized = text.toLocaleLowerCase('tr-TR');
        const score = terms.reduce((sum, term) => sum + (normalized.includes(term) ? 1 : 0), 0);
        return { score, text: `Bölüm ${c[0]}: ${c[1]}\n${c[3]}` };
      }).sort((a, b) => b.score - a.score).slice(0, 6);
      candidates.push(ranked.map((x) => x.text).join('\n\n'));
    }

    return candidates.join('\n\n').slice(0, 30000);
  }

  async function liveAnswer(question) {
    const q = String(question || '').trim();
    if (!q) return;

    addMessage(escapeHtml(q), 'user');
    const loading = addMessage('<strong>Canlı model araştırıyor…</strong><br><small>El kitabı ve güncel resmî kaynaklar birlikte inceleniyor.</small>');

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question: q,
          context: collectContext(q),
          history: history.slice(-6),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Canlı model yanıt veremedi.');

      loading.innerHTML = `<p>${markdown(data.answer)}</p><div class="notice"><strong>Canlı araştırma</strong><br>Yanıt el kitabı bağlamı ve güncel internet araştırması kullanılarak oluşturuldu. Resmî mevzuat metni ve kurumun yetkili kararı önceliklidir.</div>`;
      history.push({ role: 'user', content: q }, { role: 'assistant', content: data.answer });
    } catch (error) {
      loading.innerHTML = `<strong>Canlı model şu anda kullanılamıyor.</strong><br>${escapeHtml(error.message || error)}<div class="notice">Yerel kaynak rehberiyle devam ediliyor.</div>`;
      if (localAnswer) {
        try { await localAnswer(q); } catch (_) {}
      }
    }
  }

  window.answer = liveAnswer;

  const button = document.querySelector('#openAI');
  if (button) button.textContent = 'Canlı yapay zekâ ve mevzuat';
  const header = document.querySelector('#ai .dlghead > div');
  if (header) header.innerHTML = '<b>Canlı Teknik Rehber</b><br><small>El kitabı + güncel resmî mevzuat + genel araştırma</small>';
})();
