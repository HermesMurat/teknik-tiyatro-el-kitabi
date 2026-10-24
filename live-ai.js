/* Devlet Tiyatroları Çalışma ve Uygulama Rehberi · canlı model istemcisi */
(() => {
  'use strict';

  const ENDPOINT = window.LIVE_AI_ENDPOINT || (
    location.hostname === 'hermesmurat.github.io'
      ? 'https://teknik-tiyatro-el-kitabi.netlify.app/api/ai'
      : '/api/ai'
  );
  const PUTER_SRC = 'https://js.puter.com/v2/';
  const PUTER_MODEL = 'gemini-3.1-flash-lite';
  const PREF_KEY = 'tte-ai-provider';
  const history = [];
  const localAnswer = window.TTEKRehber?.answer || null;
  let puterLoader = null;
  let pendingQuestion = null;
  let accountButton = null;
  let memoryPreference = '';
  let puterPreloading = false;

  // Puter kütüphanesini sayfa açılışında arka planda yükle; giriş popup'ının engellenmesini önler.
  function preloadPuter() {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    if (!document.head) return; // Gerçek browser DOM değilse yüklemeyi atla
    if (puterPreloading || puterLoader || (window.puter?.ai?.chat)) return;
    puterPreloading = true;
    const script = document.createElement('script');
    script.src = PUTER_SRC;
    script.async = true;
    script.onload = () => { puterPreloading = false; };
    script.onerror = () => { puterPreloading = false; };
    document.head.appendChild(script);
  }

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
      model: PUTER_MODEL,
      temperature: 0.2,
      max_tokens: 1400,
      reasoning_effort: 'minimal',
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
      model: PUTER_MODEL,
      temperature: 0.7,
      max_tokens: 1200,
      reasoning_effort: 'minimal',
    });
    const answer = puterText(response);
    if (!answer) throw new Error('Ücretsiz model boş yanıt verdi.');
    return answer;
  }

  function readPreference() {
    try { return localStorage.getItem(PREF_KEY) || memoryPreference; } catch { return memoryPreference; }
  }

  function writePreference(value) {
    memoryPreference = value || '';
    try {
      if (value) localStorage.setItem(PREF_KEY, value);
      else localStorage.removeItem(PREF_KEY);
    } catch (_) {}
  }

  function puterSignedIn() {
    try { return Boolean(window.puter?.auth?.isSignedIn?.()); } catch { return false; }
  }

  function isPuterPreferred() {
    return readPreference() === 'puter' && puterSignedIn();
  }

  function chosenProvider() {
    const preference = readPreference();
    if (preference === 'puter' && puterSignedIn()) return 'puter';
    if (preference === 'server') return 'server';
    return '';
  }

  async function accountUser() {
    try { return await window.puter.auth.getUser(); } catch (_) { return null; }
  }

  async function usageText() {
    try {
      const usage = await window.puter.auth.getMonthlyUsage();
      const info = usage?.allowanceInfo;
      if (!info || !info.monthUsageAllowance) return '';
      const percent = Math.max(0, Math.min(100, Math.round((info.remaining / info.monthUsageAllowance) * 100)));
      return ` · kalan kota: %${percent}`;
    } catch (_) {
      return '';
    }
  }

  async function refreshAccountPanel(message = '') {
    const status = document.querySelector('#accountStatus');
    const signIn = document.querySelector('#accountSignIn');
    const guest = document.querySelector('#accountGuest');
    const server = document.querySelector('#accountServer');
    const signOut = document.querySelector('#accountSignOut');
    if (!status) return;
    if (!window.puter?.auth) {
      status.textContent = message || 'Puter yükleniyor…';
      return;
    }
    if (puterSignedIn()) {
      if (!readPreference()) writePreference('puter');
      const user = await accountUser();
      const remaining = await usageText();
      status.innerHTML = `<span class="ok">Giriş yapıldı:</span> ${escapeHtml(user?.username || 'Puter hesabı')}${user?.is_temp ? ' (misafir)' : ''}${escapeHtml(remaining)}`;
      if (signIn) signIn.hidden = true;
      if (guest) guest.hidden = true;
      if (server) server.hidden = false;
      if (signOut) signOut.hidden = false;
    } else {
      status.textContent = message || 'Henüz giriş yapılmadı. Giriş yapmadan misafir olarak da devam edebilirsiniz.';
      if (signIn) signIn.hidden = false;
      if (guest) guest.hidden = false;
      if (server) server.hidden = false;
      if (signOut) signOut.hidden = true;
    }
  }

  function closeAccountDialog() {
    document.querySelector('#aiAccount')?.close();
  }

  async function openAccountDialog() {
    const dialog = document.querySelector('#aiAccount');
    if (!dialog) return false;
    const status = document.querySelector('#accountStatus');
    if (status) status.textContent = 'Puter hazırlanıyor…';
    dialog.showModal();
    try { await loadPuter(); } catch (_) {}
    await refreshAccountPanel();
    return true;
  }

  function updateAccountButton(label) {
    if (accountButton) accountButton.textContent = label;
  }

  function mountAccountButton() {
    if (accountButton) return;
    const target = document.querySelector('.bar');
    if (!target) return;
    accountButton = document.createElement('button');
    accountButton.type = 'button';
    accountButton.id = 'accountBtn';
    accountButton.className = 'btn secondary';
    accountButton.style.marginLeft = '8px';
    accountButton.textContent = readPreference() === 'puter' ? 'Hesap' : 'Giriş';
    accountButton.addEventListener('click', () => { openAccountDialog(); });
    target.appendChild(accountButton);
  }

  async function signInAndContinue(guest) {
    const status = document.querySelector('#accountStatus');
    if (status) status.textContent = guest ? 'Misafir hesap hazırlanıyor…' : 'Puter giriş penceresi açılıyor…';
    try {
      // Puter sayfa açılışında önceden yüklenmiştir; signIn'i anında çağırmak popup engelenmesini önler.
      if (!window.puter?.auth?.signIn) {
        throw new Error('Puter henüz yüklenmedi. Lütfen bir saniye bekleyip tekrar deneyin.');
      }
      const result = guest
        ? await window.puter.auth.signIn({ attempt_temp_user_creation: true })
        : await window.puter.auth.signIn();
      writePreference('puter');
      updateAccountButton('Hesap');
      await refreshAccountPanel(`Giriş tamamlandı: ${result?.user?.username || 'Puter hesabı'}`);
      closeAccountDialog();
      const question = pendingQuestion;
      pendingQuestion = null;
      if (question) runAnswer(question, 'puter');
    } catch (error) {
      const reason = error?.error === 'popup_blocked'
        ? 'Tarayıcı giriş penceresini engelledi. Lütfen “Puter ile giriş yap” düğmesine tekrar basın.'
        : (error?.msg || error?.message || String(error));
      if (status) status.textContent = `Giriş tamamlanmadı: ${reason}`;
    }
  }

  function useServerQuota() {
    writePreference('server');
    updateAccountButton('Giriş');
    const question = pendingQuestion;
    pendingQuestion = null;
    closeAccountDialog();
    if (question) runAnswer(question, 'server');
  }

  function signOutPuter() {
    try { window.puter?.auth?.signOut?.(); } catch (_) {}
    writePreference('');
    updateAccountButton('Giriş');
    refreshAccountPanel('Çıkış yapıldı. Yeniden giriş yapabilir veya misafir olarak devam edebilirsiniz.');
  }

  async function requestServerAnswer(question, context, mode) {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question,
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
    return data;
  }

  window.TTEKLiveAI = {
    askIdeas: askPuterIdeas,
    getProvider: chosenProvider,
    isPuterPreferred,
    openAccount: openAccountDialog,
  };

  function renderAnswer(node, answer, mode, provider, sources = [], durationMs = 0) {
    const seconds = durationMs ? `${(durationMs / 1000).toFixed(1)} sn` : '';
    const trace = `<div class="research-trace"><b>Araştırma:</b> ${sources.length} resmî kaynak · ${mode === 'book' ? 'yalnız el kitabı' : 'el kitabı + resmî siteler'}${seconds ? ` · yanıt ${seconds}` : ''}</div>`;
    node.innerHTML = `${trace}<div class="research-answer"><p>${markdown(answer)}</p></div>${sourceList(sources)}<div class="notice"><strong>${escapeHtml(provider)} yanıtı</strong><br>Yanıt rehber bağlamı${mode === 'book' ? '' : ' ve ilgili güncel resmî kamu kaynakları'} kullanılarak oluşturuldu. Resmî metin ve kurumun yetkili kararı önceliklidir.</div><button class="btn secondary ideas-open" type="button" data-ideas="1">💡 Yaratıcı öneriler</button>`;
  }

  async function liveAnswer(question) {
    const q = String(question || '').trim();
    if (!q) return;
    window.TTEKRehber?.setLastQuestion?.(q);

    const provider = chosenProvider();
    if (!provider && readPreference() === 'puter') {
      try { await loadPuter(); } catch (_) {}
    }
    const resolved = provider || chosenProvider();
    if (!resolved) {
      pendingQuestion = q;
      const opened = await openAccountDialog();
      if (opened) {
        const status = document.querySelector('#accountStatus');
        if (status) status.textContent = 'Sorunuz hazır. Devam etmek için bir giriş yöntemi seçin.';
        return;
      }
    }
    await runAnswer(q, resolved || 'server');
  }

  async function runAnswer(q, provider) {
    const started = performance.now();
    const userMessage = addMessage(escapeHtml(q), 'user');
    const loading = addMessage('<strong>Araştırma başladı…</strong><br><small class="research-timer">El kitabı hazırlanıyor · 0 sn</small>');
    const mode = document.querySelector('input[name="mode"]:checked')?.value || 'hybrid';
    let context = '';
    let puterTried = false;
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
        if (small) small.textContent = provider === 'puter' ? 'Kendi kotanızla yanıt yazılıyor…' : 'Yanıt yazılıyor…';
      }

      if (provider === 'puter') {
        puterTried = true;
        try {
          const answer = await askPuter(q, context);
          renderAnswer(loading, answer, mode, 'Puter · kendi kotanız', [], performance.now() - started);
          history.push({ role: 'user', content: q }, { role: 'assistant', content: answer });
          return;
        } catch (error) {
          if (loading?.isConnected) {
            loading.innerHTML = '<strong>Kendi kota yanıtı alınamadı.</strong><br><small class="research-timer">Site kotasıyla yeniden deneniyor…</small>';
          }
        }
      }

      const data = await requestServerAnswer(q, context, mode);
      const providerLabel = data.provider === 'gemini' ? 'Gemini · site kotası' : 'canlı model · site kotası';
      renderAnswer(loading, data.answer, mode, providerLabel, data.sources, performance.now() - started);
      history.push({ role: 'user', content: q }, { role: 'assistant', content: data.answer });
    } catch (error) {
      try {
        if (!puterTried && puterSignedIn()) {
          loading.innerHTML = error.quota
            ? '<strong>Site kotası doldu.</strong><br><small class="research-timer">Kendi Puter kotanızla yeniden deneniyor…</small>'
            : '<strong>Site modeline ulaşılamadı.</strong><br><small class="research-timer">Puter hesabınızla yeniden deneniyor…</small>';
          const answer = await askPuter(q, context || await collectContext(q, mode));
          renderAnswer(loading, answer, mode, 'Puter · kendi kotanız', [], performance.now() - started);
          history.push({ role: 'user', content: q }, { role: 'assistant', content: answer });
          return;
        }
        if (localAnswer) {
          userMessage?.remove();
          loading?.remove();
          try { await localAnswer(q); } catch (_) {}
          return;
        }
        loading.innerHTML = `<strong>Yapay zekâ şu anda kullanılamıyor.</strong><br>${escapeHtml(error.message || error)}<div class="notice">Lütfen kısa süre sonra yeniden deneyin.</div>`;
      } catch (fallbackError) {
        if (localAnswer) {
          userMessage?.remove();
          loading?.remove();
          try { await localAnswer(q); } catch (_) {}
        } else {
          loading.innerHTML = `<strong>Yapay zekâ şu anda kullanılamıyor.</strong><br>${escapeHtml(fallbackError.message || fallbackError)}<div class="notice">Lütfen kısa süre sonra yeniden deneyin.</div>`;
        }
      }
    } finally {
      clearInterval(timer);
    }
  }

  function restorePendingQuestion() {
    if (!pendingQuestion) return;
    const input = document.querySelector('#question');
    if (input) input.value = pendingQuestion;
    pendingQuestion = null;
  }

  function bindAccountUI() {
    document.querySelector('#accountSignIn')?.addEventListener('click', () => signInAndContinue(false));
    document.querySelector('#accountGuest')?.addEventListener('click', () => signInAndContinue(true));
    document.querySelector('#accountServer')?.addEventListener('click', useServerQuota);
    document.querySelector('#accountSignOut')?.addEventListener('click', signOutPuter);
    document.querySelector('#closeAccount')?.addEventListener('click', () => { closeAccountDialog(); });
    document.querySelector('#aiAccount')?.addEventListener('close', restorePendingQuestion);
    mountAccountButton();
  }

  bindAccountUI();
  try { preloadPuter(); } catch (_) {}

  window.TTEKRehber?.setAnswerHandler(liveAnswer);

  const header = document.querySelector('#ai .dlghead > div');
  if (header) header.innerHTML = '<b>Hızlı Çalışma Rehberi + Öneri Atölyesi</b><br><small>Kendi Puter kotanız veya site kotası · API anahtarı gerekmez</small>';
})();
