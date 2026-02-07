# Ödev Sistemi – Veritabanı Adımları

## Yapılanlar (bu sefer)

1. **Şema güncellendi:** `npx prisma db push`  
   - `homeworks` tablosu ve `assignments.homework_id` alanı eklendi.

2. **Mevcut ödevler taslağa bağlandı:** `npm run db:backfill-homework`  
   - 4 ödev için Homework kaydı oluşturuldu ve ödevlere bağlandı.

## İleride yapmanız gerekenler

### Yeni bir bilgisayarda / ilk kurulumda

1. PostgreSQL’in çalıştığından emin olun (macOS: `brew services start postgresql` veya Postgres.app).
2. `backend/.env` içinde `DATABASE_URL` doğru olsun.
3. Terminalde:
   ```bash
   cd backend
   npx prisma db push
   npm run db:seed   # İsterseniz örnek veri için
   ```

### Şemayı değiştirdikten sonra

- Geliştirme ortamında (veriyi kaybetmek sorun değilse):
  ```bash
  cd backend
  npx prisma db push
  ```
- Migration kullanıyorsanız:
  ```bash
  npx prisma migrate dev --name aciklama
  ```

### Sorun çıkarsa

- **"Can't reach database"** → PostgreSQL kapalı; servisi başlatın.
- **"schema is not empty"** → Bu projede `db push` kullanıyoruz; `migrate deploy` yerine `db push` çalıştırın.
- **Backfill tekrar çalıştırırsanız** → Sadece `homework_id` boş olan ödevlere Homework oluşturur; zararsızdır.
