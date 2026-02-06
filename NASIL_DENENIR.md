# Nasıl Denersiniz?

## Hazırlık

1. **PostgreSQL** çalışıyor olsun; veritabanı oluşturun:
   ```sql
   CREATE DATABASE homework_db;
   ```

2. **backend/.env** dosyası (Frontend 5050 portunu kullanıyor, backend de 5050’de olmalı):
   ```env
   PORT=5050
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/homework_db"
   ```

3. **Veritabanı ve örnek veri:**
   ```bash
   cd backend
   npx prisma db push
   npx prisma db seed
   ```

4. **Uygulamayı başlatın** (proje kökünde):
   ```bash
   npm run dev
   ```
   - Backend: http://localhost:5050  
   - Frontend: Terminalde yazan adres (örn. http://localhost:3000 veya http://localhost:5173)

5. Tarayıcıda **frontend** adresini açın.

---

## 1) Öğretmen girişi ve sayfalar

- **Giriş yap** → `ogretmen@dilokulu.com` / `123456`
- Menüden **Ana Sayfa**, **Ödev Oluştur**, **Öğrenciler**, **Analitik** sayfalarına tıklayın; 404 olmamalı.
- **Ödev Oluştur** sayfası açılmalı (URL: `/assignments/create`).

---

## 2) Aynı ödevin tekrar verilmesi (duplicate kontrolü)

- **Ödev Oluştur** sayfasında:
  - Başlık: **Test Ödevi 1**
  - Seviye: **A1**
  - Hafta: **1**
  - Kime atanacak: **Tüm seviye**
- **Ödevi Yayınla** ile kaydedin → "Başarılı" toast’ı gelmeli.
- Aynı sayfada tekrar:
  - Başlık: **Test Ödevi 1**
  - Seviye: **A1**
  - **Ödevi Yayınla**’ya basın.
- **"Bu seviyede aynı başlıkta bir ödev zaten mevcut…"** benzeri hata (toast) görmelisiniz; ikinci ödev oluşmamalı.

---

## 3) Ödevi sadece belirli öğrencilere atama

- **Ödev Oluştur** sayfasında:
  - Başlık: **Sadece Ayşe ve Mehmet'e**
  - Seviye: **A1**
  - **Kime atanacak**: **Belirli öğrenciler**
  - Listeden sadece **Ayşe Yılmaz** ve **Mehmet Kaya**’yı işaretleyin.
- **Ödevi Yayınla** ile kaydedin.
- **Çıkış yap** veya gizli pencerede öğrenci hesabı açın.

**Öğrenci Ayşe:**  
Giriş `ayse.yilmaz@email.com` / `123456` → Ana sayfada **"Sadece Ayşe ve Mehmet'e"** ödevini görmelisiniz.

**Öğrenci Zeynep (A1’de ama seçilmedi):**  
Giriş `zeynep.demir@email.com` / `123456` → Bu ödev **görünmemeli**.

---

## 4) Belirli sınıfa atama

- Öğretmen ile giriş yapın.
- **Ödev Oluştur** → Başlık: **Sadece A1-A sınıfına** → Seviye: **A1** → **Kime atanacak**: **Belirli sınıf** → **A** (veya listelenen sınıf adı) → Yayınlayın.
- **Ayşe** ve **Mehmet** (A1-A) bu ödevi görmeli.
- **Zeynep** / **Can** (A1-B) bu ödevi **görmemeli**.

---

## Örnek hesaplar (seed sonrası)

| Rol      | E-posta                 | Şifre  |
|----------|-------------------------|--------|
| Öğretmen | ogretmen@dilokulu.com   | 123456 |
| Öğrenci  | ayse.yilmaz@email.com   | 123456 |
| Öğrenci  | mehmet.kaya@email.com    | 123456 |
| Öğrenci  | zeynep.demir@email.com   | 123456 |
| Öğrenci  | can.ozturk@email.com     | 123456 |

(Tüm öğrenciler şifre: 123456)
