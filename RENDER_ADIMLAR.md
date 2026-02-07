# Render'da Yapılacaklar (Deploy + Migration + 429)

Bu adımları **sırayla** uygulayın.

---

## 1. Push (kendi bilgisayarınızda)

Terminalde proje klasöründe:

```bash
git push origin main
```

(GitHub kullanıcı adı/şifre veya SSH ile giriş yapmanız gerekebilir.)

Push sonrası Render otomatik yeni build alır ve backend güncel kodla çalışır.

---

## 2. Migration (canlı veritabanında tabloları oluşturma)

Render’da **Shell** yoksa (ücretsiz planda olabilir) migration’ı **kendi bilgisayarınızdan** production DB’ye uygulayın.

**Kendi bilgisayarınızda (Shell olmadan böyle yapın)**

1. **DATABASE_URL’i alın**  
   Render Dashboard → Backend servisi (**odev-portali-backend**) → **Environment** → `DATABASE_URL` satırındaki değeri kopyalayın (görmek için tıklayıp açın).

2. **Proje kökünde** terminalde:

```bash
cd backend
DATABASE_URL="buraya_yapistiirin" npx prisma migrate deploy
```

`DATABASE_URL="..."` kısmına kopyaladığınız tam connection string’i yapıştırın (tırnak içinde). Örnek:

```bash
DATABASE_URL="postgresql://user:pass@host.neon.tech/odev_portali?sslmode=require" npx prisma migrate deploy
```

3. **Çıktıya bakın**  
   - “Applied X migrations” gibi bir satır görürseniz migration tamam demektir.  
   - Hata alırsanız (ör. “relation already exists”, “column already exists”) tam hata mesajını kopyalayıp saklayın; buna göre bir sonraki adım söylenebilir.

**Seçenek: Render Shell (varsa)**

1. Render Dashboard → Backend servisi → **Shell**.
2. Shell’de: `cd /opt/render/project/src/backend && npx prisma migrate deploy`  
   (Ortamda `DATABASE_URL` zaten vardır.)

---

## 3. CORS: Frontend (Vercel) adresi

Vercel’de frontend canlıysa (örn. `https://odev-portali.vercel.app`), tarayıcıdan API isteği yapıldığında CORS hatası almamak için Render’da şu değişkeni ekleyin:

- **Key:** `FRONTEND_URL`
- **Value:** `https://odev-portali.vercel.app`

(Kodda bu adres zaten izinli; yine de ortam değişkeni ile ek listeye alınır.)

---

## 4. İsteğe bağlı: 429 alıyorsanız

Render → Backend servisi → **Environment**:

- **Key:** `RATE_LIMIT_MAX`
- **Value:** `800` veya `1000`

Kaydedip servisi yeniden başlatın (Manual Deploy veya otomatik deploy).

---

## Özet

| Adım            | Nerede        | Komut / İşlem |
|-----------------|---------------|----------------|
| Push            | Kendi PC      | `git push origin main` |
| Migration       | Kendi PC      | `cd backend` sonra `DATABASE_URL="postgresql://..." npx prisma migrate deploy` (URL = Render Environment’tan) |
| FRONTEND_URL    | Render Env    | Key: `FRONTEND_URL`, Value: `https://odev-portali.vercel.app` (CORS) |
| RATE_LIMIT_MAX  | Render Env    | Key: `RATE_LIMIT_MAX`, Value: `800` |

Bunlardan sonra backend güncel olur, CORS çalışır ve 429 riski azalır.
