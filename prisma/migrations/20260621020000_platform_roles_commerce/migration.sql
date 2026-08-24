-- Yeni roller. (Ayrı migration: enum değeri, eklendiği transaction'da kullanılamaz.
-- Bu migration commit olduktan sonra tablolar bir sonraki migration'da kurulur.)
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'qr_vendor';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'affiliate';
