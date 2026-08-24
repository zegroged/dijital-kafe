-- AlterTable: kategoriye özel renk + düzen override
ALTER TABLE "categories" ADD COLUMN "color" VARCHAR(7);
ALTER TABLE "categories" ADD COLUMN "layout" VARCHAR(8);
