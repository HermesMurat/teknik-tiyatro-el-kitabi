# Yapay zekâ ve kişisel veriler (KVKK notu)

Bu not, yapay zekâ özelliği kullanılırken hangi verinin nereye gittiğini açıklar. Yayına alınmadan önce kurumunuzun KVKK aydınlatma metni ve saklama politikasıyla birlikte gözden geçirilmelidir.

## İşlenen veriler

- Kullanıcının yazdığı soru metni.
- Yanıt için seçilen el kitabı pasajları ve resmî kaynak bağlantıları.
- Teknik zorunluluk olarak IP adresinden türetilen ve geri döndürülemeyen bir hız sınırı anahtarı (yalnız kötüye kullanımı önlemek için).
- Tarayıcıda saklanan sağlayıcı tercihi (`tte-ai-provider`: `puter` veya `server`).

Ad, e-posta, telefon gibi kimlik bilgileri istenmez. Kullanıcı soru metnine kişisel veri yazmamalıdır.

## Verinin gittiği yerler

| Yol | Alıcı | Amaç |
|---|---|---|
| Puter ile giriş / misafir | Puter | Kimlik doğrulama ve kullanıcının kendi kotasıyla model çağrısı |
| Site kotası (yedek) | Netlify üzerindeki sunucu fonksiyonu → Google Gemini | Yanıt üretimi |
| Resmî kaynak araması | Jina okuyucu servisi ve ilgili resmî site | Kaynak metni getirme |

## Saklama

- Tarayıcı tercihi, kullanıcı tarayıcı verilerini silene kadar saklanır.
- Sunucu tarafında soru metni kalıcı olarak saklanmaz; hız sınırı sayaçları geçicidir.
- Üçüncü taraf sağlayıcıların kendi saklama politikaları geçerlidir.

## Kullanıcı hakları ve sınırlar

- Kullanıcı, tarayıcı verilerini silerek tercihini ve oturum bilgisini kaldırabilir.
- “Çıkış yap” düğmesi Puter oturumunu kapatır.
- Yapay zekâ yanıtı hukuki mütalaa veya kurum kararı değildir; kişisel veri içeren sorular sorulmamalıdır.

## Yayın öncesi yapılacaklar

1. Kurumun KVKK aydınlatma metnini bu sayfaya bağlayın.
2. Veri işleyen sözleşmelerini (Puter, Netlify, Google, Jina) kontrol edin.
3. Saklama süresi ve silme yöntemini yazılı hâle getirin.
4. Yurt dışına veri aktarımı varsa gerekli hukuki dayanağı belirtin.
