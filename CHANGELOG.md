# Değişiklik günlüğü

## 24 Ekim 2026

- Kullanıcı kotası eklendi: yapay zekâ ilk kullanımda “Puter ile giriş”, “Misafir olarak devam et” veya “Site kotasıyla devam et” seçeneği sunuyor. Puter yolu kullanıcının kendi aylık ücretsiz kotasını kullanır; API anahtarı gerekmez.
- Puter modeli `gemini-3.1-flash-lite` olarak düzeltildi; hız için `reasoning_effort: "minimal"` ayarlandı.
- Puter tercihliyken önce kullanıcı kotası, hata durumunda site kotası, o da olmazsa yerel kaynak özeti devreye giriyor.
- Hesap durumu, kalan kota yüzdesi ve çıkış düğmesi eklendi; tercih tarayıcıda saklanıyor.
- `docs/YAPAY_ZEKA_VE_KVKK.md` ile veri akışı ve KVKK notu eklendi.

- Yapay zekâ yanıtı hızlandırıldı: bağlam 14.000 karaktere, geçmiş son 4 mesaja indirildi; sunucu zaman aşımı 22 saniye, yanıt sınırı 1.500 token (fikir modunda 1.100) oldu.
- El kitabı taraması ile resmî kaynak araması artık paralel çalışıyor; web araması 2 geçit ve 6,5 saniye zaman aşımıyla sınırlandı, en çok 4 kaynak kullanılıyor.
- Yanıt yapısı sadeleştirildi: Kısa cevap, İlgili kanun maddeleri, Araştırma özeti, Uygulama adımları, Akıllı çözüm önerileri, Yetki ve güvenlik sınırı.
- Ayrı **Yaratıcı Öneri Atölyesi** penceresi eklendi; her yanıtın altındaki düğmeyle 5 uygulanabilir fikir üretiliyor.
- Arayüzde geçen süre ve araştırma özeti gösteriliyor; arama kutularına ve yanıt alanlarına erişilebilirlik etiketleri eklendi.
- Sunucu kaynak filtresi tarayıcıyla eşitlendi (6 resmî alan adı); canlı model testi fikir modunu ve bağlam sınırını doğruluyor.

## 26 Temmuz 2026

- 24 özgün bölüm belgesi yeniden işlendi; 1.375 başlık, 121.510 kelime ve bütün tablolar dijital okuyucuya aktarıldı.
- Yalnız adı görünen boş alt başlıklar kaldırıldı; her başlık kendi açıklama, madde ve tablolarıyla birlikte açılır hale getirildi.
- Ana sayfa araması bölüm adlarıyla sınırlı olmaktan çıkarıldı; bütün metinlerde arama ve doğrudan ilgili yazıya gitme eklendi.
- Bölüm içinde arama ve “Tüm yazıları göster” seçenekleri eklendi.
- Yapay zekâ rehberinin tablo içeriklerini de kaynak metin olarak kullanması sağlandı.
- Ana sayfadaki bölüm kartlarının tamamı tıklanabilir hale getirildi.
- Her bölümün ve alt başlığın tam metni okunabilir, doğrudan yapay zekâ rehberine sorulabilir hale getirildi.
- Rehberin yalnız bölüm adı ve alt başlığı taraması kaldırıldı; 24 bölümün gerçek metninde bağlam araması eklendi.
- Önceden tanımlanmış bağlantılarla sınırlı internet katmanı, soruya göre dinamik arama yapan araştırma akışıyla değiştirildi.
- Mevzuat sorularında resmî alan adlarıyla sınırlandırılmış arama, kaynak okuma zamanı ve doğrudan kaynak bağlantıları eklendi.
- Genel bilgi soruları için el kitabı dışı internet araştırması eklendi.
- İnternet bulgularının tarayıcıdaki yerleşik dil modeline kanıt olarak verilmesi sağlandı; model bulunmadığında kaynak metinlerini uydurmadan gösteren güvenli yanıt eklendi.

## 25 Temmuz 2026

- Bölüm öneren basit rehber, mevzuat destekli RAG motoruyla değiştirildi.
- Dokuz resmî mevzuat alanı soru eşleştirmesine eklendi.
- Yanıtlara değerlendirme, mevzuat dayanağı, işlem sırası, yetki yönlendirmesi ve kaynak bağlantıları eklendi.
- Güvenlik açısından kritik sorular için işi veya temsili durdurma uyarısı eklendi.
- Desteklenen tarayıcılarda cihaz içi dil modeliyle yanıt sentezi eklendi.
- Dil modeli bulunmadığında çalışan kaynaklı yerel cevap motoru eklendi.
