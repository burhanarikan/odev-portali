# Sessiz hata senaryoları: `middleware.ts`

Exception atılmadan yanlış davranılabilecek (silent failure) durumlar. Her madde: senaryo, ne olur, neden fark edilmez.

---

## 1. NEXTAUTH_SECRET tanımsız veya yanlış

- **Senaryo:** Ortamda `NEXTAUTH_SECRET` yok veya farklı bir değer (ör. deploy’da yanlış env).
- **Ne olur:** `getToken` JWT’yi doğrulayamaz; genelde `null` döner. Tüm istekler “giriş yapmamış” gibi işlenir; korumalı path’lere gidenler login’e yönlendirilir, giriş yapmış kullanıcılar bile.
- **Neden fark edilmez:** Hiç exception yok. Kullanıcı sürekli login’e atılıyor gibi görünür; hata log’da görünmez, sorun “auth bozuldu” veya “cookie sorunu” sanılabilir.

---

## 2. Token var ama role yok veya farklı formatta

- **Senaryo:** JWT’de `role` alanı yok, null veya backend farklı yazıyor (ör. `"Student"`, `"student"`).
- **Ne olur:** `role === 'STUDENT'` vb. hiçbiri true olmaz. Root (`/`) isteğinde 51–52’de `/dashboard/teacher`’a gider. `/dashboard` isteğinde 41–44’te hiçbir dal girmez, `next()` ile dashboard’a geçer; rol kontrolü sayfa/layout’a kalır.
- **Neden fark edilmez:** Exception yok. Yanlış role’e teacher dashboard’u açılır veya rol kontrolü yoksa yanlış içerik görülür; middleware “çalıştı” gibi görünür.

---

## 3. getToken hata verirse (cookie bozuk, süre dolmuş, imza hatalı)

- **Senaryo:** Cookie bozuldu, token süresi doldu veya secret değişti.
- **Ne olur:** `getToken` exception atmak yerine genelde `null` döner. Kullanıcı giriş yapmamış sayılır; korumalı path’lere gidince login’e atılır.
- **Neden fark edilmez:** Gerçek sebep (config, süre, cookie) log’da görünmez. “Çıkış oldu” veya “session bitti” sanılır; altyapı hatası ayırt edilemez.

---

## 4. Yeni korumalı route eklenir, protectedPaths güncellenmez

- **Senaryo:** Uygulamada yeni bir path (ör. `/reports`) korumalı olarak açılır ama `protectedPaths` listesine eklenmez.
- **Ne olur:** `isProtected('/reports')` false, middleware `next()` döner; giriş yapmamış kullanıcı sayfaya erişir.
- **Neden fark edilmez:** Exception yok, sayfa yüklenir. Güvenlik açığı test veya şikayet olmadan fark edilmeyebilir.

---

## 5. Büyük/küçük harf veya trailing slash farkı

- **Senaryo:** İstek `/Dashboard`, `/DASHBOARD` veya başka casing ile gelir; veya uygulama path’i farklı normalize eder.
- **Ne olur:** `pathname === '/dashboard'` ve `pathname.startsWith('/dashboard/')` eşleşmez; path korumasız sayılır, `next()` ile geçer.
- **Neden fark edilmez:** Middleware sessizce geçer, sayfa açılır. Casing’e duyarlı koruma unutulduğu için testlerde fark edilmeyebilir.

---

## 6. Bilinmeyen rol ile /dashboard isteği

- **Senaryo:** Token’da rol `STUDENT`/`TEACHER`/`ADMIN` dışında (veya undefined).
- **Ne olur:** `pathname === '/dashboard'` (veya `/dashboard/`) iken 41–44’teki hiçbir if girmez; blok biter, 57’de `next()`. Kullanıcı `/dashboard` sayfasına düşer; rol kontrolü orada yoksa yanlış veya bozuk arayüz görür.
- **Neden fark edilmez:** Exception yok. Root’ta bilinmeyen rol teacher’a gidiyor, dashboard’da ise hiç yönlendirme yok; tutarsızlık “bazen böyle çalışıyor” diye kabul edilebilir.

---

## 7. callbackUrl ile hatalı veya artık olmayan path

- **Senaryo:** Korumalı bir path’e gidip login’e atılan kullanıcıya `callbackUrl` olarak o path yazılıyor (örn. typo, artık kaldırılmış path).
- **Ne olur:** Giriş sonrası kullanıcı o URL’e yönlendirilir; 404 veya hatalı sayfa açılır.
- **Neden fark edilmez:** Middleware sadece `pathname`’i query’e yazar; URL’in geçerliliğini kontrol etmez. Hata login akışında veya “sayfa bulunamadı” olarak görülür, sebep middleware’e bağlanmaz.

---

## 8. Hedef route’lar kaldırıldı veya taşındı

- **Senaryo:** `/login`, `/dashboard/student` veya `/dashboard/teacher` kaldırıldı veya path değişti.
- **Ne olur:** Redirect’ler aynı URL’lere gider; 404 veya Next.js hata sayfası.
- **Neden fark edilmez:** Middleware redirect’i “başarıyla” döndürür; asıl hata hedef sayfada. Log’da middleware hatası görünmez, sorun route tarafında sanılır.

---

## 9. Matcher’ın yanlışlıkla dışarıda bıraktığı path

- **Senaryo:** Yeni bir public path (örn. `/terms`) eklenir; matcher regex’i onu da middleware’e sokacak şekilde kalır veya yeni bir korumalı path matcher dışında kalır (regex’te typo).
- **Ne olur:** Gereksiz yere middleware’den geçer (performans) veya korumalı path middleware’e hiç gelmez ve korunmaz.
- **Neden fark edilmez:** Exception yok. Davranış “bazen yavaş” veya tek bir path’in açık kalması şeklinde ortaya çıkar; matcher nadiren gözden geçirilir.

---

## 10. Token’da role yazım hatası (backend)

- **Senaryo:** Backend JWT’de `"student"` veya `"Teacher"` gibi farklı casing gönderiyor.
- **Ne olur:** `role === 'STUDENT'` vb. hep false; bilinmeyen rol gibi işlenir (root’ta teacher’a, dashboard’da yönlendirmesiz).
- **Neden fark edilmez:** Backend “role gönderiyoruz” der, frontend’de sayfa açılır; casing sözleşmesi dokümante değilse sessizce yanlış yönlendirme kalır.

---

## auth login

**Dosya:** `app/api/auth/[...nextauth]/route.ts` ve bu route üzerinden çalışan auth akışı (`lib/auth`). Exception atılmadan yanlış davranılabilecek durumlar.

---

### 1. Backend login 4xx/5xx döndüğünde

- **Senaryo:** Backend `POST .../api/auth/login` 401, 500, 502 veya başka bir non-2xx döner.
- **Ne olur:** `authorize` içinde `if (!res.ok) return null`; NextAuth girişi reddeder, kullanıcıya genel "geçersiz kimlik bilgisi" benzeri mesaj gösterilir.
- **Neden fark edilmez:** Exception atılmaz. Gerçek sebep (sunucu hatası, bakım, ağ) kullanıcıya ve çoğu zaman log'a yansımaz; "şifre yanlış" sanılır.

---

### 2. Backend 200 döndü ama body eksik/yanlış formatta

- **Senaryo:** Backend 200 döner ama `user` veya `token` yok (örn. `{}` veya `{ message: 'ok' }`).
- **Ne olur:** `authorize` içinde `if (!user || !token) return null`; giriş reddedilir.
- **Neden fark edilmez:** Hata fırlatılmaz. "Giriş başarısız" görünür; API sözleşmesi değiştiği veya farklı endpoint yanıt verdiği anlaşılmaz.

---

### 3. Backend user.role eksik veya farklı formatta

- **Senaryo:** Backend `user.role` döndürmüyor, null gönderiyor veya farklı casing (örn. `"Student"`).
- **Ne olur:** `authorize` yine user döndürür; jwt callback `token.role = user.role` ile (undefined veya yanlış string) yazar. Oturum "başarıyla" kurulur ama middleware/client'ta rol eşleşmez; yanlış yönlendirme veya yetkisiz erişim.
- **Neden fark edilmez:** Hiç exception yok. Giriş ekranı kapanır; rol hatası ancak sayfa içi davranışla (yanlış sayfa, yetki hatası) fark edilir.

---

### 4. NEXTAUTH_SECRET tanımsız

- **Senaryo:** Ortamda `NEXTAUTH_SECRET` yok; `authOptions.secret` undefined.
- **Ne olur:** NextAuth JWT imzalayamaz veya doğrulayamaz; cookie geçersiz/okunamaz olabilir. Kullanıcı "giriş yaptı" görünür ama sonraki istekte oturum yok sayılır.
- **Neden fark edilmez:** Giriş isteği 200 dönebilir; hata cookie/sonraki sayfa isteğinde ortaya çıkar. Log'da "secret yok" görünmeyebilir.

---

### 5. Backend URL yanlış veya tanımsız

- **Senaryo:** `NEXT_PUBLIC_API_URL` / `VITE_API_URL` yanlış, farklı ortama ait veya tanımsız (fallback localhost).
- **Ne olur:** Login isteği yanlış sunucuya gider. O sunucu 200 + sahte user dönerse "giriş" olur (güvenlik); 404/connection error dönerse giriş hep başarısız.
- **Neden fark edilmez:** Route dosyası env'i doğrulamaz. Hata "giriş çalışmıyor" veya yanlış veriyle giriş olarak kalır; URL kaynaklı olduğu anlaşılmaz.

---

### 6. Backend erişilemez (timeout / ağ hatası)

- **Senaryo:** Backend kapalı, ağ kesintisi veya çok yavaş; fetch hata döner veya timeout olur.
- **Ne olur:** Fetch exception atarsa NextAuth içinde yakalanıp "giriş başarısız"a dönüşebilir; veya `res` alınamaz, `!res.ok` veya benzeri ile null dönülür. Kullanıcı hep giriş yapamıyormuş gibi görünür.
- **Neden fark edilmez:** "Kimlik bilgisi hatalı" veya genel hata mesajı; backend'e ulaşılamadığı log'da net olmayabilir.

---

### 7. İki farklı API URL env'i (NEXT_PUBLIC vs VITE)

- **Senaryo:** `NEXT_PUBLIC_API_URL` ve `VITE_API_URL` farklı ortamlarda farklı set (biri frontend, biri build); `lib/auth` server'da birini kullanıyor, beklenen backend değil.
- **Ne olur:** Login isteği yanlış base URL'e gider; giriş başarısız veya yanlış backend'e gidilir.
- **Neden fark edilmez:** Kodda sadece `process.env... || ...` var; hangi ortamda hangisinin kullanıldığı karışabilir, sessizce yanlış hedefe istek atılır.

---

### 8. signIn sayfası (/login) kaldırıldı

- **Senaryo:** `authOptions.pages.signIn` hâlâ `/login` ama bu route artık yok.
- **Ne olur:** NextAuth kullanıcıyı giriş için `/login`'e yönlendirir; 404 açılır. NextAuth exception atmaz.
- **Neden fark edilmez:** Auth API "doğru" yanıt veriyor (redirect); hata hedef sayfada, kullanıcı "site bozuk" görür, sebep auth config'e bağlanmaz.

---

### 9. res.json() başarılı ama role/alanlar yanlış tip

- **Senaryo:** Backend `role` sayı veya başka tip döndürüyor; veya `user.id` yok.
- **Ne olur:** jwt callback bu değeri token'a yazar; session'da string bekleyen client/middleware yanlış değer görür. Type assertion yüzünden runtime'da exception olmayabilir; yönlendirme/ yetki bozulur.
- **Neden fark edilmez:** Giriş "başarılı"; hata ancak belirli sayfalarda veya middleware kararlarında ortaya çıkar.

---

### 10. authorize içinde fetch hata fırlatırsa

- **Senaryo:** `fetch` (ağ hatası, DNS) exception fırlatır; `authorize` içinde try/catch yok.
- **Ne olur:** Exception NextAuth tarafından yakalanır; kullanıcıya genel hata sayfası veya mesajı gider. Detay (network, backend down) kullanıcıya gösterilmez.
- **Neden fark edilmez:** "Bir hata oluştu" benzeri mesaj; gerçek sebep log'da veya monitoring'de aranmazsa sessiz kalır.

---

## lib/auth

**Dosya:** `lib/auth.ts`. Exception atılmadan yanlış davranılabilecek (silent failure) durumlar.

---

### 1. Backend 200 döndü ama user.role eksik veya farklı formatta

- **Senaryo:** Backend cevabında `user` var ama `user.role` yok, null, boş string veya farklı casing (örn. "Student").
- **Ne olur:** authorize user döndürür; jwt callback `token.role = user.role` ile undefined/yanlış değeri yazar; session callback aynen session'a kopyalar. Giriş "başarılı" sayılır; middleware ve client rol karşılaştırması (STUDENT/TEACHER/ADMIN) eşleşmez, yanlış yönlendirme veya yetkisiz içerik görünür.
- **Neden kolay fark edilmez:** Hiç exception atılmaz. Giriş ekranı kapanır; hata ancak belirli sayfalarda veya rol bazlı davranışta ortaya çıkar; kaynak "backend role" olarak hemen düşünülmeyebilir.

---

### 2. Backend 200 döndü ama user.id veya user.name eksik

- **Senaryo:** Backend `user` döndürüyor ama `id` veya `name` alanı yok veya null.
- **Ne olur:** authorize yine `{ id: user.id, name: user.name, ... }` ile nesne döndürür; undefined değerler JWT'ye ve session'a yazılır. Client veya API çağrıları `session.user.id` kullanıyorsa boş/undefined görür; bazı sayfalar veya istekler hata verebilir veya yanlış çalışır.
- **Neden kolay fark edilmez:** Giriş başarılı görünür; hata "bu sayfada bazen çalışmıyor" veya "kullanıcı bilgisi gelmiyor" şeklinde görülür; authorize/session akışına bağlanmaz.

---

### 3. NEXTAUTH_SECRET tanımsız

- **Senaryo:** Ortamda NEXTAUTH_SECRET yok; authOptions.secret undefined.
- **Ne olur:** NextAuth JWT'yi düzgün imzalayamaz veya doğrulayamaz; giriş sonrası cookie geçersiz olabilir veya sonraki istekte session boş döner. Kullanıcı "giriş yaptım" görür, sayfa yenilenince veya başka istekte oturum yok sayılır.
- **Neden kolay fark edilmez:** Giriş isteği 200 dönebilir; exception olmaz. Sorun "çıkış oldu" veya "cookie tutmuyor" gibi yorumlanır; secret eksikliği log'da görünmeyebilir.

---

### 4. Backend URL yanlış (ortam değişkeni)

- **Senaryo:** NEXT_PUBLIC_API_URL veya VITE_API_URL yanlış, farklı ortama ait veya tanımsız (fallback localhost kalır).
- **Ne olur:** fetch yanlış host'a gider. O sunucu 200 + sahte user dönerse oturum yanlış kimlikle açılır; 404/5xx dönerse authorize null, giriş hep başarısız görünür.
- **Neden kolay fark edilmez:** Kodda URL kontrolü yok; "giriş çalışmıyor" veya "yanlış kullanıcı bilgisi" sanılır, sebep ortam değişkeni olarak aranmaz.

---

### 5. Backend 4xx/5xx döndüğünde

- **Senaryo:** Backend 401, 500, 502 vb. döner; res.ok false.
- **Ne olur:** authorize null döner; NextAuth girişi reddeder. Kullanıcıya genel "kimlik bilgisi hatalı" benzeri mesaj gider; HTTP status veya body'deki hata mesajı kullanıcıya yansımaz.
- **Neden kolay fark edilmez:** Exception atılmaz. Gerçek sebep (sunucu hatası, bakım, rate limit) log'da veya network tab'da aranmazsa "şifre yanlış" sanılır.

---

### 6. Backend 200 ama body'de user veya token yok

- **Senaryo:** Cevap 200 ama `data.user` veya `data.token` yok (örn. body `{ message: "ok" }`).
- **Ne olur:** if (!user || !token) return null; giriş reddedilir. Kullanıcı "giriş başarısız" görür; API sözleşmesi değiştiği veya farklı endpoint yanıt verdiği anlaşılmaz.
- **Neden kolay fark edilmez:** Hata fırlatılmaz; backend tarafında değişiklik yapıldığı düşünülmez, sorun frontend/auth tarafında aranır.

---

### 7. İki farklı API URL env'i (NEXT_PUBLIC vs VITE)

- **Senaryo:** NEXT_PUBLIC_API_URL ve VITE_API_URL farklı set; server tarafında birinin kullanılması yanlış backend'e istek atılmasına neden oluyor.
- **Ne olur:** Login isteği yanlış sunucuya gider; giriş başarısız veya yanlış ortamın kullanıcı verisi ile oturum açılır.
- **Neden kolay fark edilmez:** process.env... || ... ile hangi değerin kullanıldığı net değil; ortamlar karıştığında sessizce yanlış hedefe istek atılır.

---

### 8. Eski veya bozuk token'da role/id yok

- **Senaryo:** Cookie'deki JWT eski bir sürümden (role eklenmeden önce) veya başka sebeple token.role / token.id içermiyor.
- **Ne olur:** session callback `session.user.role = token.role` ile undefined atar; client ve middleware session.user.role undefined görür, rol bazlı mantık çalışmaz (yanlış yönlendirme veya "yetkisiz" davranış).
- **Neden kolay fark edilmez:** Exception yok; session nesnesi döner, sadece role/id eksiktir. Hata "bazen rol gelmiyor" veya "bu kullanıcıda çalışmıyor" şeklinde görülür.

---

### 9. session callback'te session.user yok

- **Senaryo:** NextAuth session callback'i çağırırken session.user undefined (edge case veya sürüm farkı).
- **Ne olur:** if (session.user) girilmez; session.user.role ve session.user.id atanmaz; session yine döndürülür. Client session alır ama user.role / user.id yok; rol bazlı UI veya middleware bozulur.
- **Neden kolay fark edilmez:** Kod "session.user varsa ata" diye savunmacı yazılmış; session.user'ın bazen gelmemesi nadir görülür, testte çıkmayabilir.

---

### 10. Backend role'ü sayı veya object döndürüyor

- **Senaryo:** Backend user.role'ü number (örn. 1) veya object döndürüyor; JSON geçerli, authorize user döndürür.
- **Ne olur:** jwt callback token.role'e bu değeri yazar; session callback `token.role as string` ile session'a kopyalar. Middleware role === 'STUDENT' gibi karşılaştırmalar hep false kalır; yönlendirme veya yetki yanlış çalışır.
- **Neden kolay fark edilmez:** Type assertion yüzünden runtime'da exception olmayabilir; giriş "başarılı", hata sadece rol kullanılan yerlerde ortaya çıkar.

---

### 11. signIn sayfası (/login) artık yok

- **Senaryo:** authOptions.pages.signIn hâlâ '/login'; uygulamada bu route kaldırıldı veya taşındı.
- **Ne olur:** NextAuth kullanıcıyı giriş için /login'e yönlendirir; 404 veya yanlış sayfa açılır. Auth akışı "doğru" yanıt veriyor (redirect) gibi görünür.
- **Neden kolay fark edilmez:** Hata hedef sayfada; lib/auth'taki signIn path'i güncellenmediği için sebep config'te aranmaz.

---

### 12. res.json() geçerli JSON döndürüyor ama alan adları farklı

- **Senaryo:** Backend 200 ve geçerli JSON döndürüyor ama alan adları değişmiş (örn. user -> data, role -> userRole).
- **Ne olur:** data.user undefined olabilir; authorize null döner. Veya data.user var ama data.user.role yok; user.role undefined token'a ve session'a yazılır. Giriş reddedilir veya eksik rol ile oturum oluşur.
- **Neden kolay fark edilmez:** Exception atılmaz; API sözleşmesi değişikliği dokümante edilmediyse "neden artık çalışmıyor" sorusu backend cevap formatına yönlendirilmez.

---

## service: auth.service

**Dosya:** `backend/src/services/auth.service.ts`

### 1. STUDENT kaydı sınıf yokken

- **Senaryo:** Hiç Class kaydı yokken role STUDENT ile register çağrılır; classId da verilmemiş.
- **Ne yanlış gider:** findFirst() null döner, Student kaydı oluşturulmaz; buna rağmen register 200 döner, user + token döndürülür. Kullanıcı "öğrenci olarak kaydoldum" sanır.
- **Neden kolay fark edilmez:** Exception yok; hata ancak öğrenci sayfalarına (ödev listesi vb.) girildiğinde "Student not found" 404 ile ortaya çıkar; kayıt anındaki eksiklik akla gelmeyebilir.

### 2. ADMIN ile kayıt

- **Senaryo:** role ADMIN ile register yapılır (validatör izin veriyorsa veya API doğrudan kullanılıyorsa).
- **Ne yanlış gider:** User oluşur, Student/Teacher kaydı oluşturulmaz; yine 200 + user + token döner. getProfile teacher ve student null döner; öğretmen/öğrenci ekranları 404 veya boş veri verir.
- **Neden kolay fark edilmez:** Kayıt "başarılı" görünür; rol bazlı sayfalarda "kayıt yok" hatası ayrı bir sebep gibi yorumlanır, register'ın ADMIN'i desteklememesi düşünülmeyebilir.

### 3. findFirst() ile "ilk sınıf" seçimi

- **Senaryo:** classId verilmeden STUDENT kaydı yapılır; DB'de birden fazla sınıf var, findFirst() orderBy olmadan çağrılıyor.
- **Ne yanlış gider:** Hangi sınıfın seçileceği belirsiz; farklı ortam veya veri sırasında aynı işlem farklı sınıfa atanabilir.
- **Neden kolay fark edilmez:** Hata fırlatılmaz; öğrenci yanlış sınıfta görünür, ödev/yoklama listesi yanlış sınıfa göre gelir; "veri karışıklığı" veya "sınıf ataması hatası" olarak yorumlanır.

---

## service: student.service

**Dosya:** `backend/src/services/student.service.ts`

### 1. submitAssignment: ödev hedefi kontrolü yok

- **Senaryo:** Öğrenci, kendi seviyesi/hedefi dışındaki bir ödevin assignmentId'si ile submitAssignment çağırır (örn. ID tahmin veya eski link).
- **Ne yanlış gider:** Servis assignment'ı sadece id ile bulur; seviye veya hedef eşleşmesi kontrol edilmez. Teslim oluşturulur, 200 döner.
- **Neden kolay fark edilmez:** Exception yok; yetkisiz ödev teslimi "başarılı" sayılır; öğretmen listesinde yanlış ödevin altında teslim görünür, neden orada olduğu anlaşılmayabilir.

### 2. Boş ödev listesi

- **Senaryo:** Öğrencinin sınıfı/seviyesi doğru ama ödev sorgusu (levelId, targets, isDraft) nedeniyle hiç ödev dönmez; veya veri tutarsızlığı (örn. levelId yanlış) yüzünden liste boş kalır.
- **Ne yanlış gider:** getStudentAssignments boş active/upcoming/past döner; kullanıcı "ödev yok" görür.
- **Neden kolay fark edilmez:** Hata atılmaz; gerçekte ödev olup olmadığı ile "sorgu koşulları yüzünden gelmedi" ayrımı yapılamaz; yanlış konfigürasyon veya veri sessizce boş liste üretir.

---

## service: assignment.service

**Dosya:** `backend/src/services/assignment.service.ts`

### 1. similarAssignments hep boş dönüyor

- **Senaryo:** createAssignment çağrılır; aynı öğretmenin benzer başlıkta/içerikte ödevi aslında var.
- **Ne yanlış gider:** Servis similarAssignments: [] sabit döndürür; benzerlik kontrolü create akışında kullanılmıyor. İstemci "benzer ödev yok" sanır, çift ödev oluşur.
- **Neden kolay fark edilmez:** İstek başarılı; uyarı veya engel olmadığı için çift ödev ancak manuel incelemede fark edilir.

### 2. getAssignments(undefined) tüm ödevleri döndürür

- **Senaryo:** getAssignments(teacherUserId) çağrılırken teacherUserId yanlışlıkla undefined geçer (controller'da yetki/parametre hatası).
- **Ne yanlış gider:** where: {} ile tüm ödevler listelenir; sadece kendi ödevlerini görmesi gereken öğretmen herkesin ödevini görür.
- **Neden kolay fark edilmez:** Exception yok; yanıt "başarılı" ve büyük liste döner; yetki sızıntısı fark edilmeyebilir.

---

## service: announcement.service

**Dosya:** `backend/src/services/announcement.service.ts`

### 1. Boş title/body ile create

- **Senaryo:** create(title, body, authorId) boş string veya sadece boşluk ile çağrılır.
- **Ne yanlış gider:** Duyuru yine oluşturulur; title/body boş veya anlamsız kayıt DB'de kalır.
- **Neden kolay fark edilmez:** Hata fırlatılmaz; liste sayfasında boş/garip duyuru görünür, "kim boş duyuru açtı" sorusu validasyon eksikliğine bağlanmayabilir.

### 2. list(limit) üst sınırı yok

- **Senaryo:** list(1000000) gibi aşırı limit ile çağrılır.
- **Ne yanlış gider:** take: limit ile çok sayıda kayıt çekilir; yanıt çok büyür, zaman aşımı veya bellek sorunu oluşabilir.
- **Neden kolay fark edilmez:** İstek "başarılı" sayılabilir veya timeout "ağ sorunu" sanılır; limit parametresinin sınırsız kabul edildiği akla gelmeyebilir.

---

## service: attendance.service

**Dosya:** `backend/src/services/attendance.service.ts`

### 1. startSession: süre 0 veya negatif

- **Senaryo:** durationMinutes 0 veya negatif verilir (validatör yoksa).
- **Ne yanlış gider:** endTime <= startTime hesaplanır; joinSession çağrıldığında "Yoklama süresi dolmuş" (EXPIRED) döner. Oturum "açıldı" gibi görünür ama kimse katılamaz.
- **Neden kolay fark edilmez:** startSession exception atmaz; sorun öğrenci katılımında ortaya çıkar; "neden hep süre dolmuş" sorusu parametre hatasına götürülmeyebilir.

### 2. joinSession: konum verilmediğinde kayıt oluşuyor

- **Senaryo:** Oturum konum zorunlu (latitude/longitude set); öğrenci konum göndermeden join eder.
- **Ne yanlış gider:** Kod yorumuna göre "Kayıt oluşturuyoruz ama locationOk: false, rejectReason dolu" — yani kayıt oluşur ama location reddedilmiş sayılıyor. İstemci sonucu "başarısız" veya "konum gerekli" olarak göstermezse kullanıcı "katıldım" sanabilir.
- **Neden kolay fark edilmez:** Exception yok; dönüş objesi ve locationOk/rejectReason doğru yorumlanmazsa sessizce yanlış anlaşılır.

---

## service: evaluation.service

**Dosya:** `backend/src/services/evaluation.service.ts`

### 1. score null veya atlanırsa

- **Senaryo:** EvaluationInput'ta score gönderilmez veya null gelir; validatör zorunlu tutmuyorsa.
- **Ne yanlış gider:** upsert ile evaluation kaydı oluşur/güncellenir; score alanı null kalabilir. Raporlama ve ortalama puan hesaplarında null skorlar yanlış sonuç verebilir.
- **Neden kolay fark edilmez:** İstek başarılı; "değerlendirme kaydedildi" görünür; skor olmadan kayıt olduğu rapor ekranında veya export'ta fark edilir.

---

## service: timeline.service

**Dosya:** `backend/src/services/timeline.service.ts`

### 1. create: classId yetkisi kontrolü yok

- **Senaryo:** Öğretmen, kendi sınıfına ait olmayan bir classId ile post oluşturur (yanlış parametre veya yetkisiz istek).
- **Ne yanlış gider:** Post o sınıfa bağlı oluşturulur; o sınıfın öğrencileri timeline'da başka sınıfın paylaşımını görür veya paylaşım yanlış yerde görünür.
- **Neden kolay fark edilmez:** Exception atılmaz; "yanlış sınıfa post düştü" veri/UI hatası gibi görünür, serviste classId yetkisi olmadığı düşünülmeyebilir.

---

## service: teacherWiki.service

**Dosya:** `backend/src/services/teacherWiki.service.ts`

### 1. isAdmin yanlış true gelirse

- **Senaryo:** update veya delete çağrılırken isAdmin yanlışlıkla veya bilinçli olarak true gönderilir (controller token'dan doğru okumuyorsa).
- **Ne yanlış gider:** Sahiplik kontrolü atlanır; herhangi bir öğretmen her sayfayı düzenleyebilir/silebilir.
- **Neden kolay fark edilmez:** İstek 200 döner; yetkisiz değişiklik "birisi düzenlemiş" gibi görünür, isAdmin parametresinin güvenilirliği sorgulanmayabilir.

---

## service: teacherResource.service

**Dosya:** `backend/src/services/teacherResource.service.ts`

### 1. create: levelId geçerliliği kontrolü yok

- **Senaryo:** Geçersiz veya silinmiş levelId ile create çağrılır.
- **Ne yanlış gider:** FK varsa Prisma hata fırlatır; FK yoksa veya levelId yanlış ama geçerli bir id ise kayıt yanlış level'a bağlanır. Raporlama veya filtreleme yanlış sonuç verir.
- **Neden kolay fark edilmez:** Geçerli ama yanlış levelId ile kayıt "başarılı" görünür; materyal yanlış seviyede listelenir, sebep create validasyonu olarak aranmaz.

---

## service: errorBank.service

**Dosya:** `backend/src/services/errorBank.service.ts`

### 1. add: errorText boş

- **Senaryo:** errorText sadece boşluk veya trim sonrası boş string.
- **Ne yanlış gider:** create ile boş string kayıt oluşturulur; uniqueErrors gruplamasında boş metin "hata" gibi görünür, kur sonu tekrar listesi anlamsız olur.
- **Neden kolay fark edilmez:** Exception yok; liste sayfasında boş satır veya " " görünür, validasyon eksikliği hemen fark edilmez.

---

## service: intervention.service

**Dosya:** `backend/src/services/intervention.service.ts`

### 1. getAtRiskStudents: teacherUserId kullanılmıyor

- **Senaryo:** Öğretmen "sadece benim sınıfımdaki riskliler" bekler; API getAtRiskStudents(teacherUserId) ile çağrılıyor ama parametre kullanılmıyor.
- **Ne yanlış gider:** Tüm sistemdeki riskli öğrenciler döner; öğretmen başka sınıfların öğrencilerini de görür veya liste çok uzun/karışık olur.
- **Neden kolay fark edilmez:** Hata yok; "liste çok uzun" veya "bunlar benim sınıfım değil" iş kuralı beklentisi ile karşılaştırılmaz, parametrenin yok sayıldığı anlaşılmaz.

### 2. Öğrencinin sınıfı yoksa (levelId boş)

- **Senaryo:** Nadiren Student.classId geçersiz veya class silinmiş; s.class?.levelId '' olur.
- **Ne yanlış gider:** assignmentsDue sorgusu levelId: '' ile çalışır, genelde boş döner; missed.length 0 kalır. Öğrenci "2 kaçırılan ödev" sebebiyle risk listesine girmemesi gerekirken girebilir (devamsızlık sebebiyle) veya kaçırılan ödev sebebiyle girmesi gerekirken giremeyebilir.
- **Neden kolay fark edilmez:** Exception atılmaz; risk listesi "biraz yanlış" görünür, veri bütünlüğü veya levelId fallback'i akla gelmeyebilir.

---

## service: makeUp.service

**Dosya:** `backend/src/services/makeUp.service.ts`

### 1. Rezervasyon kapasite race

- **Senaryo:** Aynı slot için kapasite 1 kala iki öğrenci aynı anda book çağırır; ikisi de _count.bookings < maxStudents görür.
- **Ne yanlış gider:** İki rezervasyon da oluşur; slot kapasitesi aşılır (overbook).
- **Neden kolay fark edilmez:** Hiç exception yok; sadece slot detayında "dolu sayı > maxStudents" görülür veya fiziksel telafide fazla kişi çıkar; race condition nadiren tekrarlanarak tespit edilir.

### 2. Geçmiş tarihli slot oluşturma

- **Senaryo:** createSlot slotStart/slotEnd geçmiş tarih ile çağrılır (validatör yoksa).
- **Ne yanlış gider:** Slot geçmişte oluşturulur; getAvailableSlotsForStudent slotStart > now ile filtrelediği için listelenmez ama DB'de gereksiz/yanıltıcı kayıt kalır.
- **Neden kolay fark edilmez:** create başarılı döner; liste "gelecek slotlar"da çıkmadığı için "zaten geçmiş" denip geçilebilir, oluşturma anında engel olmadığı fark edilmez.

---

## service: peerReview.service

**Dosya:** `backend/src/services/peerReview.service.ts`

### 1. (Belirgin sessiz hata yok)

- **Senaryo:** Kendi teslimine puan, çift puan vb. kurallar throw/createError ile engelleniyor; dönüşler açık.
- **Not:** Bu serviste exception atmadan yanlış davranışa yol açan net senaryo dokümanda yok; varsa atanan teslim sayısı (peerReviewsPerStudent) ile gerçek atama tutarsızlığı gibi edge case'ler olabilir.

---

## service: similarity.service

**Dosya:** `backend/src/services/similarity.service.ts`

### 1. findSimilarAssignments çağrılmadığı için "benzer yok" sanılması

- **Senaryo:** assignment.service createAssignment benzerlik servisini çağırmıyor; client similarAssignments: [] alıyor.
- **Ne yanlış gider:** Gerçekte benzer ödev varken "benzer ödev yok" bilgisi verilir; çift ödev oluşturulur, uyarı gösterilmez.
- **Neden kolay fark edilmez:** Hiç hata yok; benzerlik özelliği "çalışmıyor" olarak raporlanmaz, sadece sonuçta çift ödev fark edilir.

---

## service: analytics.service

**Dosya:** `backend/src/services/analytics.service.ts`

### 1. Silinmiş ödev ile submissionsByWeek

- **Senaryo:** Bir ödevin submission'ı var, sonra ödev silinir (veya soft-delete); groupBy assignmentId ile submission sayıları alınıyor, sonra assignments findMany ile id'lere göre çekiliyor. Silinmiş ödev id'si artık assignments listesinde yok.
- **Ne yanlış gider:** submissionsByWeek map'te assignment bulunamaz; weekNumber: assignment?.weekNumber || 0 ile 0 atanır. Bu teslimler "hafta 0" veya yanlış hafta olarak raporlanır.
- **Neden kolay fark edilmez:** Exception yok; grafikte veya tabloda hafta numaraları kaymış/yanlış görünür, silinmiş ödev ilişkisi akla gelmeyebilir.

### 2. averageScore: hiç değerlendirme yokken 0

- **Senaryo:** Sistemde hiç evaluation yok; _avg.score null döner, kod Number(null || 0) = 0 kullanıyor.
- **Ne yanlış gider:** Dashboard "ortalama puan 0" gösterir; "henüz puan yok" ile "gerçekten ortalama 0" ayırt edilemez.
- **Neden kolay fark edilmez:** Hata yok; yeni kurulumda 0 makul sanılabilir, veri eksikliği fark edilmez.

---

## service: homework.service

**Dosya:** `backend/src/services/homework.service.ts`

### 1. getById: sahiplik kontrolü yok

- **Senaryo:** Herhangi bir kullanıcı (veya istemci) başka öğretmenin taslak id'sini bilerek getById(id) çağırır.
- **Ne yanlış gider:** Taslak detayı (title, description, assignments vb.) döner; yetkisiz bilgi ifşası olur.
- **Neden kolay fark edilmez:** Exception atılmaz; id tahmin veya link paylaşımı ile başka taslak okunabilir, yetki kontrolünün getById'de olmadığı fark edilmez.
