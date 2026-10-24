# Teknik Değerlendirme Raporu

**Depo:** `HermesMurat/teknik-tiyatro-el-kitabi`
**İnceleme tarihi:** 24 Ekim 2026
**Hazırlanış amacı:** Yazılımcı olmayan bir okuyucunun anlayacağı dilde, sitenin güçlü/zayıf yanlarını ve somut çözümleri göstermek.

> Bu rapor yalnızca okuma ve test yoluyla hazırlandı; canlı siteye, ana dala veya yayına hiçbir değişiklik yapılmadı. Tüm bulguların kanıtı son bölümde listelendi.

---

## 1. Kısa özet (beş cümle)

1. Site **gerçekten çalışıyor ve yayında**: 30 bölüm, 121.743 kelime, 1.429 başlık; arama, bölüm okuma ve yapay zekâ yanıtı canlıda test edildi.
2. En güçlü yanı **içerik disiplini**: Türkçeye özel arama, resmî kaynak kartları, "uydurma yok" kuralı ve üç kademeli yedekli yapay zekâ.
3. En zayıf yanı **bakım otomasyonu**: iki test de eski metinleri kontrol ettiği için sürekli kırmızı; buna rağmen değişiklikler birleştirilmiş; yayın robotu ana dala commit atıyor.
4. İkinci büyük sorun **mobil hız**: ana sayfada tek bir arama ~2,5 MB dosya indiriyor; içerik dosyalarının %47'si kopya; sayfada ayrıca 867 bin karakterlik ikinci bir metin kopyası tutuluyor.
5. Üçüncü sorun **güvenlik ve hukuk**: asıl alan adında güvenlik başlıkları yok, yapay zekâ kapısı kötüye kullanıma açık, lisans ve kişisel veri (KVKK) metni yok.

**Tek cümlelik hüküm:** İçerik ve ürün fikri güçlü, mühendislik ve yönetişim tarafı zayıf; 1 haftalık bir bakım paketiyle risklerin büyük kısmı düşürülebilir.

---

## 2. Bu depo aslında ne? (teknik olmayan anlatım)

| Parça | Ne işe yarıyor | Benzetme |
|---|---|---|
| `index.html` | Ana sayfa: 30 bölüm kartı, arama, yapay zekâ penceresi | Kitabın kapağı ve içindekiler sayfası |
| `chapter.html` | Tek bölüm okuyucusu (`chapter.html?id=5`) | Kitabın bir bölümünü açan sayfa |
| `chapters/*.json` | Bölümlerin başlık, paragraf, madde ve tabloları | Kitaplığın raflarındaki dosyalar |
| `content-pack/*` | Bu dosyaların sıkıştırılmış hâli (tek arşiv, 8 parça) | Kitaplığın kilitli kasası |
| `rehber.js` | Türkçe arama, kaynak eşleştirme, yapay zekâ mantığı | Kütüphaneci |
| `live-ai.js` | Yapay zekâ penceresinin görünen yüzü | Danışma masası |
| `netlify/functions/ai.mjs` | Yapay zekâ isteğini tutan sunucu; API anahtarı burada | Danışma masasının arkasındaki güvenli oda |
| `scripts/build-site.sh` | Yayına hazır `public/` klasörünü üretir | Matbaa |
| `.github/workflows/*` | Otomatik kontrol ve yayın | Kalite kontrol ve sevkiyat |

Yayın akışı: `main` dalına her push → GitHub Actions `public/` üretir → GitHub Pages yayınlar. Yapay zekâ için ayrıca Netlify üzerinde küçük bir sunucu fonksiyonu çalışıyor; asıl site GitHub Pages'te.

---

## 3. Güçlü yanlar

### 3.1 İçerik gerçekten dolgun ve tutarlı
- 30 bölüm, **121.743 kelime**, **1.429 başlık** canlıda doğrulandı (`chapters/index.json`).
- 1.375 başlığın tamamında içerik var (ilk 24 bölüm taraması: 0 boş başlık).
- Tablolar korunmuş, alt başlıklar doğrudan bağlantılanabilir (`#section-12`).
- **Neden önemli:** El kitabı olma iddiası taşıyan bir site için en kritik şey budur; burada gerçekten karşılanmış.

### 3.2 Türkçeye özel arama
- `arama.js` küçük/büyük harf, `ı/İ`, `ş/ğ/ü/ö/ç` ve aksan farklarını normalize ediyor; 6 harften uzun kelimelerde kaba gövdeleme yapıyor.
- `dekoratör` → `DEKORATÖR`, `dekorator`, `dekoratörlüğünde` eşleşmeleri testle doğrulandı.
- **Neden önemli:** Türkçede standart arama sık sık "dekoratör" ile "dekorator"u ayırır; bu katman kullanıcı kaybını önler.

### 3.3 Resmî kaynak disiplini
- `rehber.js` içinde 6 resmî alan adı tanımlı; kaynak kartları yalnız bu alanlardan geliyor.
- `docs/KAYNAK_ONCELIGI.md` öncelik sırasını yazılı hâle getirmiş: Resmî Gazete → kurum prosedürü → el kitabı → yorum.
- Yapay zekâya verilen sistem talimatı "madde, tarih, yetki uydurma" diyor (`ai.mjs`, satır 157-174).
- **Neden önemli:** Kurumsal kullanımda en büyük risk yanlış mevzuat aktarımıdır; burada bu risk bilinçli olarak sınırlandırılmış.

### 3.4 Üç kademeli yedekli yapay zekâ
- Sıra: **Netlify + Gemini** → başarısızsa **tarayıcıda Puter/Gemini** → o da olmazsa **yerel kanıt gösterimi** (`live-ai.js`, satır 148-181).
- Sunucu anahtarı tarayıcıya hiç gönderilmiyor; anahtar yalnız Netlify ortam değişkeninde.
- Yerel yedek, model yokken bile bölüm metni + mevzuat kartı + işlem adımlarını gösteriyor (uydurmuyor).
- **Neden önemli:** Ücretsiz kota bittiğinde site "susmuyor"; kullanıcı yine kaynak görüyor.

### 3.5 İyi düşünülmüş güvenlik detayları
- CORS beyaz listesi yalnız kendi alan adları + localhost (`ai.mjs`, satır 8-14).
- İstek gövdesi sınırlı: soru 2.500, bağlam 30.000 karakter; yanıt 45 saniyede kesiliyor.
- Hata mesajları iç ayrıntı sızdırmıyor; `cache-control: no-store`.
- Kaynak bağlantıları yalnız `http/https` ve `noopener noreferrer` ile basılıyor; HTML kaçışlanıyor (XSS'e karşı temel koruma doğru).
- **Neden önemli:** Bu ölçekte bir projede en sık görülen açıklar (anahtar sızması, serbest CORS, ham HTML basma) burada kapatılmış.

### 3.6 Tekrarlanabilir yayın
- `build-site.sh` arşivi SHA-256 ile doğruluyor (`1e543a…`), 30 bölüm ve 30 index kaydını kontrol ediyor, JS sözdizimini denetliyor.
- Yayın başarılı: son `main` çalışması 25 saniyede tamamlandı; canlıda 25-30. bölümler de var.
- **Neden önemli:** "Bende çalışıyordu" durumunu engelleyen tek gerçek güvence budur.

### 3.7 Erişilebilirlik ve tasarım temelleri
- `lang="tr"`, mobil uyumlu düzen, klavye ile açılabilen kart bağlantıları, `:focus-visible` çerçevesi.
- Yalnız sistem yazı tipleri kullanılıyor → dış font yükü yok, hızlı açılış.
- Yazdırma düğmesi ve okuma ilerleme çubuğu gibi saha kullanımına uygun ayrıntılar var.

### 3.8 Dokümantasyon alışkanlığı
- `docs/` altında 13 kısa not: kaynak önceliği, güvenlik, örnek sorular, yayın notu, test durumu.
- **Neden önemli:** Küçük bir projede bile "neden böyle yaptık" kaydı tutulmuş; bu, devralan kişi için altın değerinde.

---

## 4. Zayıf yanlar, riskler ve çözümler

Her başlıkta **belirti → kanıt → çözüm → emek** sırası izlendi. Öncelik: 🔴 kritik, 🟠 yüksek, 🟡 orta.

### A. Bakım, test ve yayın düzeni

#### 🔴 A1. İki otomatik test de gerçekle uyuşmuyor (sürekli kırmızı)
- **Belirti:** Son iki PR'da hem "Bölüm Okuyucu ve Araştırma Testi" hem "Canlı Model Testi" başarısız oldu; PR #11 yine de birleştirildi.
- **Kanıt:**
  - `site-reader-test.yml` satır 72, arayüzde artık bulunmayan `El kitabı + DT kaynakları` metnini arıyor; yerel kontrol `exit 1` verdi.
  - Aynı test 24 bölüm ve 24 bölümlük arşiv hash'ini doğruluyor (satır 28, 38-39, 48); oysa site 30 bölüm yayınlıyor. 25-30. bölümler (52 KB) hiç denenmiyor.
  - `live-ai-test.yml` satır 26-27 `live-ai.js?v=4` arıyor; `build-site.sh` satır 47 ise `v=5` yazıyor. GitHub çalışma kaydında kırılan adım tam olarak bu iki `grep`.
- **Çözüm:** Testleri gerçek çıktıya bağla: sürüm damgasını tek yerden üret (ör. `VERSION` + build), metin aramak yerine davranış testi yap; 30 bölümü doğrula; testleri `push: branches: [main]` üzerinde de çalıştır; `main` için "checks başarısızsa birleştirme kapalı" kuralını aç.
- **Emek:** 2-4 saat. **Etki:** Çok yüksek (şu an otomatik güvence fiilen yok).

#### 🔴 A2. Yayın robotu ana dala commit atıyor
- **Belirti:** `pages.yml` her çalışmada `.pages-status.txt` üretip `git commit` + `git push` yapıyor; 32 commit'in 14'ü "Pages durumunu kaydet [skip ci]".
- **Kanıt:** `pages.yml` satır 24-45; `git log` sayımı.
- **Risk:** Yazma yetkisi gereksiz yere genişliyor; aynı anda iki çalışma çakışabilir; geçmiş okunamaz hâle geliyor; `[skip ci]` bir gün işe yaramazsa döngü riski var.
- **Çözüm:** Bu adımı tamamen kaldır. Durum bilgisi gerekiyorsa Actions özetine (`$GITHUB_STEP_SUMMARY`) yaz veya artifact olarak sakla. `.pages-status.txt` / `.pages-trigger` dosyalarını sil. Yayın işine `contents: read` yeter.
- **Emek:** 30 dakika. **Etki:** Yüksek (temiz geçmiş + daha az yetki).

#### 🟠 A3. Sürüm ve dokümanlar birbirini tutmuyor
- **Kanıt:** `VERSION` = 6.0.0; `docs/SURUM_NOTU.md` = 2.0.0; `CHANGELOG.md` son kayıt 26 Temmuz, 27 Temmuz'daki 30 bölümlük genişleme yok; `docs/AI_REHBER.md` hâlâ "24 bölüm" ve kaldırılmış "El kitabı + DT kaynakları" mod adını yazıyor; README 30 bölüm diyor.
- **Çözüm:** Sürüm numarasını tek dosyadan (`VERSION`) üret ve derlemede sayfaya yaz. Her birleştirmede CHANGELOG'a tek satır zorunluluğu koy. `docs/` içindeki 13 notu tek seferde güncelle; eski notları `docs/arsiv/` altına taşı.
- **Emek:** 1-2 saat. **Etki:** Orta (güven ve devralınabilirlik).

#### 🟠 A4. İçeriğin düzenlenebilir kaynağı depoda yok
- **Belirti:** Bölümler yalnız üretilmiş JSON ve base64 arşiv olarak duruyor. `scripts/build_chapters.py` DOCX bekliyor; `library-source/` ise `.gitignore` ile dışlanmış.
- **Sonuç:** Bir yazım hatasını düzeltmek için Python + `python-docx` + arşiv üretme zinciri gerekiyor. Bu, sizi tek kişiye ve tek bilgisayara bağımlı bırakır.
- **Çözüm:** Bölümleri **Markdown** olarak `content/bolum-05.md` gibi depoya al; küçük bir betik Markdown → JSON üretsin. Word'den Markdown'a dönüşüm tek seferlik yapılır. "Bir cümleyi nasıl düzeltirim" diye 10 satırlık rehber ekle.
- **Emek:** 1-2 gün. **Etki:** Çok yüksek (sürdürülebilirliğin kalbi).

### B. Hız, mobil kullanım ve arama

#### 🟠 B1. Ana sayfada tek arama 2,5 MB indiriyor
- **Belirti:** `index.html` satır 175, aramada **30 bölüm dosyasının tamamını** `Promise.all` ile çekiyor (`searchAllContent`).
- **Kanıt:** `public/chapters` = 2,5 MB; en büyük dosya 159.814 bayt (bölüm 05). Mobil 3G'de bu ~15-25 saniye; kota/veri maliyeti de cabası.
- **Çözüm (en kolay ve kalıcı):** Derleme sırasında **Pagefind** gibi statik arama indeksi üret. Sayfa yalnız arama indeksini ve sonuç parçalarını indirir, sonuçları yerelden gösterir. Alternatif: tek bir sıkıştırılmış arama indeksi (`search-index.json`) üretip bölüm dosyalarını yalnız sonuç açılınca yükle.
- **Emek:** 1-2 gün. **Etki:** Çok yüksek (mobilde algılanan hız birkaç kat artar).

#### 🟠 B2. JSON'un %47'si kopya
- **Belirti:** Her başlıkta `paragraphs`, `bullets`, `tables` alanları **ve ayrıca** aynı içeriği tekrar eden `blocks` alanı var.
- **Kanıt:** Toplam JSON 2,38 MB; `blocks` alanı tek başına 1,13 MB (%47). Alan listesi: `title, level, paragraphs, bullets, tables, blocks`.
- **Çözüm:** `blocks` alanını üretimden kaldır; ekranda gerekliyse `paragraphs/bullets/tables` alanlarından anlık türet. Geçiş için küçük bir dönüştürücü yeter.
- **Emek:** 3-5 saat. **Etki:** Yüksek (indirme ve bellek yarıya iner).

#### 🟠 B3. Sayfa içinde ikinci bir metin kopyası var
- **Belirti:** `chapter.html` satır 170, her başlığın **tüm metnini** `data-search` özniteliğine yazıyor. Aynı metin ekranda bir kez daha basılıyor.
- **Kanıt:** Bu özniteliğe kopyalanan metin **867.359 karakter**; bölüm 05 tek başına ~53 bin karakter.
- **Sonuç:** Büyük DOM, yavaş ilk çizim, düşük bellekte takılma; ekran okuyucular için gürültü.
- **Çözüm:** Normalize metni render sırasında bir `Map`'te tut (`sectionTextMap.set(id, arananMetin)`), `data-*` özniteliğini kaldır.
- **Emek:** 2-3 saat. **Etki:** Yüksek (özellikle 05/06 gibi ağır bölümlerde).

#### 🟡 B4. En ağır bölümler mobilde zorlanıyor
- **Kanıt:** Bölüm 05: 185 başlık, 585 blok; bölüm 06: 94 başlık, 379 blok, 59 bin karakter. Mobilde sol menü (TOC) içeriğin üstüne biniyor.
- **Çözüm:** Alt başlıkları katlanır yap (`<details>`), ilk seviye açık kalsın; mobilde TOC'u açılır panele al; çok uzun bölümlerde bölüm içi sayfalama uygula.
- **Emek:** 4-6 saat. **Etki:** Orta-yüksek.

#### 🟡 B5. Yapay zekâ yolu uzun ve kırılgan
- **Belirti:** İlk soruda 30 bölüm tarayıcıya indiriliyor; ayrıca Jina üzerinden 3 arama geçidi ve 6 kaynak okuması deneniyor. Her arama 16 sn, her kaynak okuma 13 sn zaman aşımına sahip → en kötü durumda 1 dakikayı aşar.
- **Kanıt:** `rehber.js` satır 196-207 (tüm bölümler), 335-357 (3 geçit), 359-375 ve 388-391 (6 kaynak).
- **Ek tutarsızlık 1:** Sunucu tarafında Gemini yolu **hiç web araması yapmıyor** (`ai.mjs` 196-226); "güncel resmî kaynak" yalnız tarayıcıdaki Jina denemesinden geliyor. Jina engellenirse hibrit mod fiilen "el kitabı + kayıtlı 11 kaynak"a düşer.
- **Ek tutarsızlık 2:** Tarayıcı 6 resmî alan adını kabul ediyor (`rehber.js` 5-12), sunucu yalnız 2'sini (`ai.mjs` 5). Bu yüzden Resmî Gazete / ihale.gov.tr kaynaklı dayanaklar yanıtın kaynak listesinde kayboluyor.
- **Ek risk:** OpenAI yedeği varsayılan olarak `gpt-5.6-terra` modelini istiyor (`ai.mjs` 230). Bu ad geçerli değilse, Gemini anahtarı kaldırıldığında yapay zekâ sessizce çalışmaz.
- **Çözüm:** Aramayı **sunucuda** yap: Netlify fonksiyonu küçük bir arama indeksiyle en iyi 5-8 pasajı bulsun, modele yalnız onları göndersin. Tarayıcı yalnız soruyu iletsin. Jina yerine resmî arama API'si kullan; ilerleme göstergesi ve "iptal" düğmesi ekle. Ortak alan adı listesini tek dosyada tanımla; kullanılan model adını ortam değişkeniyle sabitle ve açılışta doğrula.
- **Emek:** 2-4 gün. **Etki:** Yüksek (hız + güvenilirlik + güvenlik).

### C. Güvenlik, gizlilik ve hukuk

#### 🔴 C1. Asıl alan adında güvenlik başlıkları yok
- **Belirti:** Güvenlik başlıkları yalnız `netlify.toml`'da tanımlı; oysa kullanıcıların gördüğü adres GitHub Pages.
- **Kanıt:** `curl -I https://hermesmurat.github.io/...` yanıtında `content-security-policy`, `x-content-type-options`, `referrer-policy` yok; Netlify'da üçü var ama CSP orada da yok. `access-control-allow-origin: *` GitHub'ın varsayılanı.
- **Risk:** Tarayıcı tabanlı saldırı yüzeyi geniş; üçüncü taraf scriptler (Puter, Jina) sınırsız yetkiyle çalışıyor.
- **Çözüm:** Asıl yayını Netlify'a taşı (aynı içerik, başlıklar hazır) veya GitHub Pages önüne Cloudflare koy. CSP'yi nonce/hash ile ekle; `script-src` yalnız kendi alanların + `js.puter.com`; `connect-src` yalnız kendi API + Jina; `frame-ancestors 'none'`.
- **Emek:** 3-5 saat. **Etki:** Yüksek.

#### 🔴 C2. Yapay zekâ kapısı kötüye kullanılabilir
- **Belirti:** CORS bir kimlik doğrulama değildir; `Origin` başlığı elle taklit edilebilir. Hız sınırı bellekte tutuluyor ve sunucu her soğuk başlangıçta sıfırlanıyor; örnek sayısı arttıkça dağılır. Günlük kota/bütçe sınırı yok.
- **Kanıt:** `ai.mjs` satır 6 (`new Map()`), 46-56 (10 dakikada 12 istek), 124-128 (yalnız Origin kontrolü). `Origin: https://hermesmurat.github.io` gönderen herhangi bir betik ücretsiz kotayı tüketebilir.
- **Ek risk:** `context` alanı istemciden geliyor; saldırgan kendi uydurduğu "el kitabı kanıtı"nı gönderip modele istediği yanıtı verdirebilir (prompt injection).
- **Çözüm:** (1) Cloudflare Turnstile veya kısa ömürlü imzalı jeton; (2) Netlify/Cloudflare kenarında IP başına sınır; (3) günlük toplam istek ve harcama tavanı + uyarı; (4) bağlamı istemciden almayı bırak, sunucuda üret; (5) gelen bağlamı "güvenilmez veri" olarak işaretle.
- **Emek:** 1-2 gün. **Etki:** Yüksek (fatura ve itibar riski).

#### 🟠 C3. Kişisel veri ve KVKK tarafı eksik
- **Belirti:** Ziyaretçi IP'si özetlenip kimlik anahtarı olarak kullanılıyor; sorular Google, OpenAI, Jina ve Puter'a gidiyor. Sitede aydınlatma metni, saklama süresi veya veri işleyen listesi yok.
- **Kanıt:** `ai.mjs` satır 41-44; `SAFETY_ID_SALT` tanımlı değilse sabit `tte-live-guide` kullanılıyor (zayıf gizlilik). `live-ai.js` üçüncü tarafları çağırıyor.
- **Çözüm:** "Kişisel Verilerin Korunması ve Yapay Zekâ Aydınlatma Metni" sayfası ekle (hangi veri, hangi amaç, hangi sağlayıcı, ne kadar süre). `SAFETY_ID_SALT` için gerçek rastgele değer tanımla. Loglarda soru metni tutma; yalnız sayaç tut.
- **Emek:** 3-4 saat (metin + 1 sayfa). **Etki:** Yüksek (kurumsal kullanımda zorunlu).

#### 🟠 C4. Üçüncü taraf bağımlılıkları denetimsiz
- **Belirti:** `js.puter.com/v2/` doğrudan sayfaya ekleniyor; SRI (bütünlük) kontrolü yok. `s.jina.ai` / `r.jina.ai` resmî arama API'si değil; Google/Bing sonuçlarını kazıyor.
- **Risk:** Tedarikçi değişirse veya hizmet engellenirse sessiz bozulma; kullanım koşulları ihlali; kullanıcı sorusunun üçüncü tarafa gitmesi.
- **Çözüm:** Puter'ı kaldır veya yalnız kullanıcı onayıyla yükle; SRI ekle. Jina'yı resmî arama API'siyle değiştir. En azından arayüzde "üçüncü taraf hizmet kullanılıyor" bilgisini ver.
- **Emek:** 1-2 gün. **Etki:** Orta-yüksek.

#### 🟠 C5. Lisans yok
- **Belirti:** Depoda `LICENSE` / `COPYING` dosyası yok; README "herkese açık" diyor ama yeniden kullanım koşulları belirsiz.
- **Risk:** Başka kurum kopyalayıp değiştirebilir; kaynak gösterimi zorunlu mu, ticari kullanım serbest mi belirsiz. Resmî mevzuat metinlerinin kendi kullanım koşulları ayrıca var.
- **Çözüm:** Kendi metniniz için lisans seç (ör. CC BY-NC-SA 4.0 veya tüm hakları saklı + atıf koşulu). Resmî metinler için "kaynağına aittir, değiştirilmeden ve atıfla kullanılır" notu ekle.
- **Emek:** 1 saat. **Etki:** Orta (hukuki netlik).

### D. Erişilebilirlik, SEO ve paylaşım

#### 🟠 D1. Arama kutuları ve yapay zekâ penceresi ekran okuyucuya kapalı
- **Kanıt:** `index.html` ve `chapter.html`'de `<label>` yalnız mod seçeneklerinde var; arama kutuları, kategori seçici ve bölüm içi arama etiketsiz. `aria-live` 0, `aria-labelledby` 0, "içeriğe geç" bağlantısı 0.
- **Sonuç:** Ekran okuyucu "düzenleme alanı" der, ne arandığını söylemez; yapay zekâ yanıtı geldiğinde duyurulmaz.
- **Çözüm:** Görünmez `<label>`, `aria-label`, `role="status" aria-live="polite"` (yanıt alanı), dialog için `aria-labelledby`, "içeriğe geç" bağlantısı ekle. `axe` ile otomatik test kur.
- **Emek:** 3-4 saat. **Etki:** Yüksek (kamuya açık kurumsal içerikte erişilebilirlik beklentisi).

#### 🟠 D2. Google ve paylaşım önizlemeleri zayıf
- **Belirti:** `robots.txt` ve `sitemap.xml` **404**. Sayfalarda `description`, `canonical`, `og:` / `twitter:` etiketi yok. Bölüm başlığı JS ile değişiyor; JS kapalıysa içerik "Bölüm yükleniyor…" olarak kalıyor (`<noscript>` yok).
- **Kanıt:** `curl` ile 404; `<meta>` taramasında yalnız charset/viewport/theme-color; `noscript` sayısı 0.
- **Sonuç:** Arama motoru ve WhatsApp/X önizlemesi içeriği görmüyor; 30 bölümün organik trafiği kayboluyor.
- **Çözüm:** Derlemede her bölüm için statik HTML (`bolum/05/index.html`) + `sitemap.xml` + `robots.txt` + JSON-LD (`Book`/`Article`) üret. Her sayfaya 150 karakterlik açıklama ve OG görseli ekle. URL'yi `?id=5` yerine `/bolum/5/` yap.
- **Emek:** 1-2 gün. **Etki:** Yüksek (görünürlük).

#### 🟡 D3. Küçük yazı ve yazdırma ayrıntıları
- 11-12 px etiketler, mobilde küçük dokunma hedefleri; `@media print` kuralı yok → yazdırınca menü ve başlık da basılıyor.
- Kontrast: gövde metni iyi (`4.98:1`); altın rengi yalnız kenarlık olarak kullanıldığı için sorun değil. Yine de 14 px altı metinlerde 4.5:1 hedefi korunmalı.
- **Çözüm:** En az 14 px, `@media print` ile menüyü gizle, sayfa numarası/başlık ekle, `prefers-reduced-motion` desteği.
- **Emek:** 2 saat. **Etki:** Orta.

### E. İçerik yönetişimi

#### 🟠 E1. Her bölümde "son gözden geçirme" bilgisi yok
- **Belirti:** Mevzuat listesi 25 Temmuz 2026'da kontrol edilmiş; bölümlerin tek tek güncellik tarihi yok.
- **Çözüm:** Her bölüm JSON'una `reviewedAt` ve `reviewedBy` alanı ekle; sayfada "Son gözden geçirme: …" göster; 3 aylık kontrol takvimi kur.
- **Emek:** 4 saat + üç ayda bir 1 saat. **Etki:** Yüksek (kurumsal güven).

#### 🟡 E2. Kaynak bağlantıları periyodik denenmiyor
- **Kanıt:** 14 kaynak kartı var; `resmigazete.gov.tr` bağlantısı test sırasında 15 saniyede yanıt vermedi (ağ/engel olabilir, ama kontrol edilmeli).
- **Çözüm:** Haftalık bağlantı denetimi (`lychee` vb.); kırık bağlantıda otomatik issue aç.
- **Emek:** 1 saat. **Etki:** Orta.

#### 🟡 E3. Arama kalitesi sınırlı
- Türkçe stopword listesi yalnız yapay zekâ aramasında var; ana arama "nedir" gibi kelimeleri de arıyor. Gövdeleme "son iki harfi at" yöntemiyle yapılıyor; "kontrol" → "kont" gibi yanlış eşleşmeler olabilir.
- **Çözüm:** Türkçe stopword listesi + ek tabanlı gövdeleme (veya Pagefind'in dil desteği). Sıralamada başlık eşleşmesine ağırlık ver.
- **Emek:** 3-4 saat. **Etki:** Orta.

#### 🟡 E4. Tek kişiye bağımlılık ve yedeklilik
- Tek yazar, tek depo, içerik kaynağı depoda değil. Depo 32 commit; 14'ü robot. Katkı rehberi (`CONTRIBUTING.md`), sorun şablonu ve sürüm etiketi yok.
- **Çözüm:** A4'teki Markdown kaynağı + `CONTRIBUTING.md` + yıllık yedek (zip) + en az bir kişiye depo erişimi.
- **Emek:** 1 gün. **Etki:** Yüksek (süreklilik).

---

## 5. Öncelik sırası: ne zaman, ne yapılmalı?

### İlk hafta (toplam ~1 gün emek, en yüksek getiri)
1. **A1** — İki testi gerçek çıktıya uyarla; `main` için zorunlu kontrol aç. *(Şu an otomatik güvence yok.)*
2. **A2** — `pages.yml` içindeki commit/push adımını ve `.pages-status.txt` dosyalarını kaldır.
3. **C1 + C5** — Netlify'ı asıl adres yap veya Cloudflare ekle; `LICENSE` dosyası ekle.
4. **D1** — Etiket, `aria-live`, "içeriğe geç" (3-4 saat).
5. **A3** — Sürüm/CHANGELOG/docs tutarsızlığını kapat.

### İlk ay
6. **B1 + B3** — Pagefind/tek indeks + `data-search` kopyasını kaldır. *(Mobil hızın en büyük kazancı.)*
7. **C2 + C3** — Turnstile, kenar hız sınırı, günlük bütçe, KVKK metni.
8. **D2** — Statik bölüm sayfaları, sitemap, robots, OG etiketleri.
9. **B2** — `blocks` kopyasını kaldır.

### İlk üç ay
10. **A4 + E4** — Markdown içerik kaynağı, katkı rehberi, yedek.
11. **B5** — Sunucu tarafı arama (RAG), Jina yerine resmî API.
12. **E1 + E2** — Bölüm bazlı gözden geçirme tarihi, haftalık bağlantı kontrolü.
13. **B4 + E3** — Katlanır başlıklar, arama kalitesi.

---

## 6. "Bunu ben uygulayabilirim" listesi

Aşağıdakilerin her biri ayrı bir değişiklik olarak, canlıya çıkmadan önce test edilerek yapılabilir:

| # | İş | Dosya(lar) | Süre |
|---|---|---|---|
| 1 | Testleri düzelt + 30 bölüm doğrula | `.github/workflows/site-reader-test.yml`, `live-ai-test.yml` | 2 saat |
| 2 | Yayın robotunun main'e commit'ini kaldır | `.github/workflows/pages.yml`, `.pages-status.txt`, `.pages-trigger` | 30 dk |
| 3 | Sürümü tek kaynaktan üret | `VERSION`, `build-site.sh`, `docs/*` | 1 saat |
| 4 | robots.txt + sitemap.xml + meta/OG | `scripts/build-site.sh`, `index.html`, `chapter.html` | 3 saat |
| 5 | Erişilebilirlik etiketleri + `aria-live` | `index.html`, `chapter.html` | 3 saat |
| 6 | `data-search` kopyasını kaldır | `chapter.html` | 2 saat |
| 7 | `blocks` kopyasını kaldır | `scripts/build_chapters.py`, JSON üretimi | 4 saat |
| 8 | Pagefind arama indeksi | `build-site.sh`, `index.html` | 1 gün |
| 9 | Netlify/CSP + güvenlik başlıkları | `netlify.toml`, yayın ayarı | 3 saat |
| 10 | KVKK aydınlatma + lisans taslağı | yeni `docs/` sayfaları, `LICENSE` | 3 saat |

> Not: 1, 2, 3 ve 6 numaralı işler düşük risklidir, içerik metinlerine dokunmaz. 7 ve 8 içerik hattını değiştirdiği için önce bir kopya dalda denenmelidir.

---

## 7. Bu raporun kanıtları (ne çalıştırıldı?)

| Kontrol | Sonuç |
|---|---|
| Canlı ana sayfa | `200`, 13.566 bayt, 0,18 sn |
| Canlı `chapters/index.json` | 30 bölüm, 121.743 kelime, 1.429 başlık |
| Canlı bölüm 05 | `200`, 159.814 bayt |
| Netlify yapay zekâ | `200`, "test" sorusuna 6,2 sn'de yanıt, `provider=gemini` |
| `node tests/arama-unit.js` | Geçti |
| `node tests/live-ai-function.mjs` | Geçti |
| `bash scripts/build-site.sh` | Geçti, 30 bölüm üretildi |
| `grep 'El kitabı + DT kaynakları' index.html` | Bulunamadı (test bu yüzden kırılıyor) |
| `grep 'live-ai.js?v=4' public/index.html` | Bulunamadı (build `v=5` yazıyor) |
| GitHub çalışma kayıtları | İki PR testi de `failure`: "Web dosyalarını doğrula" ve "Yayın dosyalarını doğrula" |
| `robots.txt` / `sitemap.xml` | `404` / `404` |
| GitHub Pages yanıt başlıkları | CSP, nosniff, referrer-policy yok |
| JSON boyutu | 2,38 MB; `blocks` 1,13 MB (%47) |
| `data-search` kopyası | 867.359 karakter |
| Commit geçmişi | 32 commit; 14'ü "Pages durumunu kaydet" |
| Lisans dosyası | Yok |

---

## 8. Kısa sözlük

- **JSON:** Tarayıcının okuyabildiği, başlık/paragraf/tablo verisini taşıyan düz metin dosyası.
- **CORS:** Tarayıcıya "hangi site bu sunucuya istek atabilir" diyen kural. Kimlik doğrulama değildir.
- **CSP (Content Security Policy):** Sayfada hangi scriptin çalışabileceğini kısıtlayan güvenlik başlığı.
- **Rate limit:** Belirli sürede en fazla kaç istek atılabileceğini sınırlama.
- **RAG:** Modelin yanıt vermeden önce ilgili metin parçalarını bulup kullanması.
- **Statik indeks (Pagefind):** Arama için önceden hazırlanmış küçük dosya; sunucu gerektirmez.
- **DOM:** Tarayıcının sayfayı bellekte tuttuğu yapı; şişerse telefon yavaşlar.
- **SRI:** Dış scriptin değiştirilmediğini doğrulayan parmak izi.

