# Demo Seed – B1 Aktif Dil Okulu Simülasyonu

Bu seed, **A1/A2 tamamlanmış, B1 aktif** bir dil okulu görüntüsü oluşturur. Zaman tüneli, duyurular, ödevler, teslimler, yoklama ve müdahale kayıtları 20+ haftalık geçmişle doldurulur.

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
- **Öğrenciler:** Ağırlık Afrika (Nijerya, Gana, Kenya, Sudan, Somali vb.), az sayıda Türkmenistan/Kazakistan, AB/Amerika/Asya; isim–ülke uyumlu
- **Ödevler:** B1 için 21 haftalık ödev (geçmiş + güncel)
- **Teslimler:** Öğrencilerin ~%70–90’ı teslim etmiş; bir kısmı gecikmeli
- **Değerlendirmeler:** Sınav puanları 45–95 arası dağılım
- **Hata bankası:** Öğrencilerin bir kısmında grammar/vocabulary kayıtları
- **Duyurular:** 22 duyuru, PDG ve öğretmenler
- **Zaman tüneli:** 22 hafta × 2 sınıf = 44 paylaşım
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
