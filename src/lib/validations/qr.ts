import { z } from "zod";

// QR fiziksel ürün (üretici yönetir).
export const qrProductCreateSchema = z.object({
  name: z.string().trim().min(2, "Ürün adı gerekli").max(120),
  description: z.string().trim().max(2000).optional(),
  price: z.coerce.number().nonnegative("Fiyat negatif olamaz").max(1_000_000),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});
export const qrProductUpdateSchema = qrProductCreateSchema.partial();

// Sahip → QR ürün siparişi.
export const qrOrderCreateSchema = z.object({
  productId: z.uuid(),
  qty: z.coerce.number().int().min(1).max(100),
  shippingName: z.string().trim().min(2, "Ad gerekli").max(120),
  shippingPhone: z.string().trim().min(5, "Telefon gerekli").max(30),
  shippingAddress: z.string().trim().min(10, "Adres gerekli").max(500),
});

// Üretici → sipariş durumu ilerletme.
export const qrOrderStatusSchema = z.object({
  status: z.enum(["processing", "shipped", "delivered", "cancelled"]),
});
