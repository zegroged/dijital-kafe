-- Adisyon (masa hesabı / hafif POS): çalışan + masa + adisyon + kalem.

CREATE TYPE "AdisyonStatus" AS ENUM ('open', 'paid', 'cancelled');
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'card');

-- staff (çalışan/garson)
CREATE TABLE "staff" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "restaurant_id" UUID NOT NULL,
  "name" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "staff_user_id_key" ON "staff"("user_id");
CREATE INDEX "staff_restaurant_id_idx" ON "staff"("restaurant_id");

-- restaurant_tables (masa)
CREATE TABLE "restaurant_tables" (
  "id" UUID NOT NULL,
  "restaurant_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "restaurant_tables_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "restaurant_tables_restaurant_id_idx" ON "restaurant_tables"("restaurant_id");

-- adisyonlar
CREATE TABLE "adisyonlar" (
  "id" UUID NOT NULL,
  "restaurant_id" UUID NOT NULL,
  "table_id" UUID,
  "status" "AdisyonStatus" NOT NULL DEFAULT 'open',
  "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "payment_method" "PaymentMethod",
  "note" TEXT,
  "opened_by_id" UUID NOT NULL,
  "closed_by_id" UUID,
  "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "adisyonlar_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "adisyonlar_restaurant_id_idx" ON "adisyonlar"("restaurant_id");
CREATE INDEX "adisyonlar_status_idx" ON "adisyonlar"("status");
CREATE INDEX "adisyonlar_opened_by_id_idx" ON "adisyonlar"("opened_by_id");

-- adisyon_items
CREATE TABLE "adisyon_items" (
  "id" UUID NOT NULL,
  "adisyon_id" UUID NOT NULL,
  "dish_id" UUID,
  "name" TEXT NOT NULL,
  "unit_price" DECIMAL(10,2) NOT NULL,
  "qty" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "adisyon_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "adisyon_items_adisyon_id_idx" ON "adisyon_items"("adisyon_id");

-- FK'lar
ALTER TABLE "staff"
  ADD CONSTRAINT "staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "staff_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "restaurant_tables"
  ADD CONSTRAINT "restaurant_tables_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "adisyonlar"
  ADD CONSTRAINT "adisyonlar_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "adisyonlar_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "restaurant_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "adisyon_items"
  ADD CONSTRAINT "adisyon_items_adisyon_id_fkey" FOREIGN KEY ("adisyon_id") REFERENCES "adisyonlar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
