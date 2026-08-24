import { KDV_RATE, PLANS, withKdv } from "@/lib/constants";

// ============================================================
// ŞİRKET / SATICI BİLGİLERİ
// İyzico başvurusu + yasal sayfalar için. Köşeli parantezli alanlar GERÇEK
// bilgilerle DOLDURULACAK (tek yer; tüm yasal sayfalar buradan beslenir).
// configured() tüm zorunlu alanlar dolunca true döner.
// ============================================================
export const COMPANY = {
  tradeName: "Dijital Kafe",
  legalName: "[YASAL AD]", // şahıs işletmesi (ticaret ünvanı yok → ad soyad)
  address: "[ADRES], Selçuklu / Konya",
  taxOffice: "Meram",
  taxNumber: "[VKN]", // VKN (TCKN DEĞİL — gizli)
  mersis: "[MERSİS NO]", // şahıs — yok, gizli kalır
  tradeRegistryNo: "[TİCARET SİCİL NO]", // şahıs — yok
  phone: "[TELEFON]",
  email: "info@dijitalkafe.com",
  website: "https://dijitalkafe.com",
};

export function companyConfigured(): boolean {
  return ![
    COMPANY.legalName,
    COMPANY.address,
    COMPANY.taxOffice,
    COMPANY.taxNumber,
    COMPANY.phone,
  ].some((v) => v.startsWith("["));
}

const NET = PLANS.premium.priceMonthly;
const GROSS = withKdv(NET);
const KDV_PCT = Math.round(KDV_RATE * 100);
const TODAY = "[GÜNCELLEME TARİHİ]"; // build-time sabit değil; metinde gösterilir

export interface LegalDoc {
  slug: string;
  title: string;
  html: string;
}

const sellerBlock = `
<p><strong>Satıcı / Hizmet Sağlayıcı:</strong> ${COMPANY.legalName}<br/>
<strong>Adres:</strong> ${COMPANY.address}<br/>
<strong>Vergi Dairesi / No:</strong> ${COMPANY.taxOffice} / ${COMPANY.taxNumber}<br/>
${COMPANY.mersis.startsWith("[") ? "" : `<strong>MERSİS No:</strong> ${COMPANY.mersis}<br/>`}
<strong>Telefon:</strong> ${COMPANY.phone}<br/>
<strong>E-posta:</strong> ${COMPANY.email}<br/>
<strong>Web:</strong> ${COMPANY.website}</p>`;

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "hakkimizda",
    title: "Hakkımızda",
    html: `
<p>${COMPANY.tradeName}, restoran ve kafeler için <strong>dijital QR menü</strong> çözümü sunan bir yazılım hizmetidir. İşletmeler menülerini saniyeler içinde QR kodla dijitale taşır, tasarımını özelleştirir, ürün görsellerini yapay zekâ ile canlandırır ve masalarında adisyon/hesap takibi yapar.</p>
<h2>Ne sunuyoruz?</h2>
<ul>
<li>QR menü + mobil uyumlu dijital menü</li>
<li>Tam tema ve tasarım özelleştirme</li>
<li>AI ile yemek fotoğrafı canlandırma</li>
<li>Masa / adisyon yönetimi</li>
</ul>
<h2>İletişim</h2>
<p>${COMPANY.legalName}<br/>${COMPANY.address}<br/>${COMPANY.email} · ${COMPANY.phone}</p>`,
  },
  {
    slug: "mesafeli-satis-sozlesmesi",
    title: "Mesafeli Satış Sözleşmesi",
    html: `
${sellerBlock}
<h2>1. Taraflar</h2>
<p>İşbu sözleşme, yukarıda bilgileri yer alan SATICI ile, ${COMPANY.website} üzerinden hizmet satın alan ALICI (tüketici) arasında, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca elektronik ortamda kurulmuştur.</p>
<h2>2. Konu</h2>
<p>İşbu sözleşmenin konusu, ALICI'nın ${COMPANY.tradeName} dijital menü/QR platformuna ait <strong>"Tam Erişim" aboneliğini</strong> elektronik ortamda satın almasına ilişkin tarafların hak ve yükümlülüklerinin belirlenmesidir.</p>
<h2>3. Hizmet ve Bedel</h2>
<p>Hizmet: ${COMPANY.tradeName} Tam Erişim aboneliği (dijital QR menü, tema, AI görsel canlandırma vb. — tüm özellikler). Bedel: <strong>${NET.toLocaleString("tr-TR")} TL + %${KDV_PCT} KDV = ${GROSS.toLocaleString("tr-TR")} TL / ay (KDV dahil)</strong>. Yeni kullanıcılar için 14 günlük ücretsiz deneme sunulur. Abonelik, iptal edilene kadar her dönem sonunda otomatik yenilenir.</p>
<h2>4. Ödeme</h2>
<p>Ödemeler, kredi/banka kartı ile <strong>iyzico</strong> altyapısı üzerinden güvenli şekilde tahsil edilir. SATICI kart bilgilerini saklamaz.</p>
<h2>5. İfa ve Teslim</h2>
<p>Hizmet dijitaldir; ödeme onaylandığı anda ALICI'nın hesabında <strong>anında ve elektronik olarak</strong> sunulur. Fiziksel teslimat yoktur.</p>
<h2>6. Cayma Hakkı</h2>
<p>Mesafeli Sözleşmeler Yönetmeliği md. 15/1-(ğ) uyarınca, ALICI'nın onayı ile <strong>ifasına başlanan dijital içerik/hizmetlerde cayma hakkı kullanılamaz</strong>. Bununla birlikte ALICI, aboneliğini dilediği an panelinden iptal edebilir; iptalde mevcut dönem sonuna kadar erişim sürer ve sonraki dönem ücretlendirilmez (otomatik yenileme durur).</p>
<h2>7. Uyuşmazlık Çözümü</h2>
<p>Uyuşmazlıklarda, Ticaret Bakanlığı'nca ilan edilen parasal sınırlar dahilinde ALICI'nın yerleşim yerindeki Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.</p>
<h2>8. Yürürlük</h2>
<p>ALICI, ödeme adımını onaylamakla işbu sözleşmenin tüm koşullarını kabul etmiş sayılır.</p>`,
  },
  {
    slug: "on-bilgilendirme-formu",
    title: "Ön Bilgilendirme Formu",
    html: `
${sellerBlock}
<h2>Hizmet ve Bedel</h2>
<p>${COMPANY.tradeName} "Tam Erişim" aboneliği. Aylık bedel: <strong>${NET.toLocaleString("tr-TR")} TL + %${KDV_PCT} KDV = ${GROSS.toLocaleString("tr-TR")} TL (KDV dahil)</strong>. 14 gün ücretsiz deneme. Abonelik iptal edilene dek otomatik yenilenir.</p>
<h2>Ödeme Şekli</h2>
<p>Kredi/banka kartı ile iyzico üzerinden tek seferde tahsilat (her dönem için).</p>
<h2>İfa</h2>
<p>Dijital hizmet; ödeme onayında anında elektronik erişim. Fiziksel teslimat yoktur.</p>
<h2>Cayma Hakkı</h2>
<p>İfasına başlanan dijital hizmetlerde cayma hakkı kullanılamaz (Yönetmelik md.15). Abonelik her an iptal edilebilir; dönem sonuna kadar erişim sürer, sonraki dönem ücretlendirilmez.</p>
<h2>Şikayet ve İtiraz</h2>
<p>Tüketici Hakem Heyetleri / Tüketici Mahkemeleri yetkilidir. İletişim: ${COMPANY.email} · ${COMPANY.phone}.</p>`,
  },
  {
    slug: "gizlilik-politikasi",
    title: "Gizlilik Politikası",
    html: `
<p>${COMPANY.tradeName} (${COMPANY.website}) olarak gizliliğinize önem veriyoruz. Bu politika, hangi verileri neden işlediğimizi açıklar.</p>
<h2>Toplanan Veriler</h2>
<ul>
<li>Hesap bilgileri: ad, e-posta ve/veya telefon, şifre (şifrelenmiş saklanır).</li>
<li>İşletme/menü içeriği: restoran adı, ürünler, görseller, tema ayarları.</li>
<li>Ödeme: kart bilgileri SATICI tarafından <strong>saklanmaz</strong>; ödeme iyzico altyapısıyla işlenir.</li>
<li>Teknik: oturum çerezleri, IP, kullanım kayıtları (güvenlik ve hizmet sunumu için).</li>
</ul>
<h2>Kullanım Amacı</h2>
<p>Hizmeti sunmak, hesabı yönetmek, ödemeleri işlemek, güvenliği sağlamak ve yasal yükümlülükleri yerine getirmek.</p>
<h2>Üçüncü Taraflar</h2>
<p>Ödeme için <strong>iyzico</strong>; e-posta/altyapı için <strong>Google</strong> ve barındırma sağlayıcımız. Veriler yalnızca hizmetin gerektirdiği ölçüde paylaşılır; satılmaz.</p>
<h2>Güvenlik</h2>
<p>Veriler SSL/TLS ile şifreli iletilir; şifreler geri döndürülemez biçimde saklanır; erişim yetkiyle sınırlıdır.</p>
<h2>İletişim</h2>
<p>${COMPANY.email}</p>`,
  },
  {
    slug: "kvkk-aydinlatma-metni",
    title: "KVKK Aydınlatma Metni",
    html: `
<p>6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, veri sorumlusu sıfatıyla bilgilendirmedir.</p>
<h2>Veri Sorumlusu</h2>
<p>${COMPANY.legalName} · ${COMPANY.address} · ${COMPANY.email}</p>
<h2>İşlenen Kişisel Veriler</h2>
<p>Kimlik/iletişim (ad, e-posta, telefon), müşteri işlem (abonelik, ödeme kayıtları — kart verisi hariç), işletme içeriği, işlem güvenliği (IP, log, çerez).</p>
<h2>Amaçlar ve Hukuki Sebepler</h2>
<p>Sözleşmenin kurulması/ifası (KVKK md.5/2-c), hukuki yükümlülük (md.5/2-ç), meşru menfaat (md.5/2-f) ve gerekli hallerde açık rıza kapsamında; hizmet sunumu, faturalandırma, destek ve güvenlik amaçlarıyla.</p>
<h2>Aktarım</h2>
<p>Ödeme hizmeti (iyzico), e-posta/altyapı (Google), barındırma sağlayıcısı ve yetkili kamu kurumlarına, mevzuata uygun olarak ve amaçla sınırlı aktarılabilir.</p>
<h2>Haklarınız (md.11)</h2>
<p>Verilerinize erişme, düzeltme, silme, işlemeyi öğrenme, itiraz ve zararın giderilmesini talep etme haklarına sahipsiniz. Başvuru: ${COMPANY.email}.</p>`,
  },
  {
    slug: "iptal-iade-ve-cayma",
    title: "İptal, İade ve Cayma Koşulları",
    html: `
<h2>Abonelik İptali</h2>
<p>Aboneliğinizi dilediğiniz an <strong>panelinizden</strong> ("Abonelik" sayfası) iptal edebilirsiniz. İptalde, ödediğiniz mevcut dönemin sonuna kadar tüm özelliklere erişiminiz sürer; <strong>sonraki dönem ücretlendirilmez</strong> (otomatik yenileme durur).</p>
<h2>Ücretsiz Deneme</h2>
<p>Yeni kullanıcılar 14 gün boyunca tüm özellikleri ücretsiz dener. Deneme süresince ücret alınmaz.</p>
<h2>Cayma Hakkı</h2>
<p>Hizmetimiz dijitaldir ve ödeme sonrası ifasına anında başlanır. Mesafeli Sözleşmeler Yönetmeliği md.15/1-(ğ) uyarınca, ifasına başlanan dijital hizmetlerde cayma hakkı kullanılamaz.</p>
<h2>İade</h2>
<p>Hizmet anında sunulduğundan kural olarak dönem ücreti iadesi yapılmaz. Hatalı/çift tahsilat veya teknik bir mağduriyet halinde ${COMPANY.email} adresinden bizimle iletişime geçin; durum incelenerek hak kaybına yol açılmaz.</p>`,
  },
  {
    slug: "teslimat-ve-ifa",
    title: "Teslimat ve Hizmet Sunumu",
    html: `
<p>${COMPANY.tradeName} tamamen <strong>dijital bir hizmettir</strong>; fiziksel ürün gönderimi yoktur.</p>
<h2>Hizmetin Sunumu</h2>
<p>Ödemeniz onaylandığı anda abonelik hesabınıza <strong>otomatik ve anında</strong> tanımlanır; tüm özellikleri hemen kullanmaya başlarsınız. Deneme kaydında ise hesap oluşturma anında erişim açılır.</p>
<h2>Erişim Sorunu</h2>
<p>Ödeme sonrası erişimde gecikme/sorun yaşarsanız ${COMPANY.email} · ${COMPANY.phone} üzerinden bize ulaşın.</p>`,
  },
  {
    slug: "cerez-politikasi",
    title: "Çerez Politikası",
    html: `
<p>${COMPANY.website} yalnızca hizmetin çalışması için gerekli çerezleri kullanır.</p>
<h2>Kullanılan Çerezler</h2>
<ul>
<li><strong>Zorunlu/Oturum çerezleri:</strong> giriş oturumunu sürdürmek ve güvenlik için.</li>
</ul>
<p>Pazarlama/izleme amaçlı üçüncü taraf reklam çerezleri kullanılmaz. Çerezleri tarayıcı ayarlarınızdan yönetebilir/silebilirsiniz; ancak oturum çerezleri olmadan giriş yapılamaz.</p>`,
  },
  {
    slug: "iletisim",
    title: "İletişim",
    html: `
${sellerBlock}
<p>Sorularınız, talepleriniz ve şikayetleriniz için yukarıdaki e-posta ve telefondan bize ulaşabilirsiniz. En kısa sürede dönüş yapılır.</p>`,
  },
];

export const LEGAL_INDEX = LEGAL_DOCS.map((d) => ({
  slug: d.slug,
  title: d.title,
}));

export function getLegalDoc(slug: string): LegalDoc | undefined {
  return LEGAL_DOCS.find((d) => d.slug === slug);
}

export { TODAY as LEGAL_UPDATED_PLACEHOLDER };
