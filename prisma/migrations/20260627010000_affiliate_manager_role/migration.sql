-- Komisyon yöneticisi rolü: yalnızca komisyoncu hesabı açabilen ayrı kullanıcı.
-- Enum ADD VALUE eklendiği transaction'da KULLANILAMAZ → tek başına migration.
-- (Burada yalnız değer ekliyoruz; SQL içinde kullanmıyoruz, sonraki kullanımlar runtime'da.)
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'affiliate_manager';
