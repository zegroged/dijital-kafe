import { revalidateTag } from "next/cache";

// Public menü içeriği (kategoriler + ürünler + tema) slug başına bir cache
// etiketiyle saklanır. İçerik değiştiren mutasyonlar (yayınla, ürün/kategori/
// tema CRUD) bu etiketi tazeler → public menü anında güncellenir.
// Abonelik/trial kapısı cache DIŞIDIR; her istekte canlı değerlendirilir.

export function menuTag(slug: string): string {
  return `menu:${slug}`;
}

// Restoranın public menü cache'ini geçersiz kıl. slug yoksa no-op.
export function revalidatePublicMenu(slug: string | null | undefined): void {
  if (slug) revalidateTag(menuTag(slug));
}
