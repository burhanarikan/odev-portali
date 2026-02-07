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

**Seçenek A — Render Shell (önerilen)**

1. [Render Dashboard](https://dashboard.render.com) → Backend servisinizi seçin.
2. Sol menüden **Shell** sekmesine girin.
3. Açılan terminalde:

```bash
cd backend
npx prisma migrate deploy
```

4. `DATABASE_URL` zaten Render ortamında tanımlı olduğu için ekstra bir şey yazmanıza gerek yok.

**Seçenek B — Kendi bilgisayarınızda**

Canlı veritabanı bağlantı dizesine sahipseniz:

```bash
cd backend
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

(`DATABASE_URL` değerini Render → Environment’tan kopyalayın.)

---

## 3. İsteğe bağlı: 429 alıyorsanız

Render → Backend servisi → **Environment**:

- **Key:** `RATE_LIMIT_MAX`
- **Value:** `800` veya `1000`

Kaydedip servisi yeniden başlatın (Manual Deploy veya otomatik deploy).

---

## Özet

| Adım            | Nerede        | Komut / İşlem |
|-----------------|---------------|----------------|
| Push            | Kendi PC      | `git push origin main` |
| Migration       | Render Shell  | `cd backend && npx prisma migrate deploy` |
| RATE_LIMIT_MAX  | Render Env    | Key: `RATE_LIMIT_MAX`, Value: `800` |

Bu üçünü yaptıktan sonra backend güncel olur, tablolar oluşur ve 429 riski azalır.
