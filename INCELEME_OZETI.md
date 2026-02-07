# Öğrenci & Öğretmen Sayfaları İnceleme Özeti

Kod tarafında yapılan kontrol ve düzeltmeler.

---

## API ↔ Backend Uyumu

- **Öğrenci:** `/api/student/assignments`, `consent`, `portfolio`, `evaluations`, `missed-sessions`, `makeup-slots`, `makeup-bookings` — backend route’lar ile eşleşiyor.
- **Öğretmen:** `/api/teacher/assignments`, `students`, `submissions`, `levels`, `homeworks`, `makeup-slots` — eşleşiyor.
- **Ortak:** `/api/peer-review/my-received-reviews`, `/api/timeline/my`, `/api/error-bank/my`, `/api/error-bank/my/review-list`, `/api/announcements` — backend path’leri ile uyumlu.

---

## Yapılan Düzeltmeler

### 1. Hata mesajlarının kullanıcıya gösterilmesi

API’den dönen hata mesajı (ör. 429 “Çok fazla istek…”) artık ekranda gösteriliyor:

- **StudentDashboard** — Ödevler yüklenirken hata → `error.message` gösteriliyor.
- **TeacherDashboard** — Aynı şekilde `error.message` gösteriliyor.
- **EvaluationsPage** — Değerlendirmeler hatası → mesaj + “Sayfayı yenileyip tekrar deneyin.”
- **PortfolioPage** — Portfolyo hatası → mesaj gösteriliyor.
- **ErrorBankPage** — Hata bankası yüklenemezse ayrı hata kartı ve mesaj.
- **TimelinePage** — Zaman tüneli (öğrenci/öğretmen) hata durumunda mesaj.
- **MakeUpPage** — Telafi / kaçırılan dersler veya randevular hata verirse mesaj.
- **AnnouncementsPage** — Duyurular yüklenemezse mesaj.

### 2. Öğrenci “Ana Sayfa” linki

- **EvaluationsPage** — “Ana Sayfaya Dön” butonu `/dashboard` yerine **`/student`** olacak şekilde güncellendi (öğrenci her zaman kendi ana sayfasına döner).

### 3. Hata durumunda yönlendirme metni

Tüm bu sayfalarda hata olduğunda “Sayfayı yenileyip tekrar deneyin.” metni eklendi; 429 veya 503 gibi durumlarda kullanıcı ne yapacağını biliyor.

---

## Sizin Kontrol Etmeniz Gerekenler

1. **Backend canlıda çalışıyor mu?**  
   Render’da servis ayakta olmalı; migration’lar çalıştırılmış olmalı (`RENDER_ADIMLAR.md`).

2. **429 (rate limit)**  
   Hâlâ 429 alıyorsanız Render Environment’a `RATE_LIMIT_MAX=800` veya `1000` ekleyin.

3. **503 / 500**  
   Render free tier’da ilk istekte cold start 503 verebilir. Migration yapılmadıysa 500/503 devam eder; Render **Logs** ile gerçek hata mesajını kontrol edin.

4. **Manuel test**  
   - Öğrenci: Giriş → Ana sayfa, Ödevler, Değerlendirmelerim, Öğrenim Yolculuğum, Akran Değerlendirme, Hata Bankası, Zaman Tüneli, Telafi, Duyurular.  
   - Öğretmen: Giriş → Ana sayfa, Ödev oluştur, Öğrenciler, Teslimler, Yoklama, Duyurular, Zaman Tüneli, Analitik.

---

## Özet

- API path’leri backend ile uyumlu.
- Tüm ilgili sayfalarda hata durumu ve **sunucudan gelen hata mesajı** gösteriliyor.
- Öğrenci “Ana Sayfaya Dön” linki `/student` olacak şekilde düzeltildi.
- 429/503 gibi durumlarda kullanıcıya “Sayfayı yenileyip tekrar deneyin.” bilgisi veriliyor.

Canlıda sorun devam ederse Render **Logs** ve tarayıcı **Network** sekmesindeki yanıt body’sine bakarak hatayı netleştirebilirsiniz.
