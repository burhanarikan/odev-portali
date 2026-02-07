# Oturum, token ve veritabanı varsayımları: `middleware.ts`

Middleware’in dayandığı oturum, token ve veritabanı varsayımları ile bu varsayımlar bozulduğunda nasıl yanlış davrandığı.

---

## 1. NextAuth JWT oturum stratejisi

- **Varsayım:** Oturum, NextAuth’un JWT stratejisiyle yönetiliyor; kullanıcı bilgisi (rol dahil) imzalı JWT içinde, cookie’de taşınıyor. Middleware sadece bu JWT’yi okuyor (`getToken`); sunucu tarafında ayrı bir oturum tablosu/oturum store’u yok.
- **Bozulursa:** JWT stratejisi değiştirilir veya session store kullanılmaya başlanırsa, `getToken` beklenen cookie’yi bulamayabilir veya farklı bir yapı döner. Middleware token’ı okuyamaz; herkes giriş yapmamış gibi işlenir veya hata oluşur. Davranış tutarsızlaşır.

---

## 2. NEXTAUTH_SECRET ile imza doğrulaması

- **Varsayım:** JWT, `NEXTAUTH_SECRET` ile imzalanıyor ve middleware aynı secret ile doğruluyor. Secret tek ve tutarlı; deploy ortamları (ve varsa farklı instance’lar) aynı secret’ı kullanıyor.
- **Bozulursa:** Secret yoksa veya yanlışsa `getToken` JWT’yi doğrulayamaz, genelde `null` döner. Giriş yapmış kullanıcılar da “token yok” sayılır; korumalı path’lere giden herkes login’e atılır. Secret farklı instance’larda farklıysa, bir node’da açılan oturum diğerinde geçersiz görünür.

---

## 3. Token payload’ında `role` alanı

- **Varsayım:** JWT payload’ında `role` alanı vardır ve değeri backend’in login cevabındaki `user.role` ile aynıdır. NextAuth jwt callback’inde (giriş anında) bu değer token’a yazılıyor; middleware bu alanı okuyup `'STUDENT'`, `'TEACHER'`, `'ADMIN'` ile karşılaştırıyor.
- **Bozulursa:** Payload’da `role` yoksa veya farklı tipte/ formattaysa (ör. sayı, null, farklı string), karşılaştırmalar hep false kalır. Bilinmeyen rol gibi işlenir: root’ta `/dashboard/teacher`’a gider, `/dashboard`’da yönlendirme yapılmaz. Yanlış rol veya “herkese teacher gibi davranma” ortaya çıkar.

---

## 4. Rol bilgisinin tek kaynağı: giriş anındaki backend cevabı

- **Varsayım:** Rol, ilk girişte backend `POST /api/auth/login` cevabındaki `user.role` ile alınıp JWT’ye bir kez yazılıyor. Backend bu değeri veritabanındaki `User.role` alanından üretiyor. Middleware her istekte sadece JWT’ye bakıyor; veritabanına veya backend’e tekrar sormuyor.
- **Bozulursa:** Giriş anında backend/DB yanlış rol döndürürse (bug, veri hatası, migration), JWT o yanlış rolü taşır; middleware yanlış yönlendirme yapar. Veritabanında rol sonradan değiştirilse (ör. kullanıcı STUDENT → TEACHER yapıldı), JWT güncellenmediği için middleware eski role göre davranır; kullanıcı yeniden giriş yapana kadar yanlış sayfaya yönlendirilir veya yetkisiz path’e “izin varmış” gibi geçer.

---

## 5. Veritabanında `User.role` ve enum değerleri

- **Varsayım:** Veritabanında kullanıcının `role` alanı vardır ve Prisma enum’undaki değerlerle (STUDENT, TEACHER, ADMIN) tutarlıdır. Backend login bu alanı okuyup aynen döndürüyor; middleware tam bu string’leri bekliyor.
- **Bozulursa:** DB’de rol alanı bozulur, enum dışı değer gelir veya migration ile enum değişirse, backend’in döndürdüğü değer middleware’in beklediği `'STUDENT'` / `'TEACHER'` / `'ADMIN'` ile eşleşmeyebilir. Sonuç: bilinmeyen rol davranışı (yanlış yönlendirme veya yönlendirmeme). Ayrıca DB erişilemezse login zaten başarısız olur; mevcut JWT’ler ise middleware’de eskisi gibi okunur (rol güncellenmez).

---

## 6. Cookie’nin tek oturum taşıyıcısı olması

- **Varsayım:** Geçerli oturum bilgisi sadece NextAuth’un set ettiği JWT cookie’sinde; middleware başka header/cookie ile “giriş yapmış” saymıyor.
- **Bozulursa:** Uygulama başka bir cookie/header ile de oturum kabul ederse (ör. backend’in kendi token’ı), o oturum middleware tarafından görülmez. Kullanıcı client’ta giriş yapmış görünür ama middleware onu “giriş yok” sayıp login’e atar veya tam tersi senaryoda yetkisiz erişim kalabilir.

---

## 7. Token yenilenmemesi (rol güncellemesi yok)

- **Varsayım:** JWT, girişte bir kez oluşturuluyor ve (maxAge süresince) her istekte aynı payload kullanılıyor; middleware token’ı veritabanı veya API ile yenilemiyor.
- **Bozulursa:** Rol veya yetki DB’de değişse bile middleware eski JWT’ye göre karar verir. Yetkisi kaldırılan kullanıcı, token süresi dolana veya yeniden giriş yapana kadar eski role göre yönlendirilmeye devam eder; yetkisi artan kullanıcı ise yeni role göre yönlendirilmez.

---

## 8. Backend login cevabı şekli

- **Varsayım:** NextAuth `authorize` içinde çağrılan backend login, `{ user: { id, name, email, role }, token }` formatında dönüyor; `user.role` string ve middleware’in kullandığı üç değerden biri.
- **Bozulursa:** Backend cevabı değişirse (alan adı, tip, farklı enum değerleri), NextAuth jwt callback’inde `token.role` yanlış set edilir veya set edilmez. Middleware aynı kodu kullandığı için yanlış/eksik role ile karar verir; sessizce yanlış yönlendirme veya “bilinmeyen rol” davranışı oluşur.

---

## Özet tablo

| Varsayım | Bozulunca middleware’de görünen yanlış davranış |
|----------|--------------------------------------------------|
| JWT oturum stratejisi | Token okunamaz; herkes giriş yapmamış gibi veya hata. |
| NEXTAUTH_SECRET tutarlı | Token doğrulanamaz; herkes login’e yönlendirilir. |
| Token’da `role` alanı ve formatı | Bilinmeyen rol; yanlış veya eksik yönlendirme. |
| Rol = giriş anındaki backend cevabı | Girişte yanlış rol → sürekli yanlış karar; DB’de sonradan rol değişince JWT güncellenmez, eski role göre davranış. |
| DB’de User.role ve enum | Enum dışı/bozuk değer → bilinmeyen rol; DB down ise yeni giriş yok, mevcut JWT’ler aynen okunur. |
| Tek oturum taşıyıcısı (NextAuth cookie) | Çift kaynak varsa: biri “giriş var” diyor, middleware diğerine baktığı için tutarsız yönlendirme. |
| Token yenilenmemesi | Rol DB’de değişse bile middleware eski role göre yönlendirir. |
| Backend login cevap formatı | role yanlış/eksik → JWT’de yanlış/eksik role; middleware buna göre yanlış karar verir. |

---

## auth login

**Dosya:** `app/api/auth/[...nextauth]/route.ts` ve `lib/auth.ts`. Auth login akışının dayandığı oturum, token ve veritabanı varsayımları ile bu varsayımlar bozulduğunda giriş/oturum akışının nasıl yanlış davrandığı.

---

### 1. Backend login URL’i (ortam)

- **Varsayım:** `NEXT_PUBLIC_API_URL` veya `VITE_API_URL` (veya fallback) ile elde edilen `base` değeri, backend’in gerçek adresidir; `authorize` içindeki `fetch(\`${base}/api/auth/login\`)` doğru sunucuya gider.
- **Bozulursa:** Ortam yanlış/eksikse istek yanlış host’a veya path’e gider. Backend’e ulaşılamazsa giriş hep başarısız olur (authorize null). Yanlış sunucu 200 + sahte user dönerse auth login akışı “başarılı” sayar ve hatalı oturum oluşturur; kullanıcı yanlış kimlikle giriş yapmış gibi davranır.

---

### 2. Backend login API erişilebilirliği ve cevap formatı

- **Varsayım:** Backend `POST {base}/api/auth/login` erişilebilirdir; 200 döndüğünde body `{ user: { id, name, email, role }, token }` formatındadır; `user` ve `token` alanları mevcut ve kullanılabilir.
- **Bozulursa:** Backend kapalı veya ağ hatası varsa fetch başarısız olur veya non-2xx döner; `authorize` null döner, giriş yapılamaz. 200 dönüp body farklı formatta (alan adı değişti, user/token yok) ise `!user || !token` ile yine null; kullanıcı “giriş başarısız” görür, gerçek sebep belli olmaz. Cevapta `user.role` eksik/yanlış olsa bile authorize user döndürür; auth login akışı oturum açar ama rol hatalı/eksik olur.

---

### 3. NEXTAUTH_SECRET (JWT imzası)

- **Varsayım:** `authOptions.secret` (NEXTAUTH_SECRET) tanımlıdır; NextAuth giriş sonrası JWT’yi bu secret ile imzalayıp cookie’ye yazar.
- **Bozulursa:** Secret yoksa veya yanlışsa NextAuth JWT’yi imzalayamaz veya tutarsız imza kullanır. Giriş isteği 200 dönse bile cookie geçersiz/okunamaz olabilir; sonraki istekte `/api/auth/session` boş veya hatalı döner. Kullanıcı “giriş yaptım ama hemen çıkış oldu” gibi görür; auth login akışı başarılı gibi görünüp oturum sürdürülemez.

---

### 4. Oturum stratejisi JWT

- **Varsayım:** `authOptions.session.strategy` "jwt"tir; sunucu tarafında oturum tablosu yok, tüm oturum bilgisi JWT cookie’de taşınır.
- **Bozulursa:** Strateji "database" veya başka bir mode’a çekilirse, bu route hâlâ JWT ile çalışan bir authOptions kullanıyorsa uyumsuzluk olur. Session store kullanılıyorsa ama route/store konfigüre değilse session endpoint’i boş veya hatalı dönebilir; giriş sonrası oturum alınamaz.

---

### 5. Rol bilgisinin backend/DB kaynağı

- **Varsayım:** Backend login cevabındaki `user.role`, veritabanındaki `User.role` alanından gelir; backend DB’den okuyup aynen döndürür. Auth login bu değeri doğrulamadan JWT ve session’a yazar.
- **Bozulursa:** DB’de rol yanlış/bozuk veya migration sonrası enum değiştiyse backend o değeri döndürür; auth login akışı aynen kabul eder. Bilinmeyen veya hatalı rol JWT’ye ve session’a yazılır; client ve middleware yanlış role göre davranır. DB’ye erişilemezse backend login zaten başarısız olur; auth login giriş yaptıramaz.

---

### 6. authorize dönüşünün tek seferlik kullanımı

- **Varsayım:** `authorize` yalnızca giriş denemesi sırasında çağrılır; döndürdüğü `user` (id, email, name, role, token) jwt callback’e bir kez iletilir ve JWT’ye yazılır. Sonraki isteklerde JWT’den okunur; authorize tekrar çağrılmaz.
- **Bozulursa:** Bu varsayım NextAuth’un tasarımı; bozulması bu dosyalardan kaynaklanmaz. Eğer bir değişiklikle authorize her istekte çağrılsaydı, backend’e her session isteğinde login atılır; performans ve backend yükü bozulur, gereksiz DB erişimi olur.

---

### 7. Session ve JWT callback’lerinde rol doğrulaması yok

- **Varsayım:** Mevcut kod, `token.role` ve `session.user.role` atarken değerin geçerliliğini (STUDENT/TEACHER/ADMIN) kontrol etmiyor; backend’den veya token’dan gelen değer aynen kullanılıyor.
- **Bozulursa:** Varsayım “kontrol yok” olduğu için “bozulma” dışarıdan gelir: backend/DB hatalı rol gönderirse auth login akışı bunu engellemez. Sonuç: geçersiz rol ile oturum oluşur; auth login katmanında yanlış davranış, hatalı rolü kabul etmek ve session’a yazmak olur.

---

### 8. Cookie’nin tek oturum taşıyıcısı olması

- **Varsayım:** Geçerli oturum yalnızca NextAuth’un set ettiği JWT cookie’sinde; auth login akışı başka bir cookie/header ile “giriş yapmış” saymıyor veya oturum kurmuyor.
- **Bozulursa:** Uygulama başka bir mekanizma (örn. backend’in kendi cookie’si) ile de oturum kabul ederse, auth login (NextAuth) ile o mekanizma çakışabilir. NextAuth girişi “başarısız” sayıp cookie set etmeyebilir ama diğer mekanizma “giriş var” diyebilir; veya tam tersi. Auth login akışının davranışı tek kaynak varsayımına bağlıdır.

---

### 9. maxAge ve token yenilenmemesi

- **Varsayım:** `session.maxAge` (7 gün) JWT’nin geçerlilik süresidir; bu süre içinde token yenilenmez, rol veya kullanıcı bilgisi veritabanından tekrar okunmaz.
- **Bozulursa:** DB’de kullanıcı silindi veya rolü değişti; auth login akışı mevcut JWT’yi yenilemediği için session endpoint aynı eski payload’ı döndürmeye devam eder. Kullanıcı artık geçersiz veya farklı rolde olsa bile auth login katmanı bunu fark etmez; yanlış/geçersiz oturum sürer.

---

### 10. signIn sayfası path’i

- **Varsayım:** `authOptions.pages.signIn` (`/login`) uygulamada tanımlı bir sayfadır; NextAuth giriş gerekince kullanıcıyı oraya yönlendirir.
- **Bozulursa:** `/login` route’u kaldırıldı veya taşındıysa, NextAuth yine oraya yönlendirir. Auth login akışı “doğru” çalışır (redirect döner) ama kullanıcı 404 veya yanlış sayfaya düşer; giriş deneyimi bozulur.

---

### Özet tablo (auth login)

| Varsayım | Bozulunca auth login akışında görünen yanlış davranış |
|----------|-------------------------------------------------------|
| Backend URL doğru | Yanlış sunucuya istek; giriş başarısız veya sahte oturum. |
| Backend API erişilebilir ve format doğru | Giriş başarısız veya hatalı/eksik rol ile oturum. |
| NEXTAUTH_SECRET tanımlı | Oturum cookie’si geçersiz; giriş sonrası session alınamaz. |
| Oturum stratejisi JWT | Session store ile uyumsuzluk; oturum alınamayabilir. |
| Rol backend/DB’den geliyor | Hatalı rol ile oturum oluşur; auth login engellemez. |
| authorize tek seferlik | Tasarım dışı kullanımda gereksiz backend/DB yükü. |
| Rol doğrulaması yok (callback’ler) | Geçersiz rol session’a yazılır; client/middleware yanlış davranır. |
| Tek oturum taşıyıcısı (cookie) | Çift kaynakta tutarsız “giriş var/yok” davranışı. |
| maxAge / token yenilenmez | DB’deki rol/kullanıcı değişse bile eski oturum sürer. |
| signIn sayfası mevcut | Redirect 404; kullanıcı giriş sayfasına ulaşamaz. |

---

## lib/auth

**Dosya:** `lib/auth.ts`. Bu dosyanın dayandığı oturum, token ve veritabanı varsayımları; özellikle JWT callback'lerinin çağrılma sırası, session'a role bilgisinin aktarımı ve kullanıcı/role kaynağının DB'den gelmesi. Bu varsayımlar bozulursa auth zinciri nasıl yanlış davranır?

---

### 1. Callback çağrılma sırası (authorize → jwt → session)

- **Varsayım:** NextAuth, credentials akışında önce `authorize` çağırır; authorize null dönmezse döndürdüğü `user` ile **jwt callback** çağrılır (giriş anında `user` dolu gelir). Sonraki isteklerde jwt callback yalnızca cookie'den okunan `token` ile çağrılır; `user` undefined. **Session callback** ise session istendiğinde (getSession, /api/auth/session) çağrılır ve her zaman **token** ile çağrılır; jwt'den sonra çalışır. Yani sıra: authorize → (başarılıysa) jwt(user + token) → ileride session(token).
- **Bozulursa:** Bu sıra NextAuth'un iç implementasyonuna bağlı; değişirse veya jwt callback giriş dışında da `user` ile çağrılırsa token sürekli üzerine yazılabilir veya role kaybolabilir. Session callback token'dan önce çağrılırsa token.role henüz set edilmemiş olabilir; session'da role eksik kalır. Auth zinciri: client/middleware yanlış veya eksik role görür; yönlendirme ve yetki bozulur.

---

### 2. JWT callback'te user yalnızca giriş anında dolu

- **Varsayım:** JWT strategy'de jwt callback'e gelen `user` parametresi **sadece ilk girişte** (sign-in callback sırasında) dolu gelir; sonraki her istekte (session doğrulama, sayfa istekleri) `user` undefined'dır, mevcut `token` cookie'den okunup aynen döndürülür.
- **Bozulursa:** NextAuth sürümü veya konfig farkıyla `user` sonraki isteklerde de dolu gelirse, token her seferinde authorize çıktısıyla güncellenir (ki authorize bu isteklerde çağrılmıyor, user nereden geliyor belirsiz). Veya tam tersi: giriş anında `user` gelmezse token.role hiç yazılmaz; session'da role hep undefined kalır. Auth zinciri: rol ya hiç yazılmaz ya da tutarsız güncellenir; middleware ve client yanlış/eksik role ile çalışır.

---

### 3. Session'a role aktarımı: token → session.user.role

- **Varsayım:** Role bilgisi **tek yönlü** akar: backend → authorize return (user.role) → jwt callback (token.role) → JWT cookie → session callback (session.user.role = token.role). Session callback çalıştığında `token` zaten JWT'den decode edilmiş durumdadır; `token.role` varsa session'a kopyalanır. `session.user` nesnesi NextAuth tarafından sağlanır ve mevcuttur.
- **Bozulursa:** Token'da role yoksa (eski JWT, bozuk payload) session.user.role undefined olur; bu dosya undefined'ı filtrelemiyor. Session callback'te session.user yoksa (edge case) role hiç atanmaz. Auth zinciri: client ve middleware session.user.role undefined veya eksik görür; rol bazlı UI ve yönlendirme çalışmaz veya yanlış çalışır.

---

### 4. Role bilgisinin kaynağı: backend login = DB

- **Varsayım:** `user.role` **üretilmiyor**; backend `POST {base}/api/auth/login` cevabındaki `data.user.role` ile gelir. Backend bu değeri veritabanındaki kullanıcı kaydından (örn. `User.role`) okuyup döndürür. Yani rol bilgisinin **tek kaynağı** giriş anında backend'in döndürdüğü cevaptır; backend de bunu DB'den alır. Lib/auth DB'ye doğrudan bağlanmaz; "kullanıcı kaydı / role kaynağı = DB" varsayımı backend üzerinden gerçekleşir.
- **Bozulursa:** Backend DB'den farklı bir kaynaktan (cache, config, sabit değer) role alırsa veya DB'deki değer yanlış/bozuksa lib/auth bunu bilmez; aynen JWT ve session'a yazar. DB'de rol sonradan değişse bile JWT yenilenmediği için eski rol taşınmaya devam eder. Auth zinciri: yanlış veya güncel olmayan rol ile yetki ve yönlendirme hatalı olur.

---

### 5. Backend login cevap formatı (user + token, user.role string)

- **Varsayım:** Backend 200 döndüğünde body `{ user: { id, name, email, role }, token }` formatındadır; `user.role` string ve uygulamanın beklediği formatta (STUDENT, TEACHER, ADMIN). Bu dosya bu yapıyı doğrulamıyor; sadece `user` ve `token` varlığına bakıyor.
- **Bozulursa:** Backend alan adı değiştirirse (örn. role → userRole) veya role'ü farklı tip (number, object) döndürürse authorize yine user döndürebilir (user.role undefined veya yanlış tip); jwt/session callback'ler aynen yazar. Auth zinciri: session'da role eksik veya tip uyumsuz; middleware/client karşılaştırmaları bozulur.

---

### 6. JWT payload'ının session callback'te okunabilir olması

- **Varsayım:** jwt callback'te atanan `token.role`, `token.id`, `token.accessToken` NextAuth tarafından JWT'ye yazılıp cookie'de saklanır; sonraki isteklerde JWT decode edilip aynı alanlar `token` olarak session callback'e iletilir. Yani session callback'te `token` = JWT payload; role oradan okunabilir.
- **Bozulursa:** JWT boyut sınırı aşılır veya serialize edilemeyen değer yazılırsa payload bozulabilir veya kesilebilir; token.role session callback'te eksik/yanlış gelir. Auth zinciri: session'da role kaybolur veya hatalı olur.

---

### 7. Oturum taşıyıcısı: tek kaynak (NextAuth JWT cookie)

- **Varsayım:** Geçerli oturum bilgisi (role dahil) yalnızca NextAuth'un set ettiği JWT cookie'sinde taşınır; lib/auth başka cookie veya header ile "giriş" veya "rol" okumaz/yazmaz.
- **Bozulursa:** Uygulama başka bir oturum mekanizması (örn. backend'in kendi cookie'si) kullanıyorsa ve lib/auth sadece NextAuth cookie'ye bakıyorsa, iki kaynak çakışabilir; "giriş var" ile "rol yok" gibi tutarsız durumlar oluşur. Auth zinciri: kimin girişli olduğu ve rolü konusunda tutarsızlık.

---

### 8. Veritabanında kullanıcı ve rol alanı

- **Varsayım:** Backend login, veritabanında kullanıcı kaydı (email/şifre doğrulaması) ve bu kaydın `role` alanını okuyup cevaba koyar. Yani "kullanıcı kaydı ve role kaynağı DB'de" varsayımı backend üzerinden geçerli; lib/auth doğrudan DB'ye erişmez ama auth zinciri bu varsayıma dayanır.
- **Bozulursa:** DB'de User tablosu/role alanı değişir, migration rol enum'unu değiştirir veya DB erişilemezse backend login başarısız olur veya yanlış rol döner; lib/auth çıktısı (JWT/session) buna göre yanlış veya eksik olur. Auth zinciri: giriş yapılamaz veya yanlış rol ile oturum açılır.

---

### Özet tablo (lib/auth)

| Varsayım | Bozulunca auth zincirinde görünen yanlış davranış |
|----------|---------------------------------------------------|
| Callback sırası (authorize → jwt → session) | Role token'a yazılmadan session çağrılabilir veya token sürekli güncellenir; session/middleware yanlış veya eksik role görür. |
| jwt'de user yalnızca giriş anında dolu | Role hiç yazılmaz veya tutarsız güncellenir; session'da role eksik/yanlış. |
| Session'a role aktarımı (token → session.user.role) | token.role yoksa session'da undefined; session.user yoksa role atanmaz; client/middleware rol bazlı mantık bozulur. |
| Role kaynağı backend = DB | Backend/DB yanlış veya güncel olmayan rol döndürürse aynen JWT/session'a yazılır; yetki ve yönlendirme hatalı. |
| Backend cevap formatı (user.role string) | Eksik/yanlış tip veya alan adı; session'da role eksik veya uyumsuz; karşılaştırmalar bozulur. |
| JWT payload session callback'te okunabilir | Payload bozulur/kesilirse token.role eksik/yanlış; session'da role kaybolur. |
| Tek oturum taşıyıcısı (NextAuth cookie) | Çift kaynakta "giriş var" ile "rol yok" tutarsızlığı. |
| Kullanıcı/role kaynağı DB'de | DB değişir veya erişilemezse backend cevabı değişir; lib/auth çıktısı ve tüm auth zinciri buna göre yanlış davranır. |

---

## service: auth.service

**Dosya:** `backend/src/services/auth.service.ts`

- **Varsayım (kayıt varlığı):** `User` tablosunda `email` alanı unique kullanılıyor; register öncesi `findUnique({ where: { email } })` ile kontrol var. Aynı email ile ikinci kayıt 409 atar.
- **Bozulursa:** DB'de email için unique constraint kaldırılırsa veya constraint bypass edilirse aynı email ile birden fazla User oluşabilir; login hangi kaydı seçeceği belirsiz (findUnique ilk eşleşeni döndürmeyebilir), şifre doğrulama yanlış kayda yapılabilir.
- **Varsayım (ilişki – STUDENT):** STUDENT rolünde kayıt için `Student` kaydı oluşturulur; `classId` verilmezse `prisma.class.findFirst()` ile bir sınıf alınır. En az bir `Class` kaydı olduğu ve `findFirst` döndüğü varsayılıyor.
- **Bozulursa:** Hiç Class kaydı yoksa `classId` undefined kalır, Student kaydı oluşturulmaz; User STUDENT rolüyle oluşur ama Student tablosunda karşılığı yok. getProfile veya öğrenci işlemleri Student bulamaz, 404 veya tutarsız veri.
- **Varsayım (ilişki – TEACHER/ADMIN):** TEACHER için `Teacher` kaydı oluşturulur; ADMIN için ek tablo kaydı yok. User.role ile Teacher/Student varlığı 1-1 ilişkisi (en fazla bir Teacher, en fazla bir Student per User) varsayılıyor.
- **Bozulursa:** Aynı User için birden fazla Teacher/Student (schema izin vermiyorsa zaten olmaz); tersine Teacher/Student silinip User kalsa login başarılı olur ama öğretmen/öğrenci işlemleri 404.
- **Varsayım (state):** Login sadece User varlığı ve passwordHash karşılaştırmasına dayanıyor; hesap kilidi, e-posta doğrulama gibi ek state yok.
- **Bozulursa:** passwordHash bozulursa veya farklı algoritma kullanılırsa giriş hep başarısız olur.

---

## service: student.service

**Dosya:** `backend/src/services/student.service.ts`

- **Varsayım (kayıt varlığı):** Her metod `studentId` (userId) ile `Student.findUnique({ where: { userId } })` yapıyor; Student'ın varlığı ve User ile 1-1 ilişkisi varsayılıyor. Student yoksa 404.
- **Bozulursa:** userId'ye karşılık Student kaydı yoksa (ör. ADMIN olarak kayıt, sonra role değişti ama Student oluşturulmadı) tüm öğrenci metodları 404 atar.
- **Varsayım (ilişki):** Student'ın `classId` ve `class.levelId` geçerli; ödev listesi `levelId`, `targets` (classId / studentId) ile filtreleniyor. Assignment'ların levelId ve targets ilişkisi DB'de tutarlı.
- **Bozulursa:** Student'ın classId silinmiş bir Class'ı gösteriyorsa veya levelId tutarsızsa ödev listesi boş veya yanlış döner; getAssignmentById aynı tutarsızlıktan etkilenir.
- **Varsayım (tekillik – teslim):** Aynı (assignmentId, studentId) için en fazla bir Submission olmalı; submitAssignment öncesi `findFirst` ile mevcut teslim kontrol ediliyor. DB'de bu çift için unique constraint yoksa eşzamanlı iki istek çift teslim oluşturabilir (race).
- **Bozulursa:** Çift teslim kaydı oluşursa değerlendirme ve istatistikler çift sayar; "already submitted" kuralı ihlal edilir.
- **Varsayım (UserConsent):** `userId` başına en fazla bir UserConsent; `recordConsent` upsert kullanıyor. getConsent yoksa { accepted: false } döner.
- **Bozulursa:** Consent tablosu bozulursa veya userId yanlışsa öğrenci teslim edemez (403) veya onaysız teslim kabul edilebilir (kontrol atlanırsa).

---

## service: assignment.service

**Dosya:** `backend/src/services/assignment.service.ts`

- **Varsayım (kayıt varlığı):** Teacher userId → Teacher.id; Homework (homeworkId verilmişse) id + teacherId eşleşmesi. Assignment, AssignmentTarget, Group için ilgili FK'lar (levelId, classId, studentIds) veritabanında varlık gösteriyor.
- **Bozulursa:** teacherId çözülemezse 404. homeworkId başka öğretmene aitse 404. classId veya studentIds geçersiz/silinmiş id ise AssignmentTarget create sırasında FK hatası veya yetkisiz hedef kaydı.
- **Varsayım (tekillik – ödev):** Aynı öğretmen, levelId, title, weekNumber ile en fazla bir ödev (yeni ödev path'inde findFirst ile kontrol). Schema'da bu dörtlü için unique constraint yok.
- **Bozulursa:** Eşzamanlı iki create aynı dörtlü ile iki ödev oluşturabilir; "Bu seviye ve haftada aynı başlıkta ödeviniz zaten var" kuralı ihlal edilir.
- **Varsayım (ilişki – Group):** createGroup assignmentId'yi kontrol etmiyor; assignment'ın varlığı ve öğretmene aitliği varsayılmıyor. addStudentToGroup / removeStudentFromGroup groupId, studentId varlığı ve GroupMember tekil (groupId, studentId) varsayılıyor.
- **Bozulursa:** Var olmayan veya başka öğretmenin assignment'ına group oluşturulabilir. GroupMember composite key yoksa aynı (groupId, studentId) iki kez eklenebilir; remove tek kayıt siler, tutarsızlık.

---

## service: announcement.service

**Dosya:** `backend/src/services/announcement.service.ts`

- **Varsayım (kayıt varlığı):** delete(id) ilgili Announcement kaydının var olduğunu varsayıyor; yoksa Prisma P2025 (Record to delete does not exist). create'te authorId opsiyonel; null ise author ilişkisi yok.
- **Bozulursa:** Silinmiş veya hiç olmamış id ile delete çağrılırsa 500 (P2025). authorId geçersiz User id ise FK ihlali (schema restrict ise hata).
- **Varsayım (ilişki):** list ve create author (User) include ediyor; author silinmişse null veya hata (schema'ya bağlı).
- **Bozulursa:** Author User silinirse duyuru listesi veya detayda author bilgisi boş/hatalı görünebilir.

---

## service: attendance.service

**Dosya:** `backend/src/services/attendance.service.ts`

- **Varsayım (tekillik – kod):** Yoklama kodu (code) benzersiz; do-while ile rastgele üretilip findUnique ile kontrol ediliyor. Aynı code iki oturumda olmamalı.
- **Bozulursa:** Çok düşük olasılıkla iki istek aynı 6 haneli kodu üretirse (race) iki session aynı code ile oluşabilir; öğrenci yanlış oturuma katılmış sayılabilir veya kod çakışması.
- **Varsayım (kayıt varlığı / ilişki):** Session.classId, session.teacherId, Student.classId geçerli. joinSession session.classId === student.classId kontrolü yapıyor. AttendanceRecord için (sessionId, studentId) schema'da @@unique; aynı öğrenci aynı oturuma iki kez eklenemez.
- **Bozulursa:** Session silinmiş veya code değiştirilmişse join INVALID_CODE. Öğrenci sınıf değiştirdiyse (classId güncellenmediyse) WRONG_CLASS veya yanlış sınıf oturumuna katılım.
- **Varsayım (state geçişi):** Oturumun "aktif" olması sadece now <= endTime ile belirleniyor; oturum iptal / erken kapatma gibi state yok. Süre dolunca EXPIRED döner, kayıt oluşturulmaz.
- **Bozulursa:** endTime sunucu saatine göre; saat kayması varsa yoklama erken veya geç kapanır.

---

## service: evaluation.service

**Dosya:** `backend/src/services/evaluation.service.ts`

- **Varsayım (kayıt varlığı):** Submission id ile bulunur; submission.assignment.createdBy ile öğretmen eşleşmesi. Evaluation submissionId üzerinden upsert; bir teslim için tek Evaluation kaydı.
- **Bozulursa:** Submission silinmişse 404. createdBy ile teacher.id eşleşmezse 403. submissionId için birden fazla Evaluation (schema izin vermiyorsa unique) oluşmaz; upsert create/update ile tek kayıt garantileniyor.
- **Varsayım (ilişki):** Submission → Assignment → createdBy; Evaluation → Submission 1-1. assignment silinirse submission üzerinden erişim bozulabilir (cascade'a bağlı).

---

## service: timeline.service

**Dosya:** `backend/src/services/timeline.service.ts`

- **Varsayım (kayıt varlığı):** Teacher userId → Teacher.id; Class id ile vardır. TimelinePost classId, teacherId FK; delete'te post.teacherId === teacher.id sahiplik kontrolü.
- **Bozulursa:** classId silinmiş Class ise FK hatası veya post yetkisiz sınıfta görünür. getByClassId(classId) classId'nin varlığını doğrulamıyor; silinmiş classId ile boş liste döner (yanlış davranış değil ama tutarsız id kullanımı).
- **Varsayım (ilişki):** Student.classId getTimelineForStudent'tan geliyor; öğrenci sınıfı değişmişse eski sınıfın timeline'ı döner (classId güncelli değilse).

---

## service: teacherWiki.service

**Dosya:** `backend/src/services/teacherWiki.service.ts`

- **Varsayım (kayıt varlığı):** getById, update, delete sayfa id'si ile TeacherWikiPage bulur; page.teacherId ile sahiplik (veya isAdmin). Teacher userId → Teacher.id.
- **Bozulursa:** Sayfa silinmişse 404. isAdmin dışarıdan geldiği için servis DB'de admin rolünü doğrulamıyor; veri bütünlüğü açısından "admin bilgisi güvenilir" varsayımı.
- **Varsayım (ilişki):** Wiki sayfası → Teacher FK; teacher silinirse sayfa orphan kalır veya cascade ile silinir (schema'ya bağlı).

---

## service: teacherResource.service

**Dosya:** `backend/src/services/teacherResource.service.ts`

- **Varsayım (kayıt varlığı):** Teacher varlığı; delete'te resource.teacherId === teacher.id. create'te levelId opsiyonel; null veya geçerli Level id.
- **Bozulursa:** levelId verilip Level tablosunda yoksa FK ihlali (create sırasında hata). Resource'u silinmiş teacherId ile liste/detay teacher bilgisi boş veya hata.

---

## service: errorBank.service

**Dosya:** `backend/src/services/errorBank.service.ts`

- **Varsayım (kayıt varlığı):** Student id, Teacher userId → id varlığı. add'de submissionId opsiyonel; Submission varlığı kontrol edilmiyor.
- **Bozulursa:** submissionId geçersiz veya silinmiş teslim id ise FK hatası (schema restrict) veya yetkisiz teslimle ilişkili hata kaydı. Öğrenci/öğretmen silinmişse ilgili işlem 404.

---

## service: intervention.service

**Dosya:** `backend/src/services/intervention.service.ts`

- **Varsayım (kayıt varlığı / ilişki):** getAtRiskStudents tüm Student'ları çekiyor; her öğrenci için classId, class.levelId, attendanceRecords, submissions ilişkileri varsayılıyor. Student'ın class'ı veya level'i null ise levelId boş string kullanılıyor; assignment sorgusu yanlış sonuç verebilir.
- **Bozulursa:** Öğrencinin classId'si silinmiş Class ise sessionsForClass boş, devamsızlık hesabı yanlış. interventionLog studentId, teacherId FK; addLog öğretmen ve öğrenci varlığı kontrol ediyor.
- **Varsayım (state):** "Risk" hesaplaması 2 ardışık devamsızlık ve 2 kaçırılan ödev; veri anlık okumaya dayalı, state geçişi (örn. "müdahale yapıldı" bayrağı) sadece InterventionLog kaydı ile tutuluyor.
- **Bozulursa:** getLogs teacherUserId kullanmıyor; tüm loglar döner. Log silinirse veya tarih tutarsızsa raporlama yanlış olur.

---

## service: makeUp.service

**Dosya:** `backend/src/services/makeUp.service.ts`

- **Varsayım (kayıt varlığı):** Teacher, Class varlığı. bookSlot slot.classId === student.classId; slot.slotStart > now; slot._count.bookings < maxStudents. MakeUpBooking (slotId, studentId) tekil; schema'da @@unique([slotId, studentId]); existing kontrolü var.
- **Bozulursa:** Aynı anda iki istek son kalan kontenjan için book yaparsa ikisi de _count.bookings < maxStudents görüp birisi create eder, diğeri kontenjan doldu hatası alır veya unique constraint ile ikinci create hata verir. Kontenjan bir fazla dolu olmaz (unique önler) ama "kontenjan doldu" mesajı bazen yanlış kullanıcıya gidebilir (race).
- **Varsayım (state):** slotEnd > slotStart; maxStudents 1–50. Slot geçmişte kaldığında bookSlot 400 atar; slot silinmez, sadece tarih kontrolü.
- **Bozulursa:** Slot oluşturulduktan sonra classId veya teacherId değiştirilirse (DB'de manuel değişiklik) listeler ve bookSlot tutarsız davranır.

---

## service: peerReview.service

**Dosya:** `backend/src/services/peerReview.service.ts`

- **Varsayım (kayıt varlığı / ilişki):** Assignment peerReviewEnabled, levelId; Student class.levelId ile aynı seviyede. PeerReview (submissionId, reviewerStudentId) tekil; schema @@unique; submitPeerReview'da existing kontrolü. Kendi teslimini puanlama engelleniyor (submission.studentId !== student.id).
- **Bozulursa:** Aynı (submissionId, reviewerStudentId) ile eşzamanlı iki istek birisi create eder, diğeri 409 veya unique constraint hatası. Assignment/Submission silinirse veya peerReviewEnabled kapatılırsa mevcut PeerReview kayıtları orphan kalabilir (cascade'a bağlı).
- **Varsayım (state):** Ödevde akran değerlendirmesi açıkken teslimler alınıyor; ödev kapatılsa bile mevcut puanlar kalıyor.

---

## service: similarity.service

**Dosya:** `backend/src/services/similarity.service.ts`

- **Varsayım (kayıt varlığı / ilişki):** findSimilarAssignments isDraft: false ile tüm yayındaki ödevleri çekiyor; assignment.title, description, level, teacher, targets ilişkileri dolu. Veri bütünlüğü: metin alanları string, tokenize edilebilir.
- **Bozulursa:** Assignment'ın levelId veya teacher silinmişse include null döner; formatTargetsSummary veya teacherName hata/undefined. Çok büyük metin tokenize maliyeti artırır; DB'den çekilen kayıt sayısı fazlaysa performans düşer.

---

## service: analytics.service

**Dosya:** `backend/src/services/analytics.service.ts`

- **Varsayım (kayıt varlığı / ilişki):** getDashboardStats count ve aggregate'lere dayanıyor; Assignment, Student, Teacher, Submission, Evaluation, Level tabloları tutarlı. groupBy levelId sonrası Level findMany; levelId silinmiş Level ise "Bilinmeyen" döner. submission → assignment.weekNumber ilişkisi; assignment silinirse submission orphan (groupBy assignmentId hâlâ çalışır, weekNumber 0 olabilir).
- **Bozulursa:** DB'de tutarsız sayılar (örn. submission.assignmentId geçersiz) groupBy veya include'da hata/eksik veri. getStudentProgress(studentId) userId ile Student arıyor; student.class.levelId ve submissions ilişkisi. getStudentPortfolio(studentId) id ile Student; class, submissions, skillScore include. getTeacherPerformance directTeacherId veya userId → Teacher; assignments ve submissions. getClassLeaderboard Class, students, levelId, attendanceSession count, assignment targets; completionRate ve attendanceRate hesaplamaları ilişkilere bağlı.
- **Bozulursa:** Öğrenci sınıf değiştirdiyse eski sınıfın ödev sayısı ile yeni sınıfın submission'ı karışır; oranlar yanlış. attendanceRecords.session silinmişse sayım bozulur.

---

## service: homework.service

**Dosya:** `backend/src/services/homework.service.ts`

- **Varsayım (kayıt varlığı):** Teacher userId → Teacher.id. getById(id) sadece id ile Homework getirir; varlık kontrolü var (404). update/delete homework.teacherId === teacherId sahiplik kontrolü. create'te levelId zorunlu; Level varlığı kontrol edilmiyor.
- **Bozulursa:** levelId geçersiz veya silinmiş Level ise Homework create FK hatası. getByTeacher(undefined) tüm taslakları döndürür (where: {}); bu davranış controller'a bırakılmış, servis varsayımı "çağıran ya teacherId verir ya admin tümünü ister".
- **Varsayım (ilişki):** Homework → assignments; update/delete taslağı günceller/siler; ilişkili Assignment kayıtları cascade'a bağlı (silinirse veya orphan kalırsa assignment tarafında hata).
