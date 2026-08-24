import type { ModelStatus } from "@/generated/prisma/client";

// Server page'den client'a geçen düzleştirilmiş tipler.
// (Decimal → number, Date alanları atılmış.)

export interface CategoryDTO {
  id: string;
  name: string;
  icon: string | null;
  imageUrl: string | null;
  hasTheme: boolean; // kategoriye özel tema var mı (themeSettings dolu mu)
  sortOrder: number;
}

export interface DishDTO {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  originalImageUrl: string | null;
  modelStatus: ModelStatus;
  isAvailable: boolean;
  sortOrder: number;
}
