import { z } from "zod";

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Kategori adı gerekli").max(80),
  icon: z.string().trim().max(16).optional(),
  imageUrl: z.string().optional(),
});
export const categoryUpdateSchema = categoryCreateSchema.partial();

export const dishCreateSchema = z.object({
  categoryId: z.uuid().nullable().optional(),
  name: z.string().trim().min(1, "Yemek adı gerekli").max(120),
  description: z.string().trim().max(2000).optional(),
  price: z.coerce.number().nonnegative("Fiyat negatif olamaz"),
  imageUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  // AI canlandırma öncesi orijinal (null = orijinal görseli temizle).
  originalImageUrl: z.string().nullable().optional(),
  isAvailable: z.boolean().optional(),
});
export const dishUpdateSchema = dishCreateSchema.partial();

// Sürükle-bırak sıralama: yeni sıradaki id dizisi.
export const reorderSchema = z.object({
  ids: z.array(z.uuid()).min(1),
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type DishCreateInput = z.infer<typeof dishCreateSchema>;
