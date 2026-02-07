# Canlıya Alma (Deploy)

Bu rehberde projeyi ücretsiz/ucuz servislere nasıl deploy edeceğiniz anlatılıyor.

## Genel mimari

- **Frontend:** Static (Vite build) → Vercel / Netlify
- **Backend:** Node.js (Express) → Render / Railway / Fly.io
- **Veritabanı:** PostgreSQL → Render PostgreSQL / Railway / Neon / Supabase

---

## 1. Veritabanı (PostgreSQL)

### Seçenek A: Render (ücretsiz tier)

1. [render.com](https://render.com) → Sign up → Dashboard
2. **New +** → **PostgreSQL**
3. İsim verin, region seçin, **Create Database**
4. **Internal Database URL** veya **External Database URL** kopyalayın (backend aynı serviste ise Internal kullanın).

### Seçenek B: Neon

1. [neon.tech](https://neon.tech) → Sign up → Yeni proje
2. Connection string’i kopyalayın (örn. `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).

### Veritabanı hazırlığı

Lokal veya CI’da bir kez çalıştırın (DATABASE_URL’i canlı DB ile değiştirin):

```bash
cd backend
DATABASE_URL="postgresql://..." npx prisma db push
DATABASE_URL="postgresql://..." npx prisma db seed
```

---

## 2. Backend (Node.js)

### Render (Web Service)

1. GitHub repo’nuzu Render’a bağlayın.
2. **New +** → **Web Service** → Repo seçin.
3. Ayarlar:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm run start` (veya sadece `npm run start`; push’u ayrı yaptıysanız)
4. **Environment** ekleyin:
   - `DATABASE_URL` = (Render PostgreSQL veya Neon connection string)
   - `JWT_SECRET` = uzun rastgele bir string
   - `NODE_ENV` = `production`
   - `PORT` = Render otomatik atar, kodda `process.env.PORT || 5050` kullanın
5. **Create Web Service**. Backend URL örn: `https://odev-portali-backend.onrender.com`

6. **Önemli — Migration:** Backend ilk kez çalıştıktan sonra, canlı veritabanında tabloların oluşması için migration’ları bir kez çalıştırın. Aksi halde `/api/student/assignments` ve `/api/student/consent` 500 döner (tablo bulunamadı). Lokal veya CI’da:
   ```bash
   cd backend
   DATABASE_URL="postgresql://...canlı-connection-string..." npx prisma migrate deploy
   ```
   Render’da **Shell** (Dashboard → Service → Shell) açıp aynı komutu `DATABASE_URL` zaten ortamda olduğu için `npx prisma migrate deploy` çalıştırabilirsiniz.

### CORS

Backend’de frontend’in canlı URL’ine izin verin. `backend/src/app.ts` içinde:

```ts
origin: process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:3000', 'http://localhost:5173', 'https://odev-portali.vercel.app'],
```

Render’da **FRONTEND_URL** = `https://sizin-frontend.vercel.app` ekleyin (virgülle birden fazla yazabilirsiniz).

---

## 3. Frontend (Vite / React)

### Vercel

1. [vercel.com](https://vercel.com) → GitHub ile giriş → **Add New Project**
2. Repo seçin.
3. Ayarlar:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Environment Variables:**
   - `VITE_API_URL` = Backend’in canlı URL’i (örn. `https://odev-portali-backend.onrender.com/api`)
5. **Deploy**. Frontend URL örn: `https://odev-portali.vercel.app`

`frontend/vercel.json` zaten eklendi; tüm path’ler `index.html`’e gidiyor (SPA).

**Not (Vercel build):** Bu proje Next.js değil, Vite SPA'dır. `/api/uploads` ve tüm API istekleri frontend tarafında değil, backend (Render) üzerinden yapılır. Vercel yalnızca static build (`dist`) sunar; "failed to collect page data" hatası bu repo yapısında oluşmaz. İleride Next.js API route eklenirse, Vercel Serverless/Edge uyumlu kod (Node/Edge runtime) kullanın.

**API rotaları ve dosya sistemi (fs):** Backend'de yükleme artık **sadece bellek + Vercel Blob** kullanıyor; `express.static` ile disk sunumu kaldırıldı (Vercel serverless ile uyum için). Kök dizindeki `next.config.js` ileride Next.js kullanılırsa referans amaçlıdır; API rotalarında `fs` kullanmayın, Vercel Blob veya base64 kullanın.

### Netlify

1. [netlify.com](https://netlify.com) → Add new site → Import from Git → Repo seçin.
2. **Base directory:** `frontend`
3. **Build command:** `npm run build`
4. **Publish directory:** `frontend/dist`
5. **Environment:** `VITE_API_URL` = backend URL’i
6. **Redirects** (SPA): `/* /index.html 200` (Netlify arayüzünden veya `frontend/public/_redirects` ile)

---

## 4. Kontrol listesi

- [ ] PostgreSQL canlıda oluşturuldu
- [ ] `prisma db push` ve (isteğe bağlı) `db seed` canlı DB ile çalıştırıldı
- [ ] Backend deploy edildi, health: `GET https://backend-url/health` → 200
- [ ] Backend’de `FRONTEND_URL` ve `JWT_SECRET` ayarlandı
- [ ] Frontend’de `VITE_API_URL` = backend API URL’i (örn. `https://xxx.onrender.com/api`)
- [ ] Frontend deploy edildi, login ve ödev listesi çalışıyor

---

## Örnek ortam değişkenleri

**Backend (Render):**

```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
JWT_SECRET=uzun-guvenli-rastgele-string
NODE_ENV=production
FRONTEND_URL=https://odev-portali.vercel.app
```

**Frontend (Vercel):**

```
VITE_API_URL=https://odev-portali-backend.onrender.com/api
```

Bu adımlarla projeyi canlıya alabilirsiniz.
