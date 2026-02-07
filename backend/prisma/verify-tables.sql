-- Veritabanında eksik tablo/kolon var mı kontrol et.
-- Neon SQL Editor'da veya: DATABASE_URL="..." npx prisma db execute --file prisma/verify-tables.sql
-- Sonuç: tablo yoksa "missing" görünür.

SELECT 'timeline_posts' AS tbl, CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'timeline_posts') THEN 'OK' ELSE 'MISSING' END AS status
UNION ALL SELECT 'announcements', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'announcements') THEN 'OK' ELSE 'MISSING' END
UNION ALL SELECT 'error_bank_entries', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'error_bank_entries') THEN 'OK' ELSE 'MISSING' END
UNION ALL SELECT 'homeworks', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'homeworks') THEN 'OK' ELSE 'MISSING' END
UNION ALL SELECT 'attendance_sessions', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance_sessions') THEN 'OK' ELSE 'MISSING' END
UNION ALL SELECT 'user_consents', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_consents') THEN 'OK' ELSE 'MISSING' END;
