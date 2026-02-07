# Production DB baseline (P3005: schema is not empty)

Veritabanı `db push` ile oluşturulduğu için migration geçmişi yok. Önce eksik sütunları ekleyin, sonra tüm migration'ları "uygulandı" işaretleyin.

## Adım 1: Eksik sütunları ekle

**Seçenek A — Prisma ile (önerilen)**  
Backend klasöründe, production `DATABASE_URL` ile:

```bash
cd backend
DATABASE_URL="postgresql://..." npx prisma db execute --file prisma/baseline-production.sql
```

**Seçenek B — Neon SQL Editor**  
Neon Dashboard → Projeniz → **SQL Editor** → New query → `prisma/baseline-production.sql` içeriğini yapıştırıp **Run**.

## Adım 2: Migration'ları “uygulandı” işaretle (baseline)

Backend klasöründe, **production DATABASE_URL** ile:

```bash
cd backend

export DATABASE_URL="postgresql://neondb_owner:...@ep-shy-silence-agy7gh7v-pooler....neon.tech/neondb?sslmode=require"
# veya: DATABASE_URL="..." (Render Environment’tan kopyalayın)

npx prisma migrate resolve --applied "20250206000000_add_homework_model"
npx prisma migrate resolve --applied "20250206120000_timeline_resources_errorbank_intervention"
npx prisma migrate resolve --applied "20250206200000_user_consent"
npx prisma migrate resolve --applied "20250207000000_student_skill_scores"
npx prisma migrate resolve --applied "20250207100000_telafi_missed_topic"
npx prisma migrate resolve --applied "20250207150000_submissions_audio_file_url"
npx prisma migrate resolve --applied "20250207200000_teacher_wiki"
```

Tek satırda (Unix/macOS):

```bash
for m in 20250206000000_add_homework_model 20250206120000_timeline_resources_errorbank_intervention 20250206200000_user_consent 20250207000000_student_skill_scores 20250207100000_telafi_missed_topic 20250207150000_submissions_audio_file_url 20250207200000_teacher_wiki; do
  DATABASE_URL="postgresql://..." npx prisma migrate resolve --applied "$m"
done
```

(`DATABASE_URL="..."` kısmını kendi connection string’inizle değiştirin.)

## Adım 3: Kontrol

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

Çıktıda "No pending migrations" veya "already applied" görmelisiniz. Bundan sonra Render build içinde `prisma migrate deploy` sorunsuz çalışır.

---

## Hâlâ "column X does not exist" alıyorsan (tam şema senkronu)

Prisma’nın üreteceği tam farkı uygulayın:

```bash
cd backend
export DATABASE_URL="postgresql://..."   # production URL

# Mevcut DB ile şema arasındaki farkı SQL olarak üret
npm run db:sync-diff > prisma/sync-production.sql

# Üretilen SQL'i uygula (önce dosyaya göz atın; CREATE TABLE varsa tablo yoksa çalışır)
npx prisma db execute --file prisma/sync-production.sql
```

Not: `sync-production.sql` içinde `IF NOT EXISTS` olmayan satırlar olabilir; bir sütun zaten varsa o satır hata verir, diğerleri çalışır. Tekrarda sadece eksik kalanlar eklenir.
