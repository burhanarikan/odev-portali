# Manuel test planı – tüm işlevler

Bu liste, uygulamanın ana akışlarını ve audit sonrası eklenen yetki kontrollerini tek tek test etmek içindir. Her maddeyi çalıştırıp ✅/❌ işaretleyebilirsiniz.

---

## Ön koşul

- Backend çalışıyor: `npm run dev:backend` (veya `cd backend && npm run dev`)
- Frontend çalışıyor: `npm run dev:frontend` (veya `cd frontend && npm run dev`)
- Next.js auth (varsa): `npm run dev:next`
- Veritabanı migrate/seed yapılmış; en az 1 admin, 1 öğretmen, 1 öğrenci, sınıf ve seviye var

---

## 1. Kimlik doğrulama

| # | Senaryo | Beklenen | ✅/❌ |
|---|---------|----------|-------|
| 1.1 | Geçerli e-posta/şifre ile STUDENT giriş | Giriş başarılı, öğrenci dashboard’a yönlendirilir | |
| 1.2 | Geçerli e-posta/şifre ile TEACHER giriş | Giriş başarılı, öğretmen dashboard’a yönlendirilir | |
| 1.3 | Geçerli e-posta/şifre ile ADMIN giriş | Giriş başarılı, öğretmen/admin dashboard’a yönlendirilir | |
| 1.4 | Yanlış şifre | Giriş reddedilir, hata mesajı | |
| 1.5 | Kayıt: STUDENT, geçerli classId | User + Student oluşur, giriş yapılır | |
| 1.6 | Kayıt: TEACHER | User + Teacher oluşur, giriş yapılır | |

---

## 2. Middleware – rol bazlı yönlendirme

| # | Senaryo | Beklenen | ✅/❌ |
|---|---------|----------|-------|
| 2.1 | STUDENT iken `/teacher` veya `/analytics` açılır | `/dashboard/student`’a yönlendirilir | |
| 2.2 | STUDENT iken `/submissions` açılır | `/dashboard/student`’a yönlendirilir | |
| 2.3 | TEACHER iken `/student` veya `/portfolio` açılır | `/dashboard/teacher`’a yönlendirilir | |
| 2.4 | TEACHER iken `/attendance/join` açılır | `/dashboard/teacher`’a yönlendirilir | |
| 2.5 | STUDENT iken `/attendance/join` açılır | Sayfa açılır (öğrenci yoklama katılımı) | |
| 2.6 | Giriş yokken korumalı path | Login sayfasına yönlendirilir | |

---

## 3. Öğrenci – ödevler ve teslim

| # | Senaryo | Beklenen | ✅/❌ |
|---|---------|----------|-------|
| 3.1 | Öğrenci ödev listesi | Sadece kendi seviye/hedefindeki ödevler görünür | |
| 3.2 | Öğrenci bir ödev detayı (kendine atanmış) | Detay açılır | |
| 3.3 | Öğrenci kendine atanmış ödeve teslim | Teslim başarılı | |
| 3.4 | Öğrenci kendine atanmamış / farklı seviye ödeve teslim (ID ile deneme) | 403 veya “Bu ödev sizin seviyenize ait değil” / “hedeflenmemiş” | |
| 3.5 | Aynı ödeve ikinci teslim | 409 veya “already submitted” | |
| 3.6 | Onay (consent) vermeden teslim | 403, onay istenir | |
| 3.7 | Teslimim / Değerlendirmelerim sayfaları | Sadece kendi teslimleri görünür | |

---

## 4. Öğretmen – ödevler ve taslaklar

| # | Senaryo | Beklenen | ✅/❌ |
|---|---------|----------|-------|
| 4.1 | Öğretmen ödev listesi | Sadece kendi oluşturduğu ödevler görünür | |
| 4.2 | Öğretmen kendi ödev detayı | Detay açılır | |
| 4.3 | Öğretmen başka öğretmenin ödev detayı (ID bilerek URL denemesi) | 403 Not authorized to view this assignment | |
| 4.4 | Öğretmen ödev oluşturma / güncelleme / silme | Başarılı (kendi ödevi) | |
| 4.5 | Taslak (homework) listesi | Sadece kendi taslakları | |
| 4.6 | Taslak detayı – kendi taslağı | Açılır | |
| 4.7 | Taslak detayı – başka öğretmenin taslağı (ID ile) | 403 Not authorized to view this homework | |
| 4.8 | Taslak oluşturma / güncelleme / silme | Kendi taslağında başarılı | |

---

## 5. Admin – ödevler ve taslaklar

| # | Senaryo | Beklenen | ✅/❌ |
|---|---------|----------|-------|
| 5.1 | Admin ödev listesi | Tüm öğretmenlerin ödevleri görünür | |
| 5.2 | Admin herhangi bir ödev detayı | Açılır | |
| 5.3 | Admin herhangi bir taslak detayı | Açılır | |

---

## 6. Duyurular

| # | Senaryo | Beklenen | ✅/❌ |
|---|---------|----------|-------|
| 6.1 | Duyuru listesi (giriş yapmış) | Tüm duyurular listelenir | |
| 6.2 | Öğretmen/Admin duyuru oluşturur | 201, duyuru oluşur | |
| 6.3 | Duyuru yazan öğretmen kendi duyurusunu siler | 204, silinir | |
| 6.4 | Admin başkasının duyurusunu siler | 204, silinir | |
| 6.5 | Öğretmen başka birinin duyurusunu silmeye çalışır | 403 Not authorized to delete | |

---

## 7. Analitik

| # | Senaryo | Beklenen | ✅/❌ |
|---|---------|----------|-------|
| 7.1 | TEACHER analitik sayfası / dashboard istatistikleri | Sayfa açılır, istatistikler gelir | |
| 7.2 | ADMIN analitik sayfası | Sayfa açılır, istatistikler gelir | |
| 7.3 | STUDENT analitik endpoint’ine erişim (API ile) | 403 Yetkisiz | |

---

## 8. Müdahale (intervention)

| # | Senaryo | Beklenen | ✅/❌ |
|---|---------|----------|-------|
| 8.1 | Öğretmen “riskli öğrenciler” listesi | Sadece kendi yoklama/ödev verdiği sınıf ve öğrencilerden riskliler | |
| 8.2 | Admin “riskli öğrenciler” | Tüm riskli öğrenciler | |
| 8.3 | Öğretmen müdahale logları | Sadece kendi kapsamındaki öğrencilerin logları | |
| 8.4 | Admin müdahale logları | Tüm loglar (veya filtreye göre) | |
| 8.5 | Öğretmen müdahale logu ekler (kapsamındaki öğrenci) | 201, log oluşur | |

---

## 9. Akran değerlendirme (peer review)

| # | Senaryo | Beklenen | ✅/❌ |
|---|---------|----------|-------|
| 9.1 | Öğrenci kendi teslimine gelen akran puanları | Listelenir | |
| 9.2 | Ödev sahibi öğretmen kendi ödevindeki bir teslime gelen akran puanları | Listelenir | |
| 9.3 | Başka öğretmen aynı teslimin akran puanlarını görmeye çalışır (API) | 403 Bu teslimin akran değerlendirmelerini görme yetkiniz yok | |

---

## 10. Yoklama (attendance)

| # | Senaryo | Beklenen | ✅/❌ |
|---|---------|----------|-------|
| 10.1 | Öğretmen yoklama başlatır | Oturum oluşur, kod gösterilir | |
| 10.2 | Öğrenci kendi sınıfının kodunu girerek katılır | Yoklamaya katıldınız | |
| 10.3 | Öğrenci başka sınıfın kodunu girer | WRONG_CLASS veya uygun hata | |

---

## 11. Zaman tüneli (timeline)

| # | Senaryo | Beklenen | ✅/❌ |
|---|---------|----------|-------|
| 11.1 | Öğrenci zaman tüneli | Kendi sınıfının postları | |
| 11.2 | Öğretmen post oluşturur | Post oluşur | |
| 11.3 | Öğretmen kendi postunu siler | Silinir | |

---

## 12. Öğretmen wiki / kaynaklar

| # | Senaryo | Beklenen | ✅/❌ |
|---|---------|----------|-------|
| 12.1 | Wiki sayfa listesi / detay | Açılır | |
| 12.2 | Öğretmen kendi wiki sayfasını düzenler / siler | Başarılı | |
| 12.3 | Öğretmen kaynak oluşturur / kendi kaynağını siler | Başarılı | |

---

## 13. Telafi (makeup)

| # | Senaryo | Beklenen | ✅/❌ |
|---|---------|----------|-------|
| 13.1 | Öğrenci kendi sınıfına ait slot listesi / randevu alır | Listelenir, randevu alınır | |
| 13.2 | Öğrenci başka sınıfın slotuna randevu almaya çalışır | 403 Bu slot sizin sınıfınıza ait değil | |

---

## 14. Hata bankası (error bank)

| # | Senaryo | Beklenen | ✅/❌ |
|---|---------|----------|-------|
| 14.1 | Öğrenci “Dikkat etmem gerekenler” | Kendi hata listesi | |
| 14.2 | Öğretmen öğrenci hata listesi görür | API çağrısı (yetki serviste geniş; davranışı not alın) | |

---

## Otomatik testleri çalıştırma

```bash
# Backend birim/entegrasyon testleri
cd backend && npm run test

# Frontend testleri
cd frontend && npm run test

# Kökten her ikisi
npm run test
```

---

## API smoke script (otomatik)

Backend çalışırken (ve seed verisi varsa) kök dizinde: `./test-api-flows.sh` veya `./test-api-flows.sh https://odev-portali.onrender.com`. Öğretmen/öğrenci girişi, ödev/taslak listesi, analitik, 403 kontrolü.

---

## Kısa “smoke” listesi (en az bunları çalıştırın)

1. STUDENT ile giriş → ödev listesi → kendi ödevine teslim.
2. TEACHER ile giriş → ödev listesi (sadece kendi) → bir ödev detayı → taslak detayı.
3. ADMIN ile giriş → ödev listesi (tümü) → analitik sayfası.
4. STUDENT iken `/teacher` → `/dashboard/student`’a yönlendirme.
5. TEACHER iken `/portfolio` → `/dashboard/teacher`’a yönlendirme.
6. Duyuru silme: yazar silebilir, başka öğretmen 403.
7. Öğretmen başka öğretmenin ödev detayı (URL ile) → 403.

Bu planı `docs/TEST-PLAN.md` olarak kaydettim. İsterseniz önce otomatik testleri çalıştıralım, sonra bu listeyi tarayıcıda tek tek deneyebilirsiniz.
