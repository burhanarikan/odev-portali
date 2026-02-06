# Testleri Nasıl Çalıştırırsınız?

## Tüm testler (backend + frontend)

Proje kökünde:

```bash
npm run test
```

Önce backend testleri, sonra frontend testleri çalışır.

---

## Sadece backend testleri

```bash
cd backend
npm run test
```

**Canlı izleme (değişiklikte tekrar çalıştırır):**

```bash
cd backend
npm run test:watch
```

**Ne test ediliyor?**

- `src/__tests__/health.test.ts`: `GET /health` → 200 ve `status: OK`
- `src/__tests__/auth.test.ts`: Login’e boş body → 400; token olmadan öğretmen API → 401

---

## Sadece frontend testleri

```bash
cd frontend
npm run test
```

**Canlı izleme:**

```bash
cd frontend
npm run test:watch
```

**Ne test ediliyor?**

- `src/pages/__tests__/NotFound.test.tsx`: 404 sayfasında "404" ve "Sayfa Bulunamadı" metni, "Ana Sayfa" butonu

---

## Yeni test eklemek

- **Backend:** `backend/src/__tests__/` altına `*.test.ts` dosyası ekleyin. `request(app)` ile API isteği atabilirsiniz (`app` için `import { app } from '../app'`).
- **Frontend:** Test edeceğiniz bileşenin yanına `__tests__/*.test.tsx` veya ilgili sayfa/component klasöründe `*.test.tsx` ekleyin. Router kullanan bileşenleri `<MemoryRouter>` ile sarmalayın.
