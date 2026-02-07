# Veritabanı güncelleme

- **Sadece client güncelle (şema değişmediyse):**  
  `npx prisma generate`

- **Şemayı veritabanına uygula (migrations kullanmıyorsanız):**  
  `npx prisma db push`  
  `.env` içinde `DATABASE_URL` tanımlı olmalı.

- **Migrations ile (önerilen, production):**  
  `npm run db:deploy`  
  veya: `npx prisma generate && npx prisma migrate deploy`

`db push` hatası alırsanız:
1. Önce `npm run db:deploy` deneyin (DATABASE_URL gerekli).
2. Tablolar zaten varsa (daha önce push ettiyseniz):  
   `npx prisma migrate resolve --applied 20250206120000_timeline_resources_errorbank_intervention`  
   sonra `npx prisma generate`.
