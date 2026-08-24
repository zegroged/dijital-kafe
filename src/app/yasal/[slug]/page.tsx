import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";
import { getLegalDoc, LEGAL_INDEX } from "@/lib/legal";

export function generateStaticParams() {
  return LEGAL_INDEX.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  return { title: doc ? `${doc.title} · ${APP_NAME}` : "Bulunamadı" };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) notFound();

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-6 py-12">
      <Link href="/" className="text-sm text-muted-foreground underline">
        ← {APP_NAME}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{doc.title}</h1>
      <article
        className="mt-6 space-y-3 text-sm leading-relaxed [&_h2]:mt-7 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:text-muted-foreground [&_p]:text-muted-foreground [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
        // İçerik statik ve güvenilir (kod içinde authored).
        dangerouslySetInnerHTML={{ __html: doc.html }}
      />

      <div className="mt-10 border-t pt-6">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Diğer yasal metinler
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {LEGAL_INDEX.filter((d) => d.slug !== slug).map((d) => (
            <li key={d.slug}>
              <Link href={`/yasal/${d.slug}`} className="text-primary underline">
                {d.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
