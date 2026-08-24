-- Çalışan (garson) rolü. Enum ADD VALUE eklendiği transaction'da kullanılamaz → ayrı migration.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'staff';
