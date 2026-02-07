# Demo Seed – B1 Aktif Dil Okulu Simülasyonu

Bu seed, **A1/A2 tamamlanmış, B1 aktif** bir dil okulu görüntüsü oluşturur:

- **Geçmiş kurlar:** A1 ve A2 seviyelerinde 10’ar haftalık ödev (geçmiş tarihli).
- **B1:** 21 haftalık ödev + teslimler + değerlendirmeler.
- **Zaman tüneli:** 30 hafta × 2 sınıf = 60 paylaşım.
- **Duyurular, yoklama, müdahale, hata bankası** doldurulur.

**Production’da zaman tüneli / duyurular / ödev listesi dolu görünsün istiyorsanız:** Seed’i **production DATABASE_URL** ile (Neon’a bağlanarak) **bir kez** çalıştırın. Tablolar `production-fix-all.sql` ile oluşturulduktan sonra `npx prisma db seed` production veritabanını doldurur.

## Çalıştırma

1. **`backend/.env`** dosyasında **DATABASE_URL** tanımlı olmalı (ör. `.env.example` kopyalayıp düzenleyin).
2. Terminalde:

```bash
cd backend
npx prisma db push    # gerekirse şemayı uygula
npx prisma db seed    # demo verileri doldurur
```

Veya doğrudan: `tsx prisma/seed.ts` (seed, `.env` dosyasını otomatik yükler).

## Sabit Demo Hesaplar (şifre: **türkçe**)

| Rol      | E-posta                  | Açıklama              |
|----------|--------------------------|------------------------|
| Müdür Yrd. | `pdg@isubudilmer.com`  | Derse girmeyen, duyuru/yönetim |
| Öğretmen | `eva@isubudilmer.com`   | Sabit test öğretmeni  |
| Öğrenci  | `ogrenci@isubudilmer.com` | Test öğrenci; öğrenci paneli denemek için |

Diğer öğretmen ve öğrenciler: **şifre `123456`**. Öğrenci e-postaları `isim.soyad.1@isubudilmer.com` formatında (örn. `chukwuemeka.okonkwo.1@isubudilmer.com`).

## Seed İçeriği

- **Seviyeler:** A1, A2, B1
- **Sınıflar:** A101, A102 (B1); sınıf başına ~25 öğrenci
- **Personel:** 1 admin (PDG) + 6 öğretmen (Eva dahil)
- **Öğrenciler:** Ağırlık Afrika, az Türkmenistan/Kazakistan, AB/Amerika/Asya; isim–ülke uyumlu
- **Ödevler:** A1 (10 hafta, geçmiş), A2 (10 hafta, geçmiş), B1 (21 hafta, geçmiş + güncel)
- **Teslimler:** B1 ödevleri için öğrencilerin ~%70–90’ı teslim etmiş; bir kısmı gecikmeli
- **Değerlendirmeler:** Sınav puanları 45–95 arası dağılım
- **Hata bankası:** Öğrencilerin bir kısmında grammar/vocabulary kayıtları
- **Duyurular:** 22 duyuru, PDG ve öğretmenler
- **Zaman tüneli:** 30 hafta × 2 sınıf = 60 paylaşım
- **Yoklama:** Haftalık oturumlar, öğrencilerin ~%75–95’i katılmış
- **Müdahale logları:** Devamsızlık / ödev eksikliği / akademik risk
- **Beceri puanları:** vocabulary, grammar, listening, speaking (50–95)

## Tekrar Çalıştırma

Seed tekrar çalıştırıldığında:

- Kullanıcılar ve sınıflar `upsert` ile güncellenir (şifreler ve sınıf atamaları güncellenir).
- Ödev/teslim/değerlendirme/duyuru/timeline/yoklama/müdahale/hata bankası: yalnızca **yeni** kayıtlar eklenir; mevcut kayıtlar silinmez (idempotent davranış).

Tamamen sıfırdan doldurmak için önce veritabanını sıfırlayıp sonra seed çalıştırın:

```bash
npx prisma migrate reset --force   # tüm veriyi siler, migration + seed çalışır
```
