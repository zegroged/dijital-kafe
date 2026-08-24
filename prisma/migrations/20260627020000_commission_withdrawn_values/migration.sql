-- Komisyon durumuna çekim ara değerleri. Enum ADD VALUE eklendiği transaction'da
-- KULLANILAMAZ → tek başına migration (sonraki migration'da kullanılabilir).
ALTER TYPE "CommissionStatus" ADD VALUE IF NOT EXISTS 'requested';
ALTER TYPE "CommissionStatus" ADD VALUE IF NOT EXISTS 'withdrawn';
