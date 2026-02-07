# Varsayım ihlalleri: `middleware.ts`

Her madde: hangi varsayım, ilgili satır(lar), nasıl veya hangi durumda ihlal ediliyor.

---

## 1. Ortam (NEXTAUTH_SECRET)

- **Varsayım:** `process.env.NEXTAUTH_SECRET` tanımlı; JWT doğrulama için kullanılıyor.
- **Satır:** 32 (`getToken({ req, secret: process.env.NEXTAUTH_SECRET })`).
- **Açıklama:** Secret burada kullanılıyor ama dosya içinde tanımlı olup olmadığı kontrol edilmiyor. Ortamda `NEXTAUTH_SECRET` yoksa `undefined` gider; `getToken` JWT’yi doğrulayamaz veya davranışı belirsizleşir. İhlal, ortamın yanlış/eksik konfigüre edilmesiyle oluşur.

---

## 2. Token şekli (role alanı)

- **Varsayım:** Token varsa `role` alanı vardır; değerler `'STUDENT'`, `'TEACHER'`, `'ADMIN'`.
- **Satırlar:** 40–44, 48–52.
- **Açıklama:** `token.role as string | undefined` ile rol açıkça “yok olabilir” kabul ediliyor. Token var ama `role` yoksa veya farklı bir stringse (ör. typo), 41–44 ve 49–52’deki karşılaştırmalar beklenen dallara girmeyebilir; bilinmeyen rol root için 51–52’de `/dashboard/teacher`’a düşer. Varsayım, JWT’nin gerçekten bu şekilde üretildiğine dayanıyor; JWT’de `role` eksik/yanlış ise ihlal oluşur.

---

## 3. Korumalı yollar (protectedPaths kapsamı)

- **Varsayım:** `protectedPaths` kimlik doğrulama gerektiren tüm route’ları kapsar.
- **Satırlar:** 5–25 (liste), 34 (`if (isProtected(pathname))`), 57 (`return NextResponse.next()`).
- **Açıklama:** Liste elle tutuluyor. Uygulamada yeni bir korumalı route eklenip `protectedPaths`’e eklenmezse, 34’te `isProtected` false döner, 57’de `next()` ile istek korumasız geçer. İhlal, liste güncellenmeden yeni korumalı path eklenmesiyle oluşur.

---

## 4. Hedef URL’ler

- **Varsayım:** `/login`, `/dashboard/student`, `/dashboard/teacher` tanımlı ve erişilebilir.
- **Satırlar:** 36–38 (`/login`), 42 (`/dashboard/student`), 43–44 (`/dashboard/teacher`), 50–52 (aynı hedefler), 54 (`/login`).
- **Açıklama:** Middleware bu URL’lere redirect veriyor; bu route’ların varlığını veya erişilebilirliğini kontrol etmiyor. Bu sayfalar kaldırılırsa veya path değişirse redirect’ler kırık/404 olur. İhlal, hedef route’ların silinmesi veya yeniden adlandırılmasıyla oluşur.

---

## 5. Matcher

- **Varsayım:** Sadece ilgili path’ler middleware’den geçer; `api`, `_next/static`, `_next/image`, `favicon.ico`, `login` gelmez.
- **Satır:** 61 (`matcher` regex’i).
- **Açıklama:** Bu sınır tamamen matcher’a bağlı. Regex değiştirilip örneğin `api` veya `login` matcher’a dahil edilirse, bu path’ler de middleware’e girer; login sayfası veya API istekleri yanlışlıkla korumalı gibi işlenebilir. İhlal, matcher’ın yanlış güncellenmesiyle oluşur.

---

## 6. Oturum kaynağı

- **Varsayım:** Geçerli oturum bilgisi NextAuth JWT ile temsil edilir; middleware başka kaynak kullanmaz.
- **Satır:** 32 (`getToken` tek kullanım).
- **Açıklama:** Şu an sadece `getToken` kullanıldığı için varsayım kodla uyumlu. İhlal riski: ileride cookie veya başka bir oturum kaynağı eklenirse “tek kaynak” varsayımı bozulur; 32 civarı veya yeni eklenen satırlar ihlal noktası olur.

---

## 7. Bilinmeyen rol

- **Varsayım:** Bilinmeyen rol için root ve dashboard yönlendirmesinde `/dashboard/teacher` kullanılır.
- **Satırlar:** 41–44 (dashboard path’i), 51–52 (root path’i).
- **Açıklama:** Root (`/`) için 51–52’de bilinmeyen rol gerçekten `/dashboard/teacher`’a gidiyor. Buna karşılık `pathname === '/dashboard'` (veya `/dashboard/`) için 41–44’te sadece `STUDENT` ve `TEACHER`/`ADMIN` dalları var; başka bir rol (veya `undefined`) bu bloka girmez, 44’ten sonra korumalı blok biter ve 57’de `next()` çalışır. Yani bilinmeyen rollü kullanıcı `/dashboard`’a gidince yönlendirilmez, doğrudan dashboard’a geçer. Root’ta teacher’a yönlendirme varsayımı var, dashboard girişinde aynı varsayım uygulanmıyor; tutarsızlık 41–44’teki eksik “bilinmeyen rol” dalından kaynaklanır.

---

## 8. Path eşleme

- **Varsayım:** `isProtected` tam eşleşme veya `p + '/'` prefix’i ile path’i kontrol eder; bu kurallar korumalı alanın sınırını belirler.
- **Satırlar:** 27–28 (`pathname === p || pathname.startsWith(p + '/')`).
- **Açıklama:** Büyük/küçük harf duyarlı: `pathname` tam olarak `p` ile aynı veya `p + '/'` ile başlamalı. Örneğin `/Dashboard` veya `/DASHBOARD` `p = '/dashboard'` ile eşleşmez, korumadan düşer. Ayrıca çift slash (`/dashboard//something`) `startsWith('/dashboard/')` ile eşleşir ve korumalı sayılır; uygulama farklı normalize ediyorsa sınır beklenenden farklı olabilir. İhlal, farklı casing veya path normalize kurallarının kullanılmasıyla oluşur.

---

## auth login

**Dosya:** `app/api/auth/[...nextauth]/route.ts` — Bu dosyada ihlal edilen veya ihlal edilebilecek varsayımlar (auth login / register sorumluluğuna ait invariant’lar).

---

### 1. authOptions geçerliliği

- **Varsayım:** `@/lib/auth` içindeki `authOptions` geçerli bir `NextAuthOptions` nesnesidir; NextAuth bu seçeneklerle doğru çalışır.
- **Hangi durumda ihlal olur:** `lib/auth.ts` yanlış export eder, `authOptions` eksik/bozuk alan içerir veya tip uyumsuzluğu oluşursa; veya modül yüklenirken hata olursa.
- **Sonuç:** Route handler `NextAuth(authOptions)` ile çalışırken NextAuth hata fırlatabilir veya giriş/oturum davranışı tutarsızlaşır; `/api/auth/*` istekleri 500 dönebilir veya yanlış yanıt verir. Dosya `authOptions`’ı doğrulamadığı için ihlal çalışma anında ortaya çıkar.

---

### 2. Ortam değişkenleri

- **Varsayım:** `NEXTAUTH_SECRET`, `NEXT_PUBLIC_API_URL` veya `VITE_API_URL` tanımlıdır; JWT imzalama ve backend URL’i buna göre çözülür.
- **Hangi durumda ihlal olur:** Bu değişkenler tanımsız veya yanlış ortamda farklı tanımlıysa; `lib/auth` import edilirken `authOptions` bu değerleri kullanır, route dosyası env’i kontrol etmez.
- **Sonuç:** Secret yoksa JWT imzalanamaz/doğrulanamaz; oturum kurulamaz veya cookie geçersiz sayılır. API URL yanlış/boşsa login isteği yanlış adrese gider veya başarısız olur; kullanıcı giriş yapamaz, hata sessiz kalabilir.

---

### 3. Backend login API

- **Varsayım:** Backend `POST {base}/api/auth/login` erişilebilirdir; 200 ve `{ user: { id, name, email, role }, token }` formatında cevap döner.
- **Hangi durumda ihlal olur:** Backend kapalı, ağ hatası, timeout; veya cevap 4xx/5xx, body farklı formatta (alan adları/tipler değişmiş) veya `user`/`token` eksikse. Route dosyası backend’i çağırmıyor ama `authOptions` içindeki `authorize` çağırıyor; bu çağrı bu dosyanın davranışına bağlı.
- **Sonuç:** `authorize` null döner; NextAuth girişi reddeder. Kullanıcı “geçersiz kimlik bilgisi” görür; gerçek sebep (backend down, format değişikliği) log’da görünmeyebilir. Rol/ token eksikse oturum yine oluşmaz veya hatalı oluşur.

---

### 4. NextAuth path’inin override edilmemesi

- **Varsayım:** `/api/auth/*` istekleri bu route handler’a düşer; başka bir route aynı path’i override etmez.
- **Hangi durumda ihlal olur:** `app/api/auth` altına farklı bir route (örn. `route.ts` veya daha spesifik catch-all) eklenirse veya dosya taşınırsa, istekler bu handler’a gelmeyebilir.
- **Sonuç:** NextAuth endpoint’leri 404 döner veya yanlış handler’a gider; giriş, çıkış, session istekleri çalışmaz; kullanıcı giriş yapamaz veya oturum alınamaz.

---

### 5. GET/POST handler export’ları

- **Varsayım:** GET ve POST istekleri bu handler’a iletilir; App Router sözleşmesi (GET/POST export) değişmez.
- **Hangi durumda ihlal olur:** Export’lar kaldırılır, yeniden adlandırılır veya farklı bir handler’a yönlendirilirse (örn. `handler as GET` yerine başka bir fonksiyon export edilirse).
- **Sonuç:** `/api/auth/*` GET veya POST istekleri bu handler’a ulaşmaz; NextAuth yanıt veremez, auth akışı kırılır.

---

### 6. Oturum stratejisi ve callback’ler

- **Varsayım:** `authOptions.session.strategy` JWT’dir; session ve jwt callback’leri `authOptions` içinde tanımlıdır ve token/session şeklini belirler.
- **Hangi durumda ihlal olur:** `lib/auth.ts` içinde strategy “database” yapılır veya callback’ler kaldırılır/bozulursa; route dosyası sadece `authOptions`’ı kullanır, içeriğini doğrulamaz.
- **Sonuç:** JWT yerine DB session kullanılırsa middleware ile uyumsuzluk (middleware JWT bekliyor). Callback’ler eksikse token/session’da `role`, `id` vb. olmaz; middleware ve client yanlış/eksik veri görür, yönlendirme veya yetki hataları oluşur.

---

### 7. signIn sayfası

- **Varsayım:** `authOptions.pages.signIn` (`/login`) mevcut bir sayfadır; NextAuth gerekince oraya yönlendirir.
- **Hangi durumda ihlal olur:** `/login` route’u kaldırılır veya path değiştirilirse; `authOptions` hâlâ `/login` gösteriyorsa. Route dosyası bu path’in varlığını kontrol etmez.
- **Sonuç:** NextAuth kullanıcıyı giriş sayfasına yönlendirdiğinde 404 veya yanlış sayfa açılır; kullanıcı giriş akışına ulaşamaz veya yanlış URL’e düşer.

---

## lib/auth

**Dosya:** `lib/auth.ts` — Bu dosyada ihlal edilen veya ihlal edilebilecek varsayımlar (lib/auth sorumluluğuna ait invariant'lar).

---

### 1. Backend URL

- **Varsayım:** `base`, backend'in gerçek base URL'idir; authorize içindeki fetch doğru adrese gider.
- **Hangi durumda ihlal olur:** Satır 4–5: `backendUrl` ve `base` sadece `process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL` veya fallback'ten türetiliyor; dosya bu değerin geçerliliğini kontrol etmiyor. Ortam yanlış set edilirse, farklı ortamda farklı değişken kullanılırsa veya fallback yanlış ortamda kalırsa fetch yanlış host'a gider.
- **Sonuç:** Giriş isteği yanlış sunucuya gider; authorize null dönebilir (giriş başarısız) veya yanlış sunucu 200 + user dönerse hatalı oturum oluşur. Auth akışı "başarılı" görünüp yanlış kimlikle oturum açılır.

---

### 2. Backend login cevabı

- **Varsayım:** 200 döndüğünde body `{ user: { id, name, email, role }, token }` formatındadır; user.role string kullanılabilir.
- **Hangi durumda ihlal olur:** Satır 25–28, 30–34: `data.user` ve `data.token` varlığı kontrol ediliyor ama `user.id`, `user.email`, `user.name`, `user.role` tipleri ve varlığı doğrulanmıyor. Backend farklı alan adı (örn. `user_role`), eksik role veya role'ü number/null gönderirse kod yine user döndürür (satır 29–35). JWT callback (satır 42–44) `user.role`'ü aynen token'a yazar; session callback (satır 50) `token.role`'ü aynen session'a yazar.
- **Sonuç:** Eksik/yanlış role ile oturum oluşur; token ve session'da undefined veya yanlış tip olur. Middleware ve client rol karşılaştırması bozulur; yanlış yönlendirme veya yetki hatası ortaya çıkar.

---

### 3. NEXTAUTH_SECRET

- **Varsayım:** authOptions.secret (NEXTAUTH_SECRET) tanımlıdır; NextAuth JWT imzalamak için kullanır.
- **Hangi durumda ihlal olur:** Satır 59: `secret: process.env.NEXTAUTH_SECRET`; dosya secret'ın tanımlı olup olmadığını kontrol etmiyor. Ortamda NEXTAUTH_SECRET yoksa undefined gider.
- **Sonuç:** NextAuth JWT'yi imzalayamaz veya doğrulayamaz; giriş sonrası cookie geçersiz olabilir veya session endpoint hatalı döner. Kullanıcı giriş yaptı sanır ama oturum sürdürülemez.

---

### 4. Oturum stratejisi

- **Varsayım:** session.strategy "jwt" olarak kalır; jwt'de user yalnızca giriş anında dolu gelir.
- **Hangi durumda ihlal olur:** Satır 56: `session: { strategy: 'jwt', ... }` sabit; dosya içinde değiştirilmezse ihlal bu dosyadan kaynaklanmaz. Strategy başka bir dosyada override edilir veya NextAuth sürümü farklı davranırsa jwt callback'in `user` ile tek seferlik çağrılması varsayımı bozulabilir.
- **Sonuç:** Strategy "database" vb. yapılırsa bu authOptions ile uyumsuzluk olur; session store beklenirken JWT kullanılıyor olabilir veya tam tersi. Oturum alınamayabilir veya role/id token'dan gelmeyebilir.

---

### 5. Callback sırası

- **Varsayım:** NextAuth önce authorize, başarılıysa jwt (user ile), sonra session (token ile) çağırır.
- **Hangi durumda ihlal olur:** Bu sıra NextAuth'un iç davranışına bağlı; lib/auth.ts callback'leri tanımlıyor (satır 39–55) ama sırayı zorlamıyor. NextAuth sürümü veya konfigürasyon değişirse callback sırası değişebilir; veya jwt callback'te `user` beklenmedik şekilde sonraki isteklerde de dolu gelirse token sürekli üzerine yazılır.
- **Sonuç:** Rol/token bir sonraki istekte güncellenmez veya yanlış sırada güncellenir; session ile JWT tutarsız olur. Client/middleware eski veya yanlış role görür.

---

### 6. Token payload tipi

- **Varsayım:** token.role, token.id, token.accessToken JWT'de saklanabilir tipte; session callback'te token'dan okunabilir.
- **Hangi durumda ihlal olur:** Satır 42–44: `user.role`, `user.id`, backend'den gelen `user.token` aynen token'a atanıyor; tip/format kontrolü yok. Backend role'ü object veya number döndürürse JWT serialize eder ama session callback'te (satır 50–52) `token.role as string` ile okunur; runtime'da uyumsuzluk veya beklenmedik değer olabilir. accessToken büyük veya binary ise payload boyutu sorun çıkarabilir.
- **Sonuç:** Session'da role/id/accessToken yanlış tip veya bozuk değer olabilir; middleware ve client hata verebilir veya yanlış karar verir.

---

### 7. session.user varlığı

- **Varsayım:** session callback çalıştığında session.user mevcuttur.
- **Hangi durumda ihlal olur:** Satır 48–49: `if (session.user)` ile korunuyor; session.user yoksa role/id atanmaz ama session yine döndürülür (satır 54). NextAuth bazen session.user'sız session nesnesi geçirirse (edge case veya sürüm farkı), session.user.role ve session.user.id atanmaz; client tarafında user.role undefined olur.
- **Sonuç:** Session alanı dolu görünür ama session.user.role ve session.user.id eksik; middleware/client rol bazlı mantık çalışmaz, yönlendirme veya yetki hataları oluşur.

---

### 8. signIn sayfası

- **Varsayım:** pages.signIn (`/login`) uygulamada tanımlıdır.
- **Hangi durumda ihlal olur:** Satır 57: `pages: { signIn: '/login' }` sabit; dosya /login route'unun varlığını kontrol etmiyor. Uygulamada /login kaldırılırsa veya path değişirse bu değer güncellenmez.
- **Sonuç:** NextAuth kullanıcıyı /login'e yönlendirir; 404 veya yanlış sayfa açılır. Giriş akışı kırılır veya kullanıcı yanlış URL'de kalır.

---

## service: auth.service

**Dosya:** `backend/src/services/auth.service.ts`

### 1. ADMIN rolü ile kayıt — iş kuralı / varsayım

- **Kural/varsayım:** İş kuralında yalnızca STUDENT ve TEACHER için User + ilişkili kayıt (Student/Teacher) tanımlı; varsayım 2 data.role için STUDENT/TEACHER sayıyor.
- **Hangi durumda ihlal olur:** RegisterInput validatörü ADMIN'e izin veriyorsa veya doğrudan API ile role: ADMIN gönderilirse; satır 27–40'ta sadece `data.role === 'STUDENT'` ve `data.role === 'TEACHER'` dalları var, ADMIN için ne Student ne Teacher kaydı oluşturulur.
- **Ortaya çıkan yanlış davranış:** ADMIN rolüyle User oluşur ama Teacher/Student kaydı olmaz; getProfile teacher ve student null döner; öğretmen/öğrenci bekleyen diğer servisler (assignment, student, evaluation vb.) 404 veya "Teacher/Student not found" verir.

### 2. İlk sınıf seçimi (findFirst) — varsayım 4

- **Kural/varsayım:** "classId yoksa ilk sınıf kullanılabilir"; hangi sınıfın "ilk" sayılacağı tanımlı değil.
- **Hangi durumda ihlal olur:** Satır 28: `prisma.class.findFirst()` orderBy olmadan çağrılıyor; veritabanı sırası veya index'e göre farklı kayıt dönebilir.
- **Ortaya çıkan yanlış davranış:** Ortam veya veri değişince aynı koşulda farklı sınıfa atanabilir; öğrenci yanlış sınıfta görünür, ödev/yoklama listeleri yanlış sınıfa göre filtrelenir.

### 3. Sınıf yokken STUDENT kaydı — iş kuralı

- **Kural/varsayım:** STUDENT rolünde User + Student kaydı; classId yoksa "ilk sınıf kullanılabilir", yoksa atlanır deniyor.
- **Hangi durumda ihlal olur:** Hiç Class kaydı yokken kayıt yapılırsa findFirst() null döner, classId null kalır, `if (classId)` girilmez; Student kaydı hiç oluşturulmaz ama User STUDENT rolüyle oluşur.
- **Ortaya çıkan yanlış davranış:** Öğrenci kullanıcı giriş yapar ama student.service getStudentAssignments/getAssignmentById çağrıldığında Student bulunamadığı için 404; uygulama "Student not found" verir.

---

## service: student.service

**Dosya:** `backend/src/services/student.service.ts`

### 1. Öğrencinin sınıfı zorunluluğu — varsayım 1

- **Kural/varsayım:** "studentId, userId ile eşleşen Student kaydına karşılık gelir; öğrencinin bir class'ı vardır." Şema da Student.classId zorunlu; ancak auth tarafında sınıfsız User (Student kaydı olmadan) veya başka bir senaryoda Student'ın class'ı silinmiş olabilir (cascade dışı değişiklik).
- **Hangi durumda ihlal olur:** student.class veya student.class.levelId erişimi (satır 25, 79, 94 vb.) yapılıyor; Prisma include ile class gelir. Eğer bir şekilde classId geçersiz/ silinmiş class'a referans veriyorsa class null olabilir; kod student.class.levelId kullanıyor, null ise runtime hatası.
- **Ortaya çıkan yanlış davranış:** TypeError (null/undefined üzerinden property erişimi); istek 500 döner.

### 2. Teslim öncesi consent — varsayım 3

- **Kural/varsayım:** "Consent kaydı varsa accepted alanı güvenilir; teslim öncesi consent zorunluluğu değişmez." getConsent consent yoksa { accepted: false } döndürüyor; UserConsent modelinde "accepted" boolean alanı yok, sadece acceptedAt var; servis "consent kaydı varsa accepted true" kabul ediyor.
- **Hangi durumda ihlal olur:** recordConsent sadece upsert ile userId ile kayıt oluşturuyor; "kabul edildi" bilgisi ayrı bir alan değil, kaydın varlığı "kabul" sayılıyor. Eğer iş kuralı "açık onay (checkbox)" gerektiriyorsa ve ileride UserConsent'a accepted boolean eklenirse, mevcut kayıtlar accepted: false sayılabilir; kod şu an sadece "consent var mı" bakıyor.
- **Ortaya çıkan yanlış davranış:** Şu an tutarlı; ileride accepted alanı eklenip servis güncellenmezse, eski kayıtlar "kabul etmemiş" sayılabilir veya tam tersi yanlış kabul çıkar.

### 3. submitAssignment: ödev hedefi kontrolü yok — iş kuralı

- **Kural/varsayım:** Ödevler öğrencinin seviyesi/hedefi ile eşleşmeli; getStudentAssignments ve getAssignmentById bu filtreyi uyguluyor.
- **Hangi durumda ihlal olur:** submitAssignment (satır 161–165) assignment'ı sadece id ile buluyor; ödevin bu öğrencinin seviyesinde veya hedefinde (class/student) olduğu kontrol edilmiyor.
- **Ortaya çıkan yanlış davranış:** Başka seviye veya hedefteki bir ödev assignmentId bilinerek teslim edilebilir; yetkisiz teslim kabul edilmiş olur.

---

## service: assignment.service

**Dosya:** `backend/src/services/assignment.service.ts`

### 1. Benzer ödev dönüşü — iş kuralı

- **Kural/varsayım:** "Benzerlik kontrolü (similarity) servis içinde kullanılır; çift ödev uyarısı/engeli iş kuralına bağlı."
- **Hangi durumda ihlal olur:** createAssignment sonunda (satır 122–124) `similarAssignments: []` sabit döndürülüyor; SimilarityService instance var ama create akışında findSimilarAssignments çağrılıp sonuç dönmüyor veya çift ödev engeli uygulanmıyor.
- **Ortaya çıkan yanlış davranış:** Benzer ödev uyarısı/engeli çalışmaz; aynı başlıkta farklı hafta veya benzer içerikte çift ödev oluşturulabilir.

### 2. Tekrarlanan ödev kontrolü (title trim) — iş kuralı

- **Kural/varsayım:** "Aynı öğretmen + levelId + title + weekNumber ile tekrarlanan ödev 409."
- **Hangi durumda ihlal olur:** title (satır 21) trim ediliyor; mevcut ödevlerde title'ın trim edilmiş hali ile karşılaştırma yapılıyor. Eğer DB'de "  Ödev 1  " gibi kayıtlı bir ödev varsa findFirst where: { title } ile aranırken "Ödev 1" ile eşleşmeyebilir (Prisma tam eşleşme yapar).
- **Ortaya çıkan yanlış davranış:** Görünürde aynı başlıkla ikinci ödev 409 yerine oluşturulabilir; veya tam tersi boşluk farkıyla gereksiz 409 alınabilir.

### 3. studentIds geçerliliği — varsayım 1

- **Kural/varsayım:** "teacherId, userId ile eşleşen Teacher'ın id'si; levelId, classId, studentIds geçerli ID'ler."
- **Hangi durumda ihlal olur:** Satır 109–118: data.studentIds döngüyle AssignmentTarget olarak ekleniyor; studentId'nin gerçekten bu seviye/sınıfta bir öğrenciye ait olduğu veya aynı öğretmenin erişebildiği biri olduğu kontrol edilmiyor.
- **Ortaya çıkan yanlış davranış:** Geçersiz veya başka sınıftaki studentId ile hedef oluşturulabilir; ödev yanlış öğrencilere görünür veya FK hatası oluşur.

---

## service: announcement.service

**Dosya:** `backend/src/services/announcement.service.ts`

### 1. list limit üst sınırı — varsayım 3

- **Kural/varsayım:** "list limit makul aralıkta; aşırı büyük limit performans riski."
- **Hangi durumda ihlal olur:** list(limit = 50) parametreyi doğrudan take'e veriyor (satır 7); çağıran çok büyük limit (örn. 100000) geçerse kontrol yok.
- **Ortaya çıkan yanlış davranış:** Aşırı büyük limit ile çok sayıda duyuru çekilir; DB ve bellek yükü, yavaş yanıt veya timeout.

### 2. delete yetki kontrolü — varsayım 2

- **Kural/varsayım:** "delete çağrısı yetkili kullanıcı tarafından yapılır (servis yetki kontrolü yapmıyor)."
- **Hangi durumda ihlal olur:** delete(id) (satır 22–24) sadece id ile siler; servis içinde yazar veya rol kontrolü yok; controller/route yetki atlarsa herkes her duyuruyu silebilir.
- **Ortaya çıkan yanlış davranış:** Yetkisiz kullanıcı duyuru silebilir; veri kaybı veya yetki açığı.

---

## service: attendance.service

**Dosya:** `backend/src/services/attendance.service.ts`

### 1. durationMinutes sınırı — iş kuralı

- **Kural/varsayım:** "Süre (varsayılan 15 dk), startTime/endTime set edilir"; üst/alt sınır belirtilmemiş.
- **Hangi durumda ihlal olur:** startSession durationMinutes parametresi (satır 21) doğrudan endTime hesaplamada kullanılıyor; negatif veya çok büyük değer (örn. 999999) gelebilir, kontrol yok.
- **Ortaya çıkan yanlış davranış:** Negatif süre ile endTime geçmişte kalır; katılım hep "süre dolmuş" sayılır. Çok büyük süre ile oturum aylar sonraya açık kalır; mantıksal hata.

### 2. Kod çakışması / sonsuz döngü — varsayım 3

- **Kural/varsayım:** "Kod uzunluğu ve sayısal aralık çakışma olasılığını makul tutar."
- **Hangi durumda ihlal olur:** generateCode() 6 haneli sayısal kod üretiyor (10^6 kombinasyon); do-while ile çakışma varsa yeni kod deniyor. Teorik olarak tüm kodlar dolu ise döngü sonsuza gidebilir; pratikte düşük olasılık.
- **Ortaya çıkan yanlış davranış:** Aşırı yük altında çok sayıda eşzamanlı startSession ile kod çakışması artar; nadiren istek takılabilir veya yavaşlar.

---

## service: evaluation.service

**Dosya:** `backend/src/services/evaluation.service.ts`

### 1. score tipi / aralığı — varsayım 2

- **Kural/varsayım:** "EvaluationInput validatörden geçmiş; score aralığı ve tipler uyumlu."
- **Hangi durumda ihlal olur:** payload.score (satır 29) doğrudan Prisma'ya veriliyor; validatör atlanırsa veya score null/string gelirse Prisma hata verebilir veya yanlış yazılır.
- **Ortaya çıkan yanlış davranış:** Geçersiz score ile evaluation kaydı bozulur veya DB hatası; raporlama/analitik yanlış sonuç verir.

---

## service: timeline.service

**Dosya:** `backend/src/services/timeline.service.ts`

### 1. delete sahiplik kontrolü — iş kuralı

- **Kural/varsayım:** "delete: Sadece post'un sahibi öğretmen silebilir; aksi 403."
- **Hangi durumda ihlal olur:** Kodda (satır 67) post.teacherId !== teacher.id ise 403 atılıyor; bu kural uygulanıyor. İhlal: teacherUserId'nin gerçekten giriş yapmış öğretmene ait olduğu controller/route'dan geliyor; token sahteleşirse başka öğretmen adına silme yapılamaz ama "kendi post'u" başka öğretmenin teacherId'si ile eşleşmez, 403 doğru çalışır. Varsayım 1 "teacherUserId → Teacher ilişkisi geçerli" — bu dışarıdan sağlanıyor; servis sadece teacherId eşleşmesine bakıyor. İhlal noktası: post silinirken başka ilişkili veri (örn. attachment) temizlenmiyorsa veri tutarsızlığı olabilir; şemaya bağlı.

Özet: Timeline servisi sahiplik kontrolü yapıyor; ek ihlal: create'te classId'nin öğretmenin erişebildiği bir sınıf olduğu kontrol edilmiyor — yanlış classId ile post oluşturulabilir.

---

## service: teacherWiki.service

**Dosya:** `backend/src/services/teacherWiki.service.ts`

### 1. isAdmin güvenilirliği — varsayım 1

- **Kural/varsayım:** "teacherUserId → Teacher; isAdmin bilgisi güvenilir şekilde dışarıdan gelir."
- **Hangi durumda ihlal olur:** update/delete'ta isAdmin true ise sahiplik kontrolü atlanıyor (satır 66, 91); isAdmin değeri controller'dan gelir, client veya token manipülasyonu ile yanlış true gönderilirse herkes tüm sayfaları düzenleyebilir/silebilir.
- **Ortaya çıkan yanlış davranış:** Yetkisiz kullanıcı admin gibi davranıp tüm wiki sayfalarını değiştirebilir veya silebilir.

---

## service: teacherResource.service

**Dosya:** `backend/src/services/teacherResource.service.ts`

### 1. delete sahiplik — iş kuralı

- **Kural/varsayım:** "delete: Kaynak bulunmalı ve resource.teacherId, isteği atan öğretmenle eşleşmeli; değilse 403." Kod bunu uyguluyor (satır 52). Varsayım: teacherUserId → Teacher.
- **Hangi durumda ihlal olur:** teacherUserId'nin doğruluğu route/auth'a bağlı; servis sadece teacher.id ile resource.teacherId karşılaştırıyor. Ek: create'te levelId'nin geçerli Level id'si olduğu kontrol edilmiyor; geçersiz levelId ile kayıt oluşursa FK hatası veya bozuk ilişki.
- **Ortaya çıkan yanlış davranış:** Geçersiz levelId ile create çağrılırsa DB hatası veya yanlış level'a bağlı kayıt.

---

## service: errorBank.service

**Dosya:** `backend/src/services/errorBank.service.ts`

### 1. add yetkisi — varsayım 2

- **Kural/varsayım:** "Öğretmen herhangi bir öğrenciye hata ekleyebilir (yetki controller'da kısıtlanabilir)."
- **Hangi durumda ihlal olur:** add içinde öğretmen ve öğrenci varlığı kontrol ediliyor; "bu öğretmen bu öğrenciye değerlendirme yapmış mı / sınıfında mı" gibi bir kısıt yok. Controller kısıtlamazsa her öğretmen her öğrenciye hata ekleyebilir.
- **Ortaya çıkan yanlış davranış:** İstenmeyen yetki genişliği; veri bütünlüğü iş kuralına göre "sadece kendi öğrencime ekleyebilir" ise ihlal.

### 2. errorText boş — iş kuralı

- **Kural/varsayım:** "add: Öğretmen ve öğrenci geçerli; errorText trim."
- **Hangi durumda ihlal olur:** errorText trim sonrası boş string ise kontrol yok; prisma.errorBankEntry.create({ errorText: data.errorText.trim() }) ile boş string yazılabilir.
- **Ortaya çıkan yanlış davranış:** Anlamsız boş hata kayıtları; uniqueErrors gruplamasında boş metin bir "hata" gibi görünür.

---

## service: intervention.service

**Dosya:** `backend/src/services/intervention.service.ts`

### 1. Eşik sabitliği — varsayım 2

- **Kural/varsayım:** "Üst üste 2" ve "2 kaçırılan ödev" eşikleri sabit; değişirse iş kuralı güncellenir.
- **Hangi durumda ihlal olur:** Eşikler (2 devamsızlık, 2 kaçırılan ödev) koda sabit yazılmış; config veya ortam değişkeni yok. Kurum farklı eşik (örn. 3 devamsızlık) isterse kod değişikliği gerekir; aynı kod farklı ortamlarda farklı eşik destekleyemez.
- **Ortaya çıkan yanlış davranış:** İş kuralı değişince uygulama yanlış eşikle çalışmaya devam eder; yanlış öğrenciler risk listesine girer veya çıkar.

### 2. getAtRiskStudents öğretmen filtresi — iş kuralı

- **Kural/varsayım:** "getAtRiskStudents: teacherUserId opsiyonel (filtre uygulanabilir)."
- **Hangi durumda ihlal olur:** Kodda getAtRiskStudents(teacherUserId?) parametresi kullanılmıyor; tüm öğrenciler taranıyor, öğretmene göre filtre yok.
- **Ortaya çıkan yanlış davranış:** Öğretmen "sadece benim sınıfımdaki riskliler" beklerken tüm sistemdeki riskli öğrenciler döner; performans ve yetki karışıklığı.

---

## service: makeUp.service

**Dosya:** `backend/src/services/makeUp.service.ts`

### 1. createSlot slotEnd > slotStart — iş kuralı

- **Kural/varsayım:** "slotEnd > slotStart (400); maxStudents 1–50 (400)." Kod slotEnd <= slotStart ve maxStudents aralığı kontrol ediyor (satır 24–25).
- **Hangi durumda ihlal olur:** slotStart ve slotEnd aynı anda verilirse veya farklı gün/saat dilimi karışıklığında slotEnd slotStart'tan önce gelebilir; kontrol var. Gelecek tarih kontrolü yok: slotStart geçmiş tarih olabilir.
- **Ortaya çıkan yanlış davranış:** Geçmiş tarihli slot oluşturulabilir; getAvailableForStudent "gelecek" filtreliyorsa listelenmez ama veri kirliliği.

### 2. Rezervasyon kapasite — varsayım 2

- **Kural/varsayım:** "Kapasite kontrolü booking sayısı ile yapılır."
- **Hangi durumda ihlal olur:** Rezervasyon yapan metod _count veya mevcut booking sayısı ile maxStudents karşılaştırmalı; eşzamanlı iki istek aynı anda kapasiteyi aşabilir (race condition) if kontrolü tek başına yeterli olmayabilir.
- **Ortaya çıkan yanlış davranış:** Slot kapasitesi aşılabilir; maxStudents'tan fazla rezervasyon oluşur.

---

## service: peerReview.service

**Dosya:** `backend/src/services/peerReview.service.ts`

### 1. Kendi teslimine puan — iş kuralı

- **Kural/varsayım:** "submitPeerReview: Kendi teslimine puan verilemez (400)." Kod submission.studentId === student.id kontrolü yapıyor (satır 80).
- **Hangi durumda ihlal olur:** Kural uygulanıyor. İhlal: Aynı teslime ikinci puan 409 (existing kontrolü satır 83–88) — aynı reviewer aynı submission'a iki PeerReview oluşturmaya çalışırsa unique constraint veya findUnique ile engellenmeli; kod existing kontrolü yapıyor, tutarlı. Özet: Bu serviste belirgin ihlal yok; varsayım "peerReviewsPerStudent atanacak değerlendirme sayısı" — atama mantığı getSubmissionsToReview içinde; eksik atama yapılırsa bazı teslimler hiç puanlanmayabilir (iş kuralı ihlali değil, tasarım tercihi).

---

## service: similarity.service

**Dosya:** `backend/src/services/similarity.service.ts`

### 1. findSimilarAssignments kullanımı — varsayım 3

- **Kural/varsayım:** "findSimilarAssignments çağrıldığında öğretmen ve seviye geçerli."
- **Hangi durumda ihlal olur:** AssignmentService createAssignment içinde findSimilarAssignments çağrılmıyor; similarityService instance var ama create sonunda similarAssignments boş dönüyor. Yani "benzer ödev var mı" sorusu create akışında sorulmuyor.
- **Ortaya çıkan yanlış davranış:** Benzer ödev uyarısı/engeli çalışmaz (assignment.service ihlali ile aynı).

---

## service: analytics.service

**Dosya:** `backend/src/services/analytics.service.ts`

### 1. Aggregate / null — varsayım 1

- **Kural/varsayım:** "Prisma aggregate, groupBy, count sorguları doğru sonuç verir; ilişkiler tutarlı."
- **Hangi durumda ihlal olur:** evaluation.aggregate _avg score kullanılıyor; hiç evaluation yoksa veya tüm score null ise _avg null döner; bu değer doğrudan averageScore olarak kullanılırsa tip/undefined hatası veya yanlış rapor çıkar.
- **Ortaya çıkan yanlış davranış:** Dashboard'da ortalama puan NaN veya null gösterilir; frontend hata verebilir.

### 2. Büyük veri performansı — varsayım 3

- **Kural/varsayım:** "Büyük veri setinde performans (limit, sayfa boyutu) kabul edilebilir."
- **Hangi durumda ihlal olur:** getDashboardStats ve diğer raporlar limit/sayfalama kullanmıyor; tüm assignment, submission vb. taranıyorsa veri büyüdükçe yanıt süresi artar.
- **Ortaya çıkan yanlış davranış:** Yavaş veya timeout; kullanıcı dashboard/rapor açamaz.

---

## service: homework.service

**Dosya:** `backend/src/services/homework.service.ts`

### 1. getById yetki kontrolü yok — varsayım

- **Kural/varsayım:** update/delete sahiplik kontrolü yapılıyor; getById'in de sadece sahibin veya yetkili kullanıcının taslağı okuması beklenebilir.
- **Hangi durumda ihlal olur:** getById(id) (satır 48) sadece id ile homework getiriyor; çağıranın bu taslağa erişim yetkisi (aynı öğretmen veya admin) kontrol edilmiyor.
- **Ortaya çıkan yanlış davranış:** Taslak id'si bilindiğinde herhangi bir kullanıcı başka öğretmenin taslağını okuyabilir; bilgi sızıntısı.
