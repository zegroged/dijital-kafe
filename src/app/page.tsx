import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  ClipboardList,
  Globe,
  Palette,
  QrCode,
  Smartphone,
  Sparkles,
  Store,
  Zap,
} from "lucide-react";
import { PhoneMockup } from "@/components/landing/phone-mockup";
import { ThemeGallery } from "@/components/landing/theme-gallery";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME, PLANS, ROOT_DOMAIN, TRIAL_DAYS, isUnlimited } from "@/lib/constants";
import { allowedThemeCount } from "@/lib/theme/entitlements";
import { LEGAL_INDEX } from "@/lib/legal";
import { JsonLd, faqPageLd, softwareApplicationLd } from "@/lib/seo";

// Kanonik (self-referencing) → Google "kopya" sanmasın; www/non-www tekleşsin.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    title: "Dijital Kafe — Restoran ve Kafeler için QR Menü",
    description:
      "Dijital Kafe ile QR menü oluşturun: 150 hazır tema, AI fotoğraf canlandırma ve dijital adisyon (hafif POS). Mobil-uyumlu dijital menü, 14 gün ücretsiz.",
    url: "/",
    type: "website",
    siteName: "Dijital Kafe",
    locale: "tr_TR",
  },
};

const CTA_PRIMARY =
  "h-12 rounded-xl px-7 text-base shadow-sm hover:shadow has-data-[icon=inline-end]:pr-5";
const CTA_OUTLINE = "h-12 rounded-xl px-7 text-base";

// SSS — hem görünür bölüm hem FAQPage yapılandırılmış verisi aynı kaynaktan.
// Marka + uzun kuyruk aramalarını hedefler ("dijital kafe nedir", "qr menü
// ücretsiz mi", "kafe adisyon programı").
const FAQ: { q: string; a: string }[] = [
  {
    q: "Dijital Kafe nedir?",
    a: "Dijital Kafe; restoran ve kafeler için QR menü, 150 hazır tema, yapay zeka ile fotoğraf canlandırma ve dijital adisyon (hafif POS) sunan bulut tabanlı bir dijital menü platformudur.",
  },
  {
    q: "QR menü oluşturmak ne kadar sürer?",
    a: "Kurulum sihirbazıyla dakikalar içinde menünüzü oluşturup yayına alırsınız: kategori ve ürünlerinizi ekleyin, temanızı seçin, QR kodunuzu indirin.",
  },
  {
    q: "Dijital Kafe ücretsiz mi?",
    a: `Yeni işletmeler ${TRIAL_DAYS} gün boyunca tüm özellikleri ücretsiz dener. Sonrasında Tam Erişim paketi aylık ₺${PLANS.premium.priceMonthly.toLocaleString(
      "tr-TR",
    )} + KDV'dir ve istediğiniz an iptal edebilirsiniz.`,
  },
  {
    q: "Adisyon (masa hesabı) takibi dahil mi?",
    a: "Evet. Dijital adisyon ile masa açar, menüden ürün ekler, nakit veya kartla kapatırsınız; günlük ciro ve garson bazlı satışı tek ekranda görürsünüz. Ayrı bir POS cihazı gerekmez.",
  },
  {
    q: "Kendi alan adım ve QR kodum olur mu?",
    a: `Her işletmeye kahvecim.${ROOT_DOMAIN} gibi otomatik, SSL'li bir adres verilir. Baskıya hazır QR kodunuzu indirebilir, masalarınız için dayanıklı fiziksel QR'ları da panelden sipariş edebilirsiniz.`,
  },
  {
    q: "Kullanmak için teknik bilgi gerekiyor mu?",
    a: "Hayır. Kod yazmadan, canlı önizlemeyle her şeyi kendiniz yönetirsiniz; fiyat veya ürün değişikliği menünüze saniyeler içinde yansır.",
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Yapılandırılmış veri: ürün (SaaS) + SSS zengin sonuçları */}
      <JsonLd data={softwareApplicationLd} />
      <JsonLd data={faqPageLd(FAQ)} />

      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden">
        {/* Sıcak ışıma + ince desen (token dışı, sadece landing'e özel) */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 55% at 50% 0%, rgba(255,107,53,0.14), transparent 70%), radial-gradient(40% 40% at 90% 10%, rgba(244,163,0,0.10), transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(70% 60% at 50% 0%, black, transparent 75%)",
          }}
        />

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-16 pb-12 sm:pt-24 lg:grid-cols-2 lg:gap-8 lg:pb-20">
          {/* Sol: metin */}
          <div className="text-center lg:text-left">
            <Badge
              variant="secondary"
              className="h-7 gap-1.5 px-3 text-[0.8rem] font-medium"
            >
              <Sparkles className="text-[#FF6B35]" />
              QR Menü · 150 Tema · AI Fotoğraf · Adisyon
            </Badge>

            <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-6xl">
              Menünüz cebe sığsın,{" "}
              <span className="bg-gradient-to-r from-[#FF6B35] to-[#F4A300] bg-clip-text text-transparent">
                iştah açsın
              </span>
              .
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground lg:mx-0">
              {APP_NAME} ile dakikalar içinde profesyonel bir dijital menü
              oluşturun. Müşterileriniz QR kodu okutsun; yapay zeka ile renkleri
              canlandırılmış, iştah açıcı fotoğrafları markanıza uygun temayla
              görsün. Üstelik{" "}
              <strong className="font-semibold text-foreground">
                dijital adisyonla
              </strong>{" "}
              masaları, siparişleri ve günlük cironuzu da aynı yerden yönetin.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/kayit"
                className={buttonVariants({ size: "lg", className: CTA_PRIMARY })}
              >
                Ücretsiz Başla
                <ArrowRight data-icon="inline-end" />
              </Link>
              <Link
                href="/giris"
                className={buttonVariants({
                  size: "lg",
                  variant: "outline",
                  className: CTA_OUTLINE,
                })}
              >
                Giriş Yap
              </Link>
            </div>

            <p className="mt-5 text-sm text-muted-foreground">
              {TRIAL_DAYS} gün ücretsiz · Kredi kartı gerekmez · Anında yayında
            </p>
          </div>

          {/* Sağ: canlı telefon önizlemesi */}
          <div className="flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>

        {/* Mini istatistik şeridi */}
        <div className="mx-auto max-w-6xl px-6 pb-10">
          <dl className="grid grid-cols-2 gap-4 border-t pt-6 text-center sm:grid-cols-4">
            <Stat value="150+" label="Hazır tema" />
            <Stat value="AI Fotoğraf" label="Renkleri canlandırır" />
            <Stat value="Adisyon" label="Masa & ciro takibi" />
            <Stat value={`${TRIAL_DAYS} gün`} label="Ücretsiz deneme" />
          </dl>
        </div>
      </section>

      {/* ===================== TEMA GALERİSİ ===================== */}
      <section className="border-t bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto mb-10 max-w-2xl px-6 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight">
            Sektörünüze özel, hazır görünümler
          </h2>
          <p className="mt-3 text-muted-foreground">
            Kafe, fine dining, ızgara, pastane, bar… 150 profesyonel tema. Tek
            tıkla uygulayın, renkleri ve fontları markanıza göre ince ayarlayın.
          </p>
        </div>
        <ThemeGallery />
      </section>

      {/* ===================== ÖZELLİKLER ===================== */}
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight">
              Menüden masaya, ihtiyacınız olan her şey
            </h2>
            <p className="mt-3 text-muted-foreground">
              Dijital menü, tema, yapay zeka ve adisyon — hepsi tek panelde.
              Kurulum sihirbazıyla başlayın, akşama yayında olun.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={<QrCode />}
              title="QR Menü"
              description="Her masa için QR kod. Müşteri okutur, menünüz anında açılır. Baskıya hazır PNG ve SVG indirin."
            />
            <Feature
              icon={<Palette />}
              title="150 Hazır Tema"
              description="Kafe, fine dining, pastane, bar… 150 profesyonel tema. Renk, font, kart ve buton stili — kategoriye özel tema dahil — kod yazmadan."
            />
            <Feature
              icon={<Sparkles />}
              title="AI ile Canlı Fotoğraf"
              description="Telefonla çekilen fotoğraflar sönük mü? Yapay zeka, içeriği değiştirmeden renk ve ışığı canlandırıp menünüzü iştah açıcı gösterir."
            />
            <Feature
              icon={<ClipboardList />}
              title="Dijital Adisyon"
              description="Hafif POS: masa açın, menüden ürün ekleyin, nakit veya kartla kapatın. Kurulum yok — telefondan ya da tabletten çalışır."
            />
            <Feature
              icon={<BarChart3 />}
              title="Günlük Ciro & Garson"
              description="Garsonlarınıza giriş açın; herkes kendi adisyonunu yönetsin. Günlük ciro, nakit/kart dağılımı ve garson bazlı satış tek ekranda."
            />
            <Feature
              icon={<Globe />}
              title="Otomatik Subdomain"
              description={`kahvecim.${ROOT_DOMAIN} gibi kendi adresiniz. Anında yayında, SEO uyumlu, SSL'li.`}
            />
            <Feature
              icon={<Smartphone />}
              title="Mobil-First"
              description="Müşterilerin %90'ı telefondan bakar. Her tema hızlı, akışkan ve dokunmatik için tasarlandı."
            />
            <Feature
              icon={<Zap />}
              title="Anında Güncelleme"
              description="Fiyat mı değişti, ürün mü bitti? Panelden değiştirin; menü saniyeler içinde güncellensin."
            />
            <Feature
              icon={<Store />}
              title="Fiziksel QR Sipariş"
              description="Masalarınız için dayanıklı, baskıya hazır fiziksel QR ürünlerini doğrudan panelden sipariş edin; kapınıza gelsin."
            />
          </div>
        </div>
      </section>

      {/* ===================== AI FOTOĞRAF VİTRİN ===================== */}
      <section className="border-t bg-muted/30 px-6 py-16 sm:py-24">
        <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge variant="outline" className="mb-4 gap-1.5">
              <Sparkles className="text-[#FF6B35]" />
              Yapay zeka
            </Badge>
            <h2 className="text-balance text-3xl font-semibold tracking-tight">
              Sıradan fotoğraflar, iştah açıcı görsellere
            </h2>
            <p className="mt-4 text-muted-foreground">
              Telefonla çekilen fotoğrafların ışığı ve rengi çoğu zaman yetersiz
              kalır. Yapay zeka; tabağın içeriğini, dizilişini, hiçbir şeyini
              değiştirmeden yalnızca <strong>renkleri ve ışığı canlandırır</strong>.
              Menüye eklerken tek dokunuşla “güçlendir” dersiniz, gerisini AI
              halleder.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {[
                "İçerik birebir korunur — yalnız renk, ışık ve canlılık artar",
                "Yüklerken tek seçim: “AI ile güçlendir” veya “olduğu gibi”",
                "Pakete göre aylık canlandırma hakkı",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#FF6B35]" />
                  <span className="text-muted-foreground">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center">
            <AiPhotoShowcase />
          </div>
        </div>
      </section>

      {/* ===================== DİJİTAL ADİSYON VİTRİN ===================== */}
      <section className="border-t px-6 py-16 sm:py-24">
        <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
          <div className="lg:order-2">
            <Badge variant="outline" className="mb-4 gap-1.5">
              <ClipboardList className="text-[#FF6B35]" />
              Dijital adisyon · Hafif POS
            </Badge>
            <h2 className="text-balance text-3xl font-semibold tracking-tight">
              Sadece menü değil — masalarınızı da yönetin
            </h2>
            <p className="mt-4 text-muted-foreground">
              QR menünün yanında gelen{" "}
              <strong>dijital adisyon</strong> ile masa açın, menüden ürün
              ekleyin ve nakit ya da kartla kapatın. Ayrı bir cihaz, kurulum veya
              ağır POS yükü yok — telefondan ya da tabletten, olduğunuz yerden
              çalışır.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {[
                "Masaları tanımlayın; doluluk ve hesap tutarı tek ekranda",
                "Garsonlara giriş açın — herkes kendi adisyonunu yönetsin",
                "Nakit/kart ile kapatın; günlük ciro ve garson raporu otomatik",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#FF6B35]" />
                  <span className="text-muted-foreground">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center lg:order-1">
            <AdisyonShowcase />
          </div>
        </div>
      </section>

      {/* ===================== FİYATLANDIRMA ===================== */}
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight">
              Basit, şeffaf fiyatlandırma
            </h2>
            <p className="mt-3 text-muted-foreground">
              {TRIAL_DAYS} gün ücretsiz deneyin. Kredi kartı gerekmez, istediğiniz
              zaman yükseltin.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
            <PriceCard plan="free_trial" highlighted={false} cta="Ücretsiz Başla" />
            <PriceCard plan="premium" highlighted cta="Hemen Başla" />
          </div>
        </div>
      </section>

      {/* ===================== SSS ===================== */}
      <section className="border-t bg-muted/30 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight">
              Sık sorulan sorular
            </h2>
            <p className="mt-3 text-muted-foreground">
              {APP_NAME} hakkında en çok merak edilenler.
            </p>
          </div>
          <dl className="space-y-3">
            {FAQ.map((it) => (
              <div key={it.q} className="rounded-2xl border bg-card p-5 sm:p-6">
                <dt className="font-semibold">{it.q}</dt>
                <dd className="mt-2 text-sm text-muted-foreground">{it.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border bg-foreground px-6 py-14 text-center text-background">
          <h2 className="text-balance text-3xl font-semibold tracking-tight">
            Bugün başlayın, menünüz akşama yayında olsun
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-balance opacity-80">
            Kredi kartı gerekmez. İlk {TRIAL_DAYS} gün tamamen ücretsiz.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/kayit"
              className={buttonVariants({
                size: "lg",
                variant: "secondary",
                className: CTA_PRIMARY,
              })}
            >
              Ücretsiz Başla
              <ArrowRight data-icon="inline-end" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t px-6 py-8">
        <div className="mx-auto max-w-5xl space-y-4 text-sm text-muted-foreground">
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 sm:justify-start">
            {LEGAL_INDEX.map((d) => (
              <Link
                key={d.slug}
                href={`/yasal/${d.slug}`}
                className="hover:text-foreground hover:underline"
              >
                {d.title}
              </Link>
            ))}
          </nav>
          {/* Güvenli ödeme: iyzico + Visa/Mastercard/Troy (İyzico başvuru şartı) */}
          <div className="flex flex-col items-center gap-1.5 sm:items-start">
            <span className="text-xs">Güvenli ödeme</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/iyzico-band.svg"
              alt="iyzico ile Öde · Visa · Mastercard · Troy"
              className="h-8 w-auto"
            />
          </div>
          <div className="flex flex-col items-center justify-between gap-4 border-t pt-4 sm:flex-row">
            <span className="font-bold tracking-tight text-foreground">
              {APP_NAME}
            </span>
            <nav className="flex items-center gap-4">
              <Link href="/kayit" className="hover:text-foreground">
                Kayıt Ol
              </Link>
              <Link href="/giris" className="hover:text-foreground">
                Giriş Yap
              </Link>
            </nav>
            <span>
              © {new Date().getFullYear()} {APP_NAME}. Tüm hakları saklıdır.
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="text-2xl font-bold tracking-tight sm:text-3xl">{value}</dt>
      <dd className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</dd>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border bg-card p-6 text-left transition-shadow hover:shadow-md">
      <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B35]/15 to-[#F4A300]/10 text-[#C2410C] [&_svg]:size-5">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function PriceCard({
  plan,
  highlighted,
  cta,
}: {
  plan: keyof typeof PLANS;
  highlighted: boolean;
  cta: string;
}) {
  const p = PLANS[plan];
  const themeLine = `Tüm temalar (${allowedThemeCount(plan)}) + tam renk + efektler`;
  const features = [
    isUnlimited(p.maxCategories) ? "Sınırsız kategori" : `${p.maxCategories} kategori`,
    isUnlimited(p.maxDishes) ? "Sınırsız ürün" : `${p.maxDishes} ürün`,
    `Aylık ${p.aiEnhanceQuota} AI fotoğraf canlandırma`,
    themeLine,
    "QR kod, otomatik subdomain, SSL",
  ];
  return (
    <div
      className={
        "relative flex flex-col rounded-2xl border bg-card p-6 " +
        (highlighted ? "border-foreground/80 shadow-lg lg:-mt-3 lg:pb-9" : "")
      }
    >
      {highlighted ? (
        <Badge className="absolute -top-2.5 left-6 bg-[#FF6B35] text-white">
          En popüler
        </Badge>
      ) : null}
      <h3 className="text-lg font-semibold">{p.label}</h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold tracking-tight">
          {p.priceMonthly === 0
            ? "₺0"
            : `₺${p.priceMonthly.toLocaleString("tr-TR")}`}
        </span>
        <span className="text-sm text-muted-foreground">
          {p.priceMonthly === 0 ? `/ ${TRIAL_DAYS} gün` : "+ KDV / ay"}
        </span>
      </div>
      <ul className="mt-6 flex-1 space-y-2.5 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <Check className="mt-0.5 size-4 shrink-0 text-[#FF6B35]" />
            <span className="text-muted-foreground">{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={`/kayit?plan=${plan}`}
        className={buttonVariants({
          variant: highlighted ? "default" : "outline",
          className: "mt-6 h-10 w-full rounded-xl",
        })}
      >
        {cta}
      </Link>
    </div>
  );
}

// Dijital adisyon vitrini — açık bir masa hesabı kartı (inline SVG, harici
// görsel yok). Kalemler + toplam + nakit/kart butonları + yüzen günlük ciro
// çipi; özelliğin tam olarak ne yaptığını canlı gösterir.
function AdisyonShowcase() {
  const items = [
    { n: "Türk Kahvesi", q: "×2", p: "₺90", y: 92 },
    { n: "Cheesecake", q: "×1", p: "₺120", y: 124 },
    { n: "Limonata", q: "×2", p: "₺120", y: 156 },
  ];
  return (
    <svg
      viewBox="0 0 340 300"
      className="w-full max-w-sm"
      role="img"
      aria-label="Dijital adisyon ekranı: açık masa hesabı, ürünler, toplam ve nakit/kart ile kapatma"
    >
      <defs>
        <linearGradient id="ad-pay" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF8A3D" />
          <stop offset="1" stopColor="#FF6B35" />
        </linearGradient>
      </defs>

      {/* Ana kart */}
      <rect x="20" y="16" width="300" height="268" rx="20" fill="#fff" stroke="currentColor" strokeOpacity="0.1" />

      {/* Başlık: Masa 5 + "Açık" rozeti */}
      <text x="40" y="52" fontSize="17" fontFamily="sans-serif" fontWeight="700" fill="currentColor">Masa 5</text>
      <g transform="translate(244 38)">
        <rect x="0" y="0" width="56" height="22" rx="11" fill="#16A34A" fillOpacity="0.12" />
        <circle cx="14" cy="11" r="4" fill="#16A34A" />
        <text x="24" y="15" fontSize="11" fontFamily="sans-serif" fontWeight="600" fill="#15803D">Açık</text>
      </g>

      <line x1="40" y1="66" x2="300" y2="66" stroke="currentColor" strokeOpacity="0.08" />

      {/* Kalemler */}
      {items.map((it) => (
        <g key={it.n}>
          <text x="40" y={it.y} fontSize="13.5" fontFamily="sans-serif" fill="currentColor" fillOpacity="0.85">{it.n}</text>
          <text x="214" y={it.y} textAnchor="end" fontSize="12" fontFamily="sans-serif" fontWeight="600" fill="#C2410C">{it.q}</text>
          <text x="300" y={it.y} textAnchor="end" fontSize="13.5" fontFamily="sans-serif" fontWeight="700" fill="currentColor">{it.p}</text>
        </g>
      ))}

      <line x1="40" y1="178" x2="300" y2="178" stroke="currentColor" strokeOpacity="0.12" strokeDasharray="3 3" />

      {/* Toplam */}
      <text x="40" y="206" fontSize="13" fontFamily="sans-serif" fill="currentColor" fillOpacity="0.6">Toplam</text>
      <text x="300" y="208" textAnchor="end" fontSize="22" fontFamily="sans-serif" fontWeight="800" fill="currentColor">₺330</text>

      {/* Ödeme butonları: Nakit (outline yeşil) + Kart (dolu turuncu) */}
      <g transform="translate(40 224)">
        <rect x="0" y="0" width="124" height="40" rx="12" fill="#fff" stroke="#16A34A" strokeOpacity="0.5" />
        <text x="62" y="25" textAnchor="middle" fontSize="14" fontFamily="sans-serif" fontWeight="700" fill="#15803D">Nakit</text>
      </g>
      <g transform="translate(176 224)">
        <rect x="0" y="0" width="124" height="40" rx="12" fill="url(#ad-pay)" />
        <text x="62" y="25" textAnchor="middle" fontSize="14" fontFamily="sans-serif" fontWeight="700" fill="#fff">Kart</text>
      </g>

      {/* Yüzen "bugünkü ciro" çipi */}
      <g transform="translate(210 0)">
        <rect x="0" y="0" width="118" height="36" rx="13" fill="#111827" />
        <text x="14" y="15" fontSize="9" fontFamily="sans-serif" fill="#9CA3AF">Bugünkü ciro</text>
        <text x="14" y="28" fontSize="13" fontFamily="sans-serif" fontWeight="700" fill="#fff">₺4.250</text>
      </g>
    </svg>
  );
}

// AI fotoğraf canlandırma vitrini — "önce / sonra" inline SVG (harici görsel yok).
// Aynı tabak iki yarımda: sol sönük (önce), sağ canlı (sonra). İçerik aynı,
// yalnız renk/ışık değişir — özelliğin tam olarak yaptığı şey.
function AiPhotoShowcase() {
  return (
    <svg
      viewBox="0 0 340 280"
      className="w-full max-w-sm"
      role="img"
      aria-label="Yapay zeka ile fotoğraf önce/sonra: aynı tabak, daha canlı renkler"
    >
      <defs>
        <clipPath id="ai-right">
          <rect x="170" y="0" width="170" height="280" />
        </clipPath>
        <radialGradient id="ai-plate-vivid" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#FFD9A0" />
          <stop offset="1" stopColor="#FF8A3D" />
        </radialGradient>
        <radialGradient id="ai-food-vivid" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#FF8A5B" />
          <stop offset="1" stopColor="#D7401C" />
        </radialGradient>
      </defs>

      {/* Fotoğraf çerçevesi */}
      <rect x="16" y="20" width="308" height="208" rx="18" fill="#fff" stroke="currentColor" strokeOpacity="0.1" />

      {/* --- ÖNCE (tüm kart, sönük/gri) --- */}
      <g>
        <ellipse cx="170" cy="150" rx="118" ry="40" fill="#9aa0a6" opacity="0.18" />
        <ellipse cx="170" cy="142" rx="92" ry="30" fill="#b9bcc0" />
        <ellipse cx="170" cy="138" rx="70" ry="22" fill="#cfd2d5" />
        <circle cx="170" cy="132" r="34" fill="#9b9ea2" />
        <circle cx="156" cy="122" r="10" fill="#8a8d91" />
        <circle cx="186" cy="126" r="8" fill="#868a8e" />
        <circle cx="172" cy="146" r="9" fill="#7f8387" />
      </g>

      {/* --- SONRA (sağ yarı, canlı renkler — aynı kompozisyon) --- */}
      <g clipPath="url(#ai-right)">
        <ellipse cx="170" cy="150" rx="118" ry="40" fill="#FF6B35" opacity="0.16" />
        <ellipse cx="170" cy="142" rx="92" ry="30" fill="url(#ai-plate-vivid)" />
        <ellipse cx="170" cy="138" rx="70" ry="22" fill="#FFF3E0" />
        <circle cx="170" cy="132" r="34" fill="url(#ai-food-vivid)" />
        <circle cx="156" cy="122" r="10" fill="#FF5252" />
        <circle cx="186" cy="126" r="8" fill="#FFC83D" />
        <circle cx="172" cy="146" r="9" fill="#E8431A" />
        <circle cx="178" cy="120" r="4" fill="#7CB342" />
      </g>

      {/* Bölücü çizgi + tutamaç */}
      <line x1="170" y1="28" x2="170" y2="220" stroke="#fff" strokeWidth="3" />
      <line x1="170" y1="28" x2="170" y2="220" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />
      <circle cx="170" cy="124" r="13" fill="#fff" stroke="#FF6B35" strokeWidth="2" />
      <path d="M166 119 l-4 5 4 5 M174 119 l4 5 -4 5" stroke="#FF6B35" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Etiketler */}
      <text x="60" y="210" textAnchor="middle" fontSize="13" fill="currentColor" fillOpacity="0.45" fontFamily="sans-serif" fontWeight="600">Önce</text>
      <text x="278" y="210" textAnchor="middle" fontSize="13" fill="#C2410C" fontFamily="sans-serif" fontWeight="700">Sonra ✨</text>

      {/* AI rozeti */}
      <g transform="translate(248 36)">
        <rect x="0" y="0" width="62" height="26" rx="13" fill="#FF6B35" />
        <text x="31" y="17" textAnchor="middle" fontSize="13" fill="#fff" fontFamily="sans-serif" fontWeight="700">✨ AI</text>
      </g>

      {/* Serpiştirilmiş parıltılar */}
      {[
        [300, 150],
        [286, 184],
        [250, 168],
      ].map(([x, y]) => (
        <path
          key={`${x}-${y}`}
          d={`M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2} Z`}
          fill="#FFB078"
        />
      ))}
    </svg>
  );
}
