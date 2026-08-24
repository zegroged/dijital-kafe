-- Komisyoncu + QR üretici/ürün/sipariş tabloları.

CREATE TYPE "ReferralStatus" AS ENUM ('pending', 'earned', 'paid', 'cancelled');
CREATE TYPE "QrOrderStatus" AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');

-- affiliates (komisyoncu)
CREATE TABLE "affiliates" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "commission_rate" DECIMAL(4,3) NOT NULL DEFAULT 0.60,
  "payout_info" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "affiliates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "affiliates_user_id_key" ON "affiliates"("user_id");
CREATE UNIQUE INDEX "affiliates_code_key" ON "affiliates"("code");

-- referrals (referans kaydı / komisyon)
CREATE TABLE "referrals" (
  "id" UUID NOT NULL,
  "affiliate_id" UUID NOT NULL,
  "referred_user_id" UUID NOT NULL,
  "plan" "Plan",
  "amount" DECIMAL(10,2),
  "status" "ReferralStatus" NOT NULL DEFAULT 'pending',
  "earned_at" TIMESTAMP(3),
  "paid_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "referrals_referred_user_id_key" ON "referrals"("referred_user_id");
CREATE INDEX "referrals_affiliate_id_idx" ON "referrals"("affiliate_id");

-- qr_vendors (QR lazer üreticisi)
CREATE TABLE "qr_vendors" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "company_name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "qr_vendors_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "qr_vendors_user_id_key" ON "qr_vendors"("user_id");

-- qr_products (üreticinin ürünleri)
CREATE TABLE "qr_products" (
  "id" UUID NOT NULL,
  "vendor_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" DECIMAL(10,2) NOT NULL,
  "image_url" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "qr_products_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "qr_products_vendor_id_idx" ON "qr_products"("vendor_id");

-- qr_orders (siparişler)
CREATE TABLE "qr_orders" (
  "id" UUID NOT NULL,
  "vendor_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "buyer_user_id" UUID NOT NULL,
  "qty" INTEGER NOT NULL DEFAULT 1,
  "unit_price" DECIMAL(10,2) NOT NULL,
  "total" DECIMAL(10,2) NOT NULL,
  "platform_fee" DECIMAL(10,2) NOT NULL,
  "vendor_payout" DECIMAL(10,2) NOT NULL,
  "menu_qr_url" TEXT,
  "shipping_name" TEXT,
  "shipping_phone" TEXT,
  "shipping_address" TEXT,
  "status" "QrOrderStatus" NOT NULL DEFAULT 'pending',
  "payment_ref" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "qr_orders_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "qr_orders_vendor_id_idx" ON "qr_orders"("vendor_id");
CREATE INDEX "qr_orders_buyer_user_id_idx" ON "qr_orders"("buyer_user_id");

-- Foreign keys
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "affiliates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "qr_vendors" ADD CONSTRAINT "qr_vendors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "qr_products" ADD CONSTRAINT "qr_products_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "qr_vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "qr_orders" ADD CONSTRAINT "qr_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "qr_vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "qr_orders" ADD CONSTRAINT "qr_orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "qr_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "qr_orders" ADD CONSTRAINT "qr_orders_buyer_user_id_fkey" FOREIGN KEY ("buyer_user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
