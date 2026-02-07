# Hata çoğalması ve debug yol haritası

Console’da 40+ endpoint hatası (500/503) görünce “her şey bozuk” sanmak yaygın. Çoğu zaman **1–3 kök neden** var, frontend ve altyapı bunu çoğaltıyor.

---

## Neden tek hata çok hataya dönüşür?

| Katman | Ne oluyor |
|--------|-----------|
| **Frontend** | Dashboard açılır açılmaz timeline, announcements, assignments, analytics, attendance… paralel istek atılıyor. React Query/SWR retry yapıyor. 1 backend hatası → 20 paralel request → 20 console error → retry → 40–60 error. |
| **Render (free tier)** | Backend uyuyor (cold start). İlk istekler 503. Backend ayağa kalkarken DB/JWT sorunu varsa sonrakiler 500. Bu yüzden 503 ve 500 karışık görünür. |
| **Auth zinciri** | `req.user` yoksa veya middleware crash ederse **tüm** protected endpoint’ler 500 döner. Public (örn. `/health`) çalışır. |
| **Prisma / DB** | Tek bir migration/connection/relation hatası → DB’ye dokunan her endpoint patlar. |
| **Console gürültüsü** | “input has no id”, “label not associated” gibi erişilebilirlik uyarıları backend ile ilgili değil; listeyi şişirir. |

Sonuç: **Çok hata ≠ çok bug.** Genelde 1–3 temel altyapı/backend hatası var.

---

## Ne yapma (debug sırasında)

- Console’daki hata sayısına odaklanma.
- Tek tek her endpoint’i ayrı bug sanma.
- Erişilebilirlik uyarılarını backend hatası sanma.

---

## Yol haritası: Tek kök nedeni bul

1. **Console’u kapat** (veya yok say).
2. **Render → Backend servisi → Logs** aç.
3. **İlk kırmızı stack trace’i** bul (Error 500 / Invalid `prisma...` / P2022 vb.).
4. **O tek hatayı düzelt** (eksik sütun → migration/patch, auth → middleware, DB → connection/migration).
5. Deploy / düzeltme sonrası sayfayı yenile; console’daki hataların büyük kısmı kendiliğinden kaybolacak.

---

## Zaten yapılanlar (bu projede)

- Öğretmen/öğrenci 500: Eksik DB sütunları (`homework_id`, `audioUrl`, `fileUrl`, `peer_review_enabled`, `peer_reviews_per_student`) → baseline + patch script’leri.
- CORS, Decimal serialize, debug fetch kaldırma, migration baseline (P3005) dokümante edildi.

Yeni bir “her şey 500” dalgası gelirse yine **Render Logs → ilk stack trace → tek düzeltme** döngüsünü uygula.
