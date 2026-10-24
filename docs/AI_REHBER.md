# Bağlamlı araştırma rehberi

Rehber, kullanıcının sorusunu yalnız bölüm adlarıyla değil, 30 bölümün paragraf, madde ve tablo metinleriyle eşleştirir. Bir bölüm sayfasından sorulduğunda açık bölüm ve seçilen alt başlık öncelikli bağlam olarak kullanılır.

## Akış

1. **Soru** — kullanıcı soruyu yazar.
2. **Araştırma** — el kitabı ve (hibrit modda) resmî kaynaklar **aynı anda** taranır. Arayüzde geçen süre saniye olarak gösterilir.
3. **Cevap** — şu başlıklarla gelir: Kısa cevap, İlgili kanun maddeleri, Araştırma özeti, Uygulama adımları, Akıllı çözüm önerileri, Yetki ve güvenlik sınırı.

## Hız ayarları

- Bağlam üst sınırı 14.000 karakter (önceden 30.000).
- Geçmiş yalnız son 4 mesaj; mesaj başına 1.500 karakter.
- Sunucu zaman aşımı 22 saniye (önceden 45).
- Yanıt token sınırı 1.500 (fikir modunda 1.100); OpenAI akıl yürütme düzeyi `low`.
- Web araması 2 geçitle ve 6,5 saniye zaman aşımıyla sınırlı; en çok 4 kaynak, 3'ü okunur.
- El kitabı araması ile web araması paralel çalışır.
- Yapay zekâ penceresi açıldığında bölümler arka planda önceden yüklenir (tasarruf modunda ve 2G'de kapalı).

## Yaratıcı Öneri Atölyesi

Yanıtın altındaki **💡 Yaratıcı öneriler** düğmesi ayrı bir pencere açar. Bu pencere, aynı soru ve kanıt paketiyle 5 uygulanabilir fikir üretir:

- Her fikirde "Nasıl uygulanır", "Kazanç", "Risk / ön koşul" bulunur.
- En az biri düşük maliyetli, biri kurum içi işbirliği, biri süreç sadeleştirme odaklıdır.
- Mevzuat maddesi uydurulmaz; dayanak varsa [K]/[M] ile gösterilir.
- Öneriler bağlayıcı değildir; uygulanabilirlik ve mevzuat uygunluğu kurum onayına bağlıdır.

## Kullanıcı kotası (Puter User-Pays)

Varsayılan akışta kullanıcıdan bir yöntem seçmesi istenir:

- **Puter ile giriş:** Kullanıcı kendi Puter hesabıyla girer (Google veya e-posta). Sorular Gemini modeline kullanıcının **kendi aylık ücretsiz kotası** üzerinden gider. API anahtarı gerekmez; siteye maliyet çıkmaz.
- **Misafir olarak devam et:** Puter’in `attempt_temp_user_creation` seçeneğiyle geçici hesap açılır. Kota daha düşüktür; kullanıcı sonradan kayıt olabilir.
- **Site kotasıyla devam et:** Kullanıcı istemezse mevcut sunucu anahtarı kullanılır. Bu yol site kotasını tüketir.

Seçim `tte-ai-provider` anahtarında saklanır. Puter tercihliyken önce Puter denenir; hata olursa site kotasına, o da olmazsa yerel kaynak özetine düşülür. Model `gemini-3.1-flash-lite`, hız için `reasoning_effort: "minimal"` kullanır.

> Puter üçüncü taraf bir hizmettir; sorular Puter altyapısına iletilir. Ayrıntı: `docs/YAPAY_ZEKA_VE_KVKK.md`.

## Modlar

- **Yalnız el kitabı:** İnternete çıkmadan yalnız rehber metinlerini kullanır; en hızlı mod.
- **Rehber + resmî kaynaklar:** El kitabına ek olarak resmî alan adlarında arama yapar.

Sunucudaki canlı dil modeli kanıt paketini değerlendirir. API anahtarı tarayıcıya veya açık depoya gönderilmez. Canlı model kullanılamazsa sistem yorum uydurmaz; yerel kaynak rehberi eşleşen metinleri, mevzuat alanını, işlem adımlarını ve bağlantıları doğrudan gösterir.

Sistem hukuki mütalaa veya yetkili kurum kararı değildir.
