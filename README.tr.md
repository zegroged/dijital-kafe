# Dijital Kafe

> Kafeler ve restoranlar için çok kiracılı QR menü ve dijital adisyon (hafif POS) SaaS'ı; her kiracı kendi alt alan adını alır.

**Canlı:** [dijitalkafe.com](https://dijitalkafe.com) · English README: [README.md](README.md)

![Next.js 15](https://img.shields.io/badge/Next.js-15-000000)
![React 19](https://img.shields.io/badge/React-19-149ECA)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-336791)
![Prisma 7](https://img.shields.io/badge/Prisma-7-2D3748)
![Redis 7](https://img.shields.io/badge/Redis-7-DC382D)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)
![Lisans: AGPL v3](https://img.shields.io/badge/Lisans-AGPL%20v3-blue)

---

**Nasıl yazıldı:** kod yapay zekâ yardımıyla yazıldı ve yazar tarafından gözden geçirildi.

## Genel bakış

Türkiye'de küçük kafeler ve restoranlar pandemide QR menüye geçti ve çoğu, bir QR kodun arkasında duran bir PDF'le kaldı — fiyatı düzenlemenin yolu yok, marka yok, istatistik yok. Daha fazlasını yapan araçlar ise zincirlere göre fiyatlanmıştı. Dijital Kafe pazarın öteki ucu için yazıldı: sahibi kaydolur, bir kurulum sihirbazından geçer ve dakikalar içinde `kendi-adi.dijitalkafe.com` adresinden sunulan, temalı ve mobil öncelikli bir menüye artı yazdırılabilir bir QR koda sahip olur.

Ürün menünün ötesine geçti. Aynı tablolar zaten mekânı, personelini ve fiyatlarını modellediği için bir **dijital adisyon** sistemi de taşıyor — garsonlar masa başına adisyon açar, ürün ekler ve nakit ya da kartla kapatır. Çekirdek ürünün etrafında bir Türk SaaS'ının işleyebilmesi için gerçekten ihtiyaç duyduğu makine var: iyzico ödeme entegrasyonu, tek seferlik ve tekrarlayan komisyon modelleriyle bir referans/komisyonculuk programı, **stopaj** ve **gider pusulası** mutabakatıyla mali müşavire dönük bir para çekme hattı, ve sahiplerin üçüncü bir üreticiden fiziksel lazer kazımalı QR standı sipariş ettiği küçük bir mağaza.

Ortaya **yedi ayrı rolü** olan bir platform çıktı — restoran sahibi, platform yöneticisi, QR üreticisi, komisyoncu, komisyoncu yöneticisi, mali müşavir ve personel — her birinin kendi portalıyla. Somut olarak: **23 Prisma modeli**, **26 sayfa**, **63 API yolu**, **22 migration**, **65 React bileşeni** ve kabaca **21.000 satır elle yazılmış TypeScript/TSX**. Bu satır sayısı `src/generated/` altındaki üretilmiş Prisma istemcisini içermiyor; o da ayrıca ~46.000 satır.

## Teknoloji

| Katman | Tercih |
|---|---|
| Çatı | Next.js 15 (App Router, Server Components, `force-dynamic` genel menü) |
| Dil | TypeScript 5, React 19 |
| Stil | Tailwind CSS v4, Base UI üzerinde shadcn/ui, `next-themes` |
| Veritabanı | PostgreSQL 16 + Prisma 7 (driver adapter `@prisma/adapter-pg`) |
| Önbellek / limit | Redis 7 (ioredis) — hız sınırlama, jetonlar |
| Kimlik | Auth.js v5 (Credentials + JWT), bcryptjs |
| Doğrulama | Zod 4 — istek gövdeleri, ortam değişkenleri ve tema JSON şeması |
| Ödeme | iyzico CheckoutForm (authV2 HMAC imzalama, elle yazıldı — SDK yok); canlı yol doğrulanmadı |
| Görseller | sharp (WebP hattı), yerel disk yedeğiyle BunnyCDN depolama |
| 3D / AR | `@google/model-viewer` (GLB + USDZ), modal içinde geç yüklenir |
| E-posta | SMTP üzerinden Nodemailer (doğrulama ve parola sıfırlama postaları) |
| Altyapı | Çok aşamalı Docker build, Docker Compose, Cloudflare arkasında nginx ters vekil |

## Özellikler

**Restoran sahibi** — kurulum sihirbazı (şablon → ilk ürün → yayınla), kategoriler ve ürünler için sürükle-bırak menü düzenleyici (`@dnd-kit`), kategori bazlı tema geçersiz kılma, PNG veya SVG olarak QR indirme, masa yönetimi, personel hesapları, abonelik ve fatura paneli, fiziksel QR mağazası.

**Genel menü** (girişsiz) — alt alan adı yönlendirmesiyle `<slug>.dijitalkafe.com` adresinden sunulur; kategori gezinme, ürün detayı, isteğe bağlı 3D/AR görüntüleyici ve kiracının denemesi veya aboneliği bittiğinde "kapalı" durumu.

**Personel** — kendine ait `/adisyon` ekranı: masa başına adisyon aç, satır ekle ve çıkar, nakit ya da kartla kapat. Sahip ve personel, restoranı her iki rolden de çözen tek bir koruma üzerinden aynı uçları paylaşır.

**Komisyoncu** — referans kodu, kullanılabilir / kilitli / çekilmiş olarak ayrılmış canlı bakiye, IBAN ve vergi bilgileri, vergi belgesi yükleme, para çekme talepleri ve bekleyen bir talebi kendi kendine iptal edebilme.

**Komisyoncu yöneticisi** — bilinçli olarak dar tutulmuş bir rol: komisyoncu hesabı açabilir, başka hiçbir şey yapamaz.

**Mali müşavir** — platform genelindeki stopaj oranını belirler, ödenmiş her para çekme işlemine gider pusulası numarası, tarihi ve notu işler ve beyan için ödenmiş tüm çekimlerin CSV çıktısını alır.

**QR üreticisi** — ürün kataloğu yönetimi ve sipariş hattı (`beklemede → ödendi → hazırlanıyor → kargolandı → teslim edildi`), sipariş başına hesaplanan platform payı ve satıcı ödemesiyle.

**Platform yöneticisi** — satıcı, komisyoncu, komisyoncu yöneticisi ve mali müşavir hesapları açar; para çekme taleplerini onaylar, reddeder, öder ya da geri alır; tekrarlayan komisyonu durdurmak için referansı iptal eder; çekim verisini dışa aktarır.

**Tema motoru** — her biri bir mekân türünden esinlenmiş (kahve barı, fine dining, ızgara, pizzacı vb.) **150 adlandırılmış hazır tema**, seçicide üç stil grubuna ayrılmış — *Beyaz* / *Premium* / *Şık* — artı renk, yazı tipi, kart köşe/gölge/kenarlık, buton biçimi, arka plan (düz / gradyan / görsel) ve dekoratif vurgular için bir özelleştirici.

**Yapay zekâ ile fotoğraf iyileştirme** — yükle → iyileştir → karşılaştır → onayla/geri al akışı uçtan uca kurulu ve orijinal fotoğraf saklanıyor, böylece sahip geri alabiliyor. Amaçlanan arka uç, sabit bir istem altında Google'ın Gemini görsel modeliydi; ancak o sağlayıcıya hiç anahtar tanımlanmadı ve doğrulanmadı — bkz. [Bilinen sınırlamalar](#bilinen-sınırlamalar). Yayınlanan varsayılanda iyileştirme düğmesi gizlidir; `NANOBANANA_PROVIDER=mock` altında iyileştirme yerel bir sharp renk geçişidir.

## Mimari / tasarım notları

Açıklanmaya değer kararlar şunlar.

**Middleware'de sıfır veritabanı işiyle alt alan adı yönlendirme.**
`src/middleware.ts` API dışındaki her istekte çalışır. `Host` başlığı üzerinde saf metin işi yapar — portu at, kök alan adıyla karşılaştır, tek etiketli alt alan adını al, `/menu/<slug>` adresine yönlendir. Orada bilinçli olarak **kiracı sorgusu yoktur**: middleware edge çalışma zamanında koşar ve her istekte bir Prisma gidiş-dönüşü her sayfaya gecikme ekler, üstelik sıcak yolu veritabanı erişilebilirliğine bağlar. Kiracı çözümü bir katman altta, önbelleklenebildiği Node çalışma zamanındaki sayfada yapılır.

**Menüyü önbellekle, ödeme duvarını asla.**
`/menu/[slug]`, pahalı birleştirmeyi (restoran → menü → kategoriler → ürünler → tema) `menu:<slug>` etiketiyle `unstable_cache` içine sarar. Menü içeriğini değiştiren her mutasyon `revalidatePublicMenu(slug)` çağırır. Abonelik/deneme kapısı ise her istekte önbelleğin **dışında** değerlendirilir, böylece biten bir deneme bir sonraki önbellek tazelemesinde değil anında etki eder. Bu ayrımı yanlış yapmak, müşteri ödemeyi kestikten sonra QR menülerin görünmeye devam etmesinin sebebidir.

**Her dış bağımlılık için sağlayıcı dikişi.**
`src/lib/services/` dört entegrasyon tutar — `arcode` (3D tarama), `nanobanana` (Gemini görsel iyileştirme), `payment` (iyzico), `payout` (komisyoncu ödemeleri). Her biri aynı biçimdedir: bir `provider.ts` arayüzü, alanın sahibi olduğu `types.ts` ve `index.ts` içinde tek bir ortam değişkeniyle seçilen değiştirilebilir uygulamalar. Üçü `stub` / `mock` / `live` sunar; `payout` ise `manual` / `mock` / `papara` sunar, çünkü ödemelerde hiçbir şey yapmayan varsayılan, atıl bir stub değil, banka havalesini yapan bir insandır. Uygulama kodu yalnızca `getPaymentProvider()` çağırır ve hiçbir zaman bir iyzico alan adı görmez.

Bundan üç şey çıkar. Geliştirme `mock` ile koşar ve hiçbir API anahtarı istemez — görsel mock'u gerçek bir sharp tabanlı renk iyileştirmesi yapar, dolayısıyla yükle → iyileştir → onayla akışının tamamı çevrimdışı denenebilir. `live` (ya da `papara`) olarak yapılandırılmış ama kimlik bilgileri eksik bir sağlayıcı, açılışta çökmek yerine **uyarı basar ve güvenli varsayılanına düşer**. Ve her entegrasyon bağımsız anahtarlandığı için yarım kalanlar ürünün geri kalanını engellemeden ağaçta durabildi — 3D/AR, canlı ödeme ve Gemini iyileştiricisinin başına tam olarak bu geldi.

**Sert başarısızlığın yumuşağından kötü olduğu yerlerde geri düşme zincirleri.**
`POST /api/dishes/enhance` yapılandırılmış Gemini sağlayıcısını dener ve herhangi bir hatada (kota, faturalama, yanıt biçiminin değişmesi) hata döndürmek yerine yerel sharp iyileştirmesine düşer. Kullanıcı her zaman bir sonuç alır ve Gemini sağlayıcısı bir gün yapılandırılırsa daha iyi sonuç kendiliğinden gelir. Pratikte çalışmış tek yol sharp yoludur.

**Bakiyeler türetilir, saklanmaz.**
Bir `Balance` tablosu yoktur. `getAffiliateBalance()`, `Commission` satırlarını duruma göre gruplayarak kullanılabilir / kilitli / çekilmiş değerlerini hesaplar. Bir para çekme talebi, komisyonlarını bir işlem içinde atomik olarak `earned → requested` durumuna çevirir, böylece para yalnızca tek bir kovada olabilir. Bu, sayfa başına bir `GROUP BY` karşılığında çift-kayıt kaymasını ortadan kaldırır; bir ödeme sistemi için bu takasın doğru tarafıdır.

**Vergi değerleri talep anında dondurulur.**
Stopaj oranı DB ayarı → ortam değişkeni → sabit sırasıyla çözülür; ama bir çekim talebi oluşturulduğu anda oran, brüt, stopaj, net, IBAN ve vergi belgesi bağlantısı satıra sabitlenir. Mali müşavirin sonradan yapacağı oran değişiklikleri, onaylanmış bir talebin geçmişini yeniden yazamaz.

**Para ya da kota harcayan her şeyde idempotentlik ve TOCTOU koruması.**
`fulfillPackage()` aynı ödeme için iki kez çağrılsa da ikinci bir komisyon yazmaz (tek seferlik referanslar mevcut satırı kontrol eder, tekrarlayanlar `paymentRef` üzerinden tekilleştirir). Bir 3D modeli hazır işaretlemek `updateMany({ where: { modelStatus: { not: ready } } })` kullanır ve kotayı yalnız `count === 1` iken düşürür, böylece yarışan iki yoklayıcı kiracıyı iki kez faturalandıramaz. Adisyon kapatma da `status: "open"` karşısında aynı deseni kullanır ve kaybedene 409 döner.

**Veritabanı RLS yerine merkezî yetkilendirme.**
`src/lib/auth/guard.ts` rol başına bir `require*Context()` fonksiyonu sunar ve her biri kapsamı çözülmüş bir nesne döndürür (`requireOwnerContext()` yalnız bir kullanıcı kimliği değil, çağıranın restoranını ve menüsünü döndürür); böylece bir işleyici, korumanın etrafından bilerek dolanmadan kendi kiracısının dışını okuyamaz. `apiHandler()` her yolu sarar ve `HttpError`'ı bir JSON durumuna eşler, işleyicileri try/catch'ten kurtarır. Hassas uçlardan on ikisi — kayıt, giriş, parola sıfırlama, yükleme, yapay zekâ iyileştirme, para çekme, sohbet — bunun üstüne Redis sabit pencereli hız sınırı ekler.

**Tema JSON'u güvenilmez girdi sayılır — iki kez.**
Kiracı tema ayarları, genel bir sayfada CSS'e gömülür; bu bir enjeksiyon ve SSRF yüzeyidir. Zod şeması renkleri `#rrggbb` ile, yazı tipi adlarını `[A-Za-z0-9 ]{1,40}` ile, arka plan görsellerini BunnyCDN veya `/uploads` beyaz listesiyle, gradyanları da `linear|radial-gradient` karakter beyaz listesiyle sınırlar. Sonra `theme/css.ts` render anında tırnakları, parantezleri ve noktalı virgülleri **bir kez daha** siler — yazma kapısının bir gün aşılabileceği varsayımıyla, derinlemesine savunma.

**İstemci IP'si savunmacı okunur.**
`clientIp()` önce `X-Real-IP` başlığını tercih eder (nginx bunu gerçek `$remote_addr` değerinden yazar) ve `X-Forwarded-For` başlığına düştüğünde **en sağdaki** girdiyi alır — soldaki uç saldırganın denetimindedir ve onu kullanmak, başlık taklit ederek her hız sınırının aşılmasına izin verirdi.

**Sırlar ve iş kuralları ortamda yaşar.**
`src/lib/env.ts` açılışta tüm ortamı Zod'dan geçirir ve bozuk yapılandırmada gürültüyle başarısız olur; ayrıca bir `integrations` nesnesi dışa verir, böylece arayüz tahmin etmek yerine "Bunny yapılandırılmış mı?" diye sorabilir. Komisyon oranları ve platform payı ticari olarak hassastır ve tanımlanmadığında `0` varsayılır, dolayısıyla depo gerçek rakamları hiç taşımaz. Yasal sayfalar şirket kimliğini ortamdan okur ve eksikse `companyConfigured() === false` ile `[PLACEHOLDER]` basar; bu, yasal olarak eksik bir sayfanın kazayla yayımlanmasını engeller.

**Üretim imajı.**
Dört aşamalı Dockerfile (`deps` → `builder` → `migrator` → `runner`), root olmayan bir kullanıcıyla çalışan bir Next.js standalone çıktısı üretir. Compose, `web` servisini `migrate: service_completed_successfully` ve `db: service_healthy` koşullarının arkasına alır, böylece migration'lar uygulamadan önce iner. `next build` sırasında ortam şemasını karşılamak için derleme zamanı yer tutucuları kullanılır; gerçek sırlar çalışma anında `env_file` ile gelir.

## Başlarken

Node 22+, Docker ve npm gerekir.

```bash
git clone <depo-url> kafe && cd kafe

# 1) Altyapı (PostgreSQL 16 + Redis 7)
docker compose up -d

# 2) Ortam
cp .env.example .env
npx auth secret          # AUTH_SECRET yazar

# 3) Bağımlılıklar ve şema
npm install
npx prisma migrate dev   # prisma generate'i de çalıştırır

# 4) Çalıştır
npm run dev              # http://localhost:3000
```

Çok kiracılılık yerelde de çalışır: `NEXT_PUBLIC_ROOT_DOMAIN=localhost` iken `kahvecim` slug'lı bir kiracıya `http://kahvecim.localhost:3000` adresinden erişilir.

Her entegrasyon isteğe bağlıdır. `.env.example` içindeki varsayılanlarla uygulama; ödemeler, 3D ve yapay zekâ kapalı, görseller `public/uploads` altına yazılır ve e-posta kapalı olarak açılır. Bir akışı kimlik bilgisi olmadan denemek için ilgili sağlayıcıyı `mock` yap:

```bash
PAYMENT_PROVIDER=mock      # ödeme anında başarılı olur
NANOBANANA_PROVIDER=mock   # gerçek sharp tabanlı iyileştirme, API anahtarı yok
ARCODE_PROVIDER=mock       # görüntüleyicide örnek .glb/.usdz modeller
PAYOUT_PROVIDER=mock       # çekimler kendini ödenmiş işaretler
```

`.env.example` çekirdeği ve eski entegrasyonları kapsar; **asıl kaynak `src/lib/env.ts` dosyasıdır** ve ödeme, ödeme çıkışı ve yapay zekâ değişkenlerini satır içinde belgeler.

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi |
| `npm run db:migrate` | Migration oluştur ve uygula |
| `npm run db:deploy` | Migration uygula (üretim) |
| `npm run db:studio` | Prisma Studio |
| `npm run lint` | ESLint |

Üretim dağıtımı `docker compose -f docker-compose.prod.yml up -d --build` ile yapılır; migrate, web, PostgreSQL, Redis ve nginx ayağa kalkar. nginx, apex ve `*.dijitalkafe.com` için bir Cloudflare origin sertifikasıyla TLS'i sonlandırır ve `/uploads` yolunu doğrudan paylaşılan volume'den sunar, çünkü Next.js standalone çalışma zamanı bunu yapmaz.

## Bilinen sınırlamalar

Açıkça yazılıyor, çünkü gerçekler.

- **3D/AR entegrasyonu bir stub.** Veritabanı alanları, kota muhasebesi, yükleme arayüzü, durum rozetleri, yoklama ve `model-viewer` modalı kurulu ve `ARCODE_PROVIDER=mock` ile çalışıyor; ama `src/lib/services/arcode/live.ts` hâlâ **çözülmemiş üç `TODO(arcode)` bloğu** taşıyor (uç noktalar, yanıt alan eşlemesi, durum sözlüğü). Tedarikçi planı hiç satın alınmadı, dolayısıyla canlı yol gerçek API'ye karşı hiç doğrulanmadı. Varsayılan `stub`; 3D pilot müşterilere hiç tanıtılmadı.
- **iyzico canlı yolu gerçek API'ye karşı hiç doğrulanmadı.** authV2 HMAC imzalama, istek kurma, callback yolu ve çevresindeki bütün akış (karşılama, komisyonlar, sipariş durumu, arayüz) yazıldı; ama `src/lib/services/payment/live.ts` hâlâ istek alan adları ve yanıt yolu üzerinde `TODO(iyzico)` işaretleri taşıyor ve başlığındaki yorum "anahtar geldiğinde" diye bir kontrol listesi. Üye iş yeri bilgileri hiç alınmadı, dolayısıyla `PAYMENT_PROVIDER` hiçbir zaman `stub` varsayılanından çıkmadı. iyzico entegrasyonunu, çalıştığı bilinen bir ödeme yolu değil, **yazılmış ama kanıtlanmamış** bir referans olarak değerlendirin.
- **Tekrarlayan abonelik faturalaması da uygulanmadı.** `/api/cron/renewals` denemeleri sonlandırır ve iptalleri doğru işler, ama yalnızca `PAYMENT_PROVIDER=mock` iken otomatik yeniler. Gerçek yenileme, iyzico saklı kart tekrarlayan çekimlerini gerektirirdi; `live` altında abonelikler dönem sonunda biter ve müşterinin yeniden elle ödemesi gerekirdi.
- **Gemini görsel iyileştiricisine hiç anahtar tanımlanmadı.** `src/lib/services/nanobanana/live.ts` yanıt şeması üzerinde bir `TODO(nanobanana)` ve gerçekten çıktı baytı dönüp dönmediğinin doğrulanması gerektiğine dair açık bir not taşıyor. Varsayılan sağlayıcı `stub`, ki iyileştirme düğmesini tamamen gizler; `mock` ise onun yerine yerel bir sharp renk geçişi çalıştırır. Yani Özellikler bölümünde anlatılan yapay zekâ iyileştirmesi, Gemini olarak değil sharp sürümü olarak yayınlandı.
- **Papara ödeme sağlayıcısı doğrulanmadı.** Uç noktası, başlık adı ve başarı koşulu `TODO(papara)` işaretleri taşıyor. Yayınlanan varsayılan `manual`: yönetici talebi onaylar, parayı banka/CSV ile gönderir, sonra ödendi olarak işaretler.
- **Otomatik test yok.** Depoda sıfır test dosyası. Doğruluk; TypeScript'e, her sınırdaki Zod şemalarına ve elle teste dayanıyor. Saf iş mantığı (`withdrawal/calc.ts`, `subscription/access.ts`, `theme/css.ts`) bilinçli olarak yan etkisiz fonksiyonlar hâlinde yazıldı ve başlamak için doğru yer orası.
- **Sohbet özelliği tek web konteyneri varsayıyor.** İki kişilik özel sohbet (metin ve sesli not, erişim ortam değişkenindeki iki kullanıcı UUID'siyle sınırlı), SSE dağıtımı için `globalThis` üzerinde süreç içi bir `EventEmitter` ve bellek içi bir varlık sayacı kullanıyor. Yayınlandığı tek konteynerli dağıtım için doğru; birden fazla kopya çalıştırmak Redis pub/sub gerektirirdi. Varlık bilgisi yeniden başlatmada sıfırlanır.
- **Yerel görsel depolama da yatay ölçeklenmez.** BunnyCDN yapılandırılmadığında yüklemeler nginx'in sunduğu bir konteyner volume'üne yazılır — tek düğüm için uygun, birkaç düğüm için yanlış.
- **Hız sınırlama sabit pencere**, dolayısıyla pencere sınırında limitin iki katına kadar istek geçebilir. Kayan pencere ya da token bucket doğru düzeltme olurdu.
- **Arayüz yalnızca Türkçe.** Metinler, doğrulama mesajları, yol adları (`/panel`, `/adisyon`, `/komisyoncu`) ve kod yorumları Türkçe; bir i18n katmanı yok. Kodun kendisi İngilizce adlandırılmış.
- **Vergi mantığı ülkeye özgüdür ve uzman incelemesi gerektirir.** Stopaj modeli, gerçek kişilere ödenen komisyona ilişkin Türk kurallarını hedefler; varsayılan oran belgelenmiş bir varsayımdır ve `constants.ts` bunu söyler.

## Durum

**Kapatıldı.** Platform `dijitalkafe.com` üzerinde **2 pilot kafe** ile üretimde çalıştı ve sonra emekliye ayrıldı. Abonelik ücretleri, hiç canlıya geçmemiş olan uygulama içi iyzico ödemesiyle tahsil edilmedi. Ürün, işletmeyi sürdürmeyi haklı çıkaracak bir müşteri tabanına ulaşmadı, dolayısıyla girişim kapatıldı.

Depo bir **referans uygulaması** olarak yayımlanıyor — demo değil; çok rollü bir yetki modeli, mali mutabakat, yazılmış (kanıtlanmamış olsa da) bir ödeme entegrasyonu ve bir Docker dağıtımı olan gerçek bir çok kiracılı SaaS. Canlı site portfolyo eseri olarak açık bırakıldı; yeni kayıt alınmıyor. Kişisel veriler, şirket kimliği ve komisyon oranları yayımdan önce koddan çıkarılıp ortam değişkenlerine taşındı.

## Lisans

AGPL-3.0 — bkz. [LICENSE](LICENSE).

AGPL bilinçli bir tercih. Bu, yayımlanmak için yazılmış bir öğretici örnek değil; iki pilot kafe için üretimde çalışmış çok kiracılı bir SaaS'ın kodu, sonradan okunabilsin diye yayımlandı. Herkes inceleyebilir, değiştirebilir ve çalıştırabilir — ama değiştirilmiş bir sürümü ağ üzerinden servis olarak çalıştırmak, o sürümün kaynağını yayımlamak demektir. Telif yazarda olduğu için ayrı ticari şartlar talep üzerine düzenlenebilir.
