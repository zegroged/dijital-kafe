-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'admin');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('free_trial', 'basic', 'premium');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('trialing', 'active', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "ModelStatus" AS ENUM ('none', 'pending', 'processing', 'ready', 'failed');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'owner',
    "email_verified" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurants" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "business_name" TEXT NOT NULL,
    "slug" TEXT,
    "logo_url" TEXT,
    "cover_image_url" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "working_hours" JSONB NOT NULL DEFAULT '{}',
    "social_links" JSONB NOT NULL DEFAULT '{}',
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TRY',
    "language" VARCHAR(5) NOT NULL DEFAULT 'tr',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "theme_settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "menu_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icon" VARCHAR(16),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dishes" (
    "id" UUID NOT NULL,
    "menu_id" UUID NOT NULL,
    "category_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "image_url" TEXT,
    "thumbnail_url" TEXT,
    "model_3d_url" TEXT,
    "model_usdz_url" TEXT,
    "model_status" "ModelStatus" NOT NULL DEFAULT 'none',
    "ar_code_asset_id" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dishes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'free_trial',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'trialing',
    "trial_ends_at" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "model_3d_quota" INTEGER NOT NULL DEFAULT 5,
    "models_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_user_id_key" ON "restaurants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_slug_key" ON "restaurants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "menus_restaurant_id_key" ON "menus"("restaurant_id");

-- CreateIndex
CREATE INDEX "categories_menu_id_idx" ON "categories"("menu_id");

-- CreateIndex
CREATE INDEX "dishes_menu_id_idx" ON "dishes"("menu_id");

-- CreateIndex
CREATE INDEX "dishes_category_id_idx" ON "dishes"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dishes" ADD CONSTRAINT "dishes_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dishes" ADD CONSTRAINT "dishes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
