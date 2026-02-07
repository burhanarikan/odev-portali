# Production 500 / "column does not exist" – hemen yapılacaklar

Render’da 500 alıyorsan ve logda **The column `...` does not exist** görüyorsan:

---

## 1. Tek script ile tüm bilinen eksik sütunları ekle

Kendi bilgisayarında (production `DATABASE_URL` ile):

```bash
cd backend
DATABASE_URL="postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require" npx prisma db execute --file prisma/production-fix-all.sql
```

`DATABASE_URL` değerini Render → Environment’tan kopyala. Bu script şunları ekler (yoksa):

- **Tablolar:** timeline_posts, announcements, error_bank_entries, teacher_resources, intervention_logs, user_consents, attendance_sessions, attendance_records, make_up_slots, make_up_bookings, student_skill_scores  
- **Sütunlar:** assignments (homework_id, peer_review_enabled, peer_reviews_per_student), submissions (audioUrl, fileUrl), evaluations (annotation_data), homeworks (instructions, type, file_url, audio_url, fileUrl, audioUrl)  

---

## 2. Hâlâ "column X does not exist" alıyorsan

Prisma’nın ürettiği tam farkı uygula:

```bash
cd backend
export DATABASE_URL="postgresql://..."   # production URL

npm run db:sync-diff > prisma/sync-production.sql
npx prisma db execute --file prisma/sync-production.sql
```

Üretilen `sync-production.sql` içinde bazen "already exists" hataları çıkabilir; önemli olan eksik sütunların eklenmesi.

---

## 3. Render Logs’ta ilk hataya bak

Çok sayıda 500 görüyorsan çoğu aynı kökten gelir. Render → Logs → **ilk kırmızı stack trace**’te yazan sütun/tablo adına göre ya `production-fix-all.sql` yeterli olur ya da 2. adımdaki sync gerekir.
