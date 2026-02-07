# Smoke testleri nasıl yapılır?

Bu rehber, **4. API smoke testi** ve **5. Manuel test listesi**ni adım adım yapman içindir.

---

## 4. API smoke testini çalıştırma

1. **Terminali aç**, proje kök dizinine geç:
   ```bash
   cd /Users/burhanarikan/Desktop/k/odev-portali
   ```

2. **Render’daki API’ye karşı** test (backend Render’da deploy edildiyse):
   ```bash
   ./test-api-flows.sh https://odev-portali.onrender.com
   ```

3. **Kendi bilgisayarındaki backend’e karşı** test (aynı makinede backend çalışıyorsa):
   ```bash
   ./test-api-flows.sh
   ```
   veya açıkça:
   ```bash
   ./test-api-flows.sh http://localhost:5050
   ```

4. **jq yoksa** (script jq kullanıyor, macOS’ta):
   ```bash
   brew install jq
   ```

5. **Sonuç:** Her adımda `OK` yazıyorsa API smoke testleri geçti. `HATA` görürsen backend’in çalıştığından ve (local kullanıyorsan) veritabanı bağlantısından emin ol.

---

## 5. Manuel test listesi (tarayıcıda)

### Hazırlık

1. **Frontend’i başlat:** Proje kökünde:
   ```bash
   npm run dev
   ```
   veya sadece frontend: `cd frontend && npm run dev`

2. **Tarayıcıda aç:** Örneğin http://localhost:5173 (Vite varsayılan port) veya terminalde yazan adres.

3. **Giriş bilgileri (seed):**
   - Öğretmen: **elif.yilmaz@dilokulu.com** / **123456**
   - Öğretmen 2: **mehmet.kaya@dilokulu.com** / **123456**
   - Öğrenci: **ahmed.hassan.b1@email.com** / **123456**

### 7 maddeyi tek tek yap

| # | Ne yapacaksın | Nasıl yapacaksın |
|---|----------------|-------------------|
| **1** | Öğrenci → ödev listesi → teslim | Öğrenci ile giriş yap → Ödevler/Assignments’e git → Bir ödeve tıkla → Teslim et (metin yaz, gönder). |
| **2** | Öğretmen → ödev listesi → detay → taslak | Öğretmen (elif) ile giriş → Ödevler → Bir ödeve tıkla (detay açılır) → Taslaklar/Homeworks’ten bir taslağa tıkla. |
| **3** | Admin → tüm ödevler → analitik | *(Seed’de admin yok; bu maddeyi atlayabilir veya DB’de admin kullanıcı oluşturup dene.)* Admin ile giriş → Ödevler (hepsi görünmeli) → Analitik sayfası. |
| **4** | Öğrenciyken /teacher → yönlendirme | Öğrenci ile giriş → Adres çubuğuna `http://localhost:5173/teacher` (veya kullandığın port) yaz, Enter. Otomatik olarak öğrenci dashboard’a (`/dashboard/student`) dönmeli. |
| **5** | Öğretmenyken /portfolio → yönlendirme | Öğretmen ile giriş → Adres çubuğuna `/portfolio` veya öğrenci sayfası URL’i yaz, Enter. Öğretmen dashboard’a dönmeli. |
| **6** | Duyuru: yazar siler OK, başkası 403 | Öğretmen **elif** ile giriş → Duyurular → Yeni duyuru oluştur → Aynı duyuruyu sil (silinmeli). Çıkış yap → **mehmet** ile giriş → Elif’in duyurusunu silmeye çalış → 403 veya “yetkisiz” mesajı görmelisin. |
| **7** | Başka öğretmenin ödevi → 403 | Öğretmen **elif** ile giriş → Ödevler → Bir ödeve tıkla, detay sayfası açılsın → Adres çubuğundaki URL’i kopyala (içinde ödev ID’si var). Çıkış yap → **mehmet** ile giriş → Yapıştırıp aynı URL’i aç → 403 veya yetkisiz mesajı görmelisin. |

Hepsini yaptıysan manuel smoke listesini tamamlamış olursun.
