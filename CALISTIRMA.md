# Uygulamayı Çalıştırma

## 1. PostgreSQL

PostgreSQL’in yüklü ve çalışır durumda olduğundan emin olun (port 5432).

## 2. Backend ortam değişkenleri

`backend/.env` dosyasını düzenleyin. **DATABASE_URL**’i kendi PostgreSQL kullanıcı adı ve şifrenizle güncelleyin:

```env
PORT=5050
DATABASE_URL="postgresql://KULLANICI_ADI:SIFRE@localhost:5432/homework_db"
```

Örnek (kullanıcı `postgres`, şifre `postgres`):

```env
PORT=5050
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/homework_db"
```

Önce veritabanını oluşturun (psql veya pgAdmin ile):

```sql
CREATE DATABASE homework_db;
```

## 3. Veritabanı şeması

```bash
cd backend
npx prisma db push
```

İsterseniz örnek veri için:

```bash
npx prisma db seed
```

## 4. Backend’i başlatın

```bash
cd backend
npm run dev
```

Backend varsayılan port 5000; frontend 5050 bekliyor. backend/.env içine PORT=5050 ekleyin, sonra kökte npm run dev ile her ikisini başlatın. Backend: **http://localhost:5050**

## 5. Frontend’i başlatın (yeni bir terminalde)

```bash
cd frontend
npm run dev
```

Frontend: **http://localhost:5173** (veya Vite’ın gösterdiği adres)

## 6. Giriş

- Önce **Kayıt ol** ile bir hesap oluşturun.
- Sonra **Giriş yap** ile giriş yapın (Öğretmen veya Öğrenci rolüyle).

### Seed ile gelen örnek hesaplar (dil okulu)

Seed çalıştırıldıysa (`npx prisma db seed`) şu hesapları kullanabilirsiniz:

| Rol      | E-posta                 | Şifre  |
|----------|-------------------------|--------|
| Öğretmen | ogretmen@dilokulu.com   | 123456 |
| Öğrenci  | ayse.yilmaz@email.com   | 123456 |

Diğer örnek öğrenciler: mehmet.kaya@email.com, zeynep.demir@email.com, can.ozturk@email.com, selin.arslan@email.com, emre.celik@email.com, deniz.aydin@email.com, ece.koc@email.com (hepsi şifre: 123456).

---

## Öğrenci tarafını test etme

1. **Çıkış yap** (öğretmen hesabındaysan) veya gizli pencerede uygulamayı aç.
2. **Giriş yap** → Öğrenci: `ayse.yilmaz@email.com` / `123456`.
3. **Öğrenci paneli** açılır:
   - Üstte **Aktif**, **Gelecek**, **Tamamlanan** ödev sayıları görünür.
   - **Aktif ödevler** listesinde ödeve tıkla → **Ödevi Görüntüle**.
4. **Ödev detay sayfasında:**
   - Açıklamayı oku.
   - **Ödev Teslimi** bölümünde metin yazıp **Ödevi Teslim Et** ile teslim edebilirsin (isteğe bağlı dosya adı da eklenebilir).
5. Teslim sonrası aynı ödevde "Teslim edildi" görünür; dashboard’da o ödev **Tamamlanan** kısmına geçer.
