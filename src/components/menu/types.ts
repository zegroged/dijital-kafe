import type { ModelStatus } from "@/generated/prisma/client";
import type { ThemeSettings } from "@/lib/theme/schema";

// Public menü client bileşenlerinin paylaştığı, serialize edilebilir tipler.
// (Decimal/Date YOK — price number, gereksiz alanlar atılmış.)

export type PublicCategory = {
  id: string;
  name: string;
  icon: string | null;
  imageUrl: string | null;
  // Kategoriye özel tam tema (null = menü temasını miras alır).
  theme: ThemeSettings | null;
};

export type PublicDish = {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  model3dUrl: string | null;
  modelUsdzUrl: string | null;
  modelStatus: ModelStatus;
  hasModel: boolean;
};

export type PublicRestaurant = {
  businessName: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  phone: string | null;
  address: string | null;
  currency: string;
};
