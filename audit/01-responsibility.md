# Sorumluluk denetimi: `middleware.ts`

## Tek sorumluluk

**Sorumluluk:** Kimlik doğrulama ve rol bilgisine göre **hangi isteğin nereye yönlendirileceğini** (redirect veya geçiş) belirlemek; korumalı yollara erişimi yalnızca oturum açmış kullanıcılara vermek.

Bu middleware’in tek işi: “Bu path korumalı mı?”, “Token var mı?”, “Rol ne?” sorularına göre **yönlendirme kararı vermek**. Kimlik doğrulama mekanizmasını (NextAuth) veya rol tanımlarını üretmez; sadece token ve path’e göre karar verir.

---

## Bu sorumluluğun doğru çalışması için varsayımlar (invariants)

1. **Ortam:** `process.env.NEXTAUTH_SECRET` tanımlı; JWT doğrulama için kullanılıyor.
2. **Token şekli:** Token varsa `role` alanı vardır; beklenen değerler: `'STUDENT'`, `'TEACHER'`, `'ADMIN'`.
3. **Korumalı yollar:** `protectedPaths` listesi, kimlik doğrulama gerektiren tüm route’ları kapsar; listede olmayan path’ler bu middleware tarafından korunmaz.
4. **Hedef URL’ler:** `/login`, `/dashboard/student`, `/dashboard/teacher` route’ları tanımlı ve erişilebilir.
5. **Matcher:** `config.matcher` ile sadece ilgili path’ler bu middleware’den geçer; `api`, `_next/static`, `_next/image`, `favicon.ico`, `login` bu middleware’e gelmez.
6. **Oturum kaynağı:** Geçerli oturum bilgisi NextAuth JWT ile temsil edilir; middleware başka bir oturum kaynağı kullanmaz.
7. **Bilinmeyen rol:** Token’da `role` yok veya beklenen değerlerden biri değilse, root (`/`) ve dashboard yönlendirmesinde `/dashboard/teacher` kullanılır (mevcut davranış).
8. **Path eşleme:** `isProtected` için path hem tam eşleşme (`pathname === p`) hem prefix eşleşme (`pathname.startsWith(p + '/')`) ile kontrol edilir; bu iki kural korumalı alanın sınırını belirler.

Bu varsayımlar sağlandığı sürece middleware’in sorumluluğu (korumalı yollar + rol bazlı yönlendirme) tutarlı çalışır.

---

## auth login / register

**Dosya:** `app/api/auth/[...nextauth]/route.ts`

### Tek sorumluluk

**Sorumluluk:** NextAuth’un kimlik doğrulama API’sini HTTP üzerinden sunmak; giriş, çıkış, oturum ve provider uç noktalarının `/api/auth/*` path’lerinde (GET/POST) çalışmasını sağlamak.

Bu dosya yalnızca `authOptions` ile NextAuth’u bağlayıp istekleri GET ve POST handler’larına yönlendirir. Giriş/kayıt mantığı, credential doğrulama ve JWT/session davranışı `lib/auth.ts` içindeki `authOptions` ile tanımlıdır; route’un tek işi bu yapıyı uygulamanın auth API’si olarak dışarı açmaktır.

### Bu sorumluluğun doğru çalışması için varsayımlar (invariants)

1. **authOptions:** `@/lib/auth` içindeki `authOptions` geçerli bir `NextAuthOptions` nesnesidir; NextAuth bu seçeneklerle doğru şekilde çalışır.
2. **Ortam:** `authOptions` ve NextAuth’un kullandığı ortam değişkenleri (örn. `NEXTAUTH_SECRET`, `NEXT_PUBLIC_API_URL` veya `VITE_API_URL`) tanımlıdır; JWT imzalama ve backend URL’i buna göre çözülür.
3. **Backend login API:** Credentials provider’ın çağırdığı backend `POST {base}/api/auth/login` ucu erişilebilirdir; 200 ve `{ user: { id, name, email, role }, token }` formatında cevap döner; hata durumunda uygun HTTP status döner.
4. **NextAuth path:** Bu route `app/api/auth/[...nextauth]/route.ts` altında olduğu sürece NextAuth varsayılan path’leri (`/api/auth/signin`, `/api/auth/signout`, `/api/auth/session`, vb.) bu handler’a düşer; başka bir route aynı path’i override etmez.
5. **Handler export:** GET ve POST istekleri bu handler’a iletildiği sürece NextAuth kendi iç yönlendirmesini (signin, callback, session vb.) yapabilir; App Router’ın route sözleşmesi (GET/POST export) değişmez.
6. **Oturum stratejisi:** `authOptions.session.strategy` JWT olarak kalır; session ve jwt callback’leri `authOptions` içinde tanımlıdır ve token/session şeklini belirler.
7. **signIn sayfası:** `authOptions.pages.signIn` (`/login`) mevcut bir sayfadır; NextAuth gerekince oraya yönlendirir.

Bu varsayımlar sağlandığı sürece auth API (login / register akışı dahil) tutarlı çalışır.

---

## lib/auth

**Dosya:** `lib/auth.ts`

### Tek sorumluluk

**Sorumluluk:** Uygulamanın kimlik doğrulama yapılandırmasını tek yerde tanımlamak; kimlik bilgilerinin nereden doğrulanacağını (backend), JWT payload’ının nasıl oluşturulacağını (jwt callback) ve session nesnesinin JWT’den nasıl türetileceğini (session callback) belirlemek.

Bu dosya NextAuth’a “nasıl giriş yapılacak” ve “oturum bilgisi hangi alanlardan gelecek” bilgisini verir. JWT’yi fiziksel olarak imzalayan NextAuth’tur; bu dosya imzalanacak payload’ın içeriğini (id, role, accessToken vb.) ve session’a hangi alanların taşınacağını tanımlar.

---

### JWT üretimi, callback’ler ve role’ün token’a yazılması

- **JWT üretimi:** Bu dosya JWT’yi kendisi üretmez; NextAuth, `authOptions` içindeki `secret` ile JWT’yi imzalar. JWT’nin **içeriği** (payload) ise bu dosyada belirlenir: `jwt` callback’ine gelen `token` nesnesi, NextAuth tarafından imzalanıp cookie’ye yazılır. Yani “JWT üretimi” burada: jwt callback’in döndürdüğü `token` objesinin alanları = JWT payload.

- **authorize:** Giriş denemesi sırasında çağrılır. Backend `POST {base}/api/auth/login` ile email/password gönderilir; cevap `{ user, token }` olarak beklenir. `user` içinden `id`, `email`, `name`, `role` ve backend’in döndürdüğü `token` alınır; bu nesne NextAuth’a döndürülür. Başarısızlıkta `null` dönülür. Bu adımda rol bilgisi backend cevabındaki `user.role` ile alınır; dosya bu değeri doğrulamaz, aynen kullanır.

- **jwt callback:** İki durumda çalışır. (1) **Giriş anında:** `user` dolu gelir; `token.role = user.role`, `token.id = user.id`, `token.accessToken = user.token` atanır. Böylece **role bilgisi token’a yazılmış olur**; NextAuth bu `token` objesini imzalayıp cookie’de saklar. (2) **Sonraki isteklerde:** `user` yoktur; mevcut `token` (cookie’den okunmuş) aynen döndürülür, yeniden yazılmaz. Özet: Role, yalnızca ilk girişte `authorize`’dan gelen `user.role` ile token’a bir kez yazılır; sonraki isteklerde token güncellenmez.

- **session callback:** Client session istediğinde (örn. `getSession()` veya `/api/auth/session`) çalışır. JWT’den gelen `token` nesnesindeki alanlar session’a kopyalanır: `session.user.role = token.role`, `session.user.id = token.id`, `session.accessToken = token.accessToken`. Böylece **role**, token’dan session’a taşınır; client ve middleware `session.user.role` veya JWT’deki `role` ile erişir. Bu dosyada rol için ek doğrulama veya dönüşüm yok; token’da ne varsa session’a aynen yazılır.

- **Özet akış:** Backend login cevabı (`user.role`) → authorize return → jwt callback’te `token.role = user.role` → NextAuth JWT’yi imzalayıp cookie’ye yazar → session callback’te `session.user.role = token.role` → client/middleware session veya getToken ile role’e erişir.

---

### Bu sorumluluğun doğru çalışması için varsayımlar (invariants)

1. **Backend URL:** `NEXT_PUBLIC_API_URL` veya `VITE_API_URL` (veya fallback) ile hesaplanan `base`, backend’in gerçek base URL’idir; `authorize` içindeki fetch doğru adrese gider.
2. **Backend login cevabı:** `POST {base}/api/auth/login` 200 döndüğünde body `{ user: { id, name, email, role }, token }` formatındadır; `user` ve `token` alanları vardır. `user.role` string olarak kullanılabilir (doğrulama bu dosyada yapılmaz).
3. **NEXTAUTH_SECRET:** `authOptions.secret` (NEXTAUTH_SECRET) tanımlıdır; NextAuth JWT’yi imzalamak ve doğrulamak için kullanır.
4. **Oturum stratejisi:** `session.strategy` "jwt" olarak kalır; jwt ve session callback’ler bu mode’a göre çağrılır (jwt’de user yalnızca giriş anında dolu gelir).
5. **Callback sırası:** NextAuth önce authorize’ı, başarılıysa jwt callback’i (user ile), sonra gerektiğinde session callback’i (token ile) çağırır; bu sıra değişmez.
6. **Token payload tipi:** jwt callback’te atanan `token.role`, `token.id`, `token.accessToken` NextAuth’un JWT payload’ında saklanabilir tipte (serialize edilebilir) kalır; sonradan session callback’te token’dan okunabilir.
7. **session.user varlığı:** session callback çalıştığında `session.user` mevcuttur; böylece `session.user.role` ve `session.user.id` atanabilir.
8. **signIn sayfası:** `pages.signIn` (`/login`) uygulamada tanımlıdır; NextAuth yönlendirme için kullanır.

Bu varsayımlar sağlandığı sürece lib/auth’un sorumluluğu (kimlik doğrulama yapılandırması, JWT payload ve session şeklinin tanımı) tutarlı çalışır.

---

## service: auth.service

**Dosya:** `backend/src/services/auth.service.ts`

### Tek sorumluluk

**Sorumluluk:** Kullanıcı kaydı (register), giriş (login) ve profil bilgisi (getProfile) işlemlerini veritabanı ve şifre/JWT yardımıyla yürütmek; rol ve ilişkili kayıtlar (Student/Teacher) ile token üretimini tek katmanda toplamak.

### İş kuralları

- Kayıtta e-posta benzersiz olmalı; aynı e-posta ile tekrar kayıt 409.
- Şifre hash'lenerek saklanır; düz metin saklanmaz.
- STUDENT rolünde kayıt: User + (varsa classId ile) Student kaydı; classId yoksa ilk sınıf kullanılabilir.
- TEACHER rolünde kayıt: User + Teacher kaydı.
- Giriş: e-posta ile kullanıcı bulunur; şifre karşılaştırması yapılır; geçersizse 401.
- Başarılı giriş/kayıt sonrası JWT üretilir (userId, email, role); cevapta user bilgisi + token döner.
- getProfile: userId ile kullanıcı bulunur; öğrenciyse class/level dahil, öğretmense teacher bilgisi dahil; yoksa 404.

### Varsayımlar (invariants)

1. Prisma ve DB erişilebilir; User, Student, Teacher modelleri şemaya uygun.
2. RegisterInput/LoginInput validatörlerden geçmiş; data.role enum değerlerinden biri (STUDENT/TEACHER).
3. hashPassword / comparePassword ve generateToken güvenli ve tutarlı çalışır.
4. En az bir Class kaydı yoksa STUDENT kaydında classId atlanır (Student kaydı sınıfsız oluşabilir).
5. JWT secret ve süre backend ortamında tanımlı; token doğrulama aynı secret ile yapılır.

---

## service: student.service

**Dosya:** `backend/src/services/student.service.ts`

### Tek sorumluluk

**Sorumluluk:** Öğrenci tarafı ödev listesi, ödev detayı, teslim (submission), değerlendirme görüntüleme ve onay (consent) işlemlerini öğrenci kimliği ve sınıf/seviye kısıtlarına göre yürütmek.

### İş kuralları

- Ödevler: öğrencinin sınıfının levelId'si ile eşleşen, isDraft false, hedef yok veya hedefte bu sınıf/öğrenci olan ödevler; active / upcoming / past (tarih ve teslim durumuna göre) ayrılır.
- getAssignmentById: ödev hem id hem öğrenci seviyesi/hedefi ile eşleşmeli; yoksa 404.
- Teslim öncesi onay (consent) kontrolü; onay yoksa teslim reddedilir.
- Aynı ödeve ikinci teslim 409; tek teslim kuralı.
- getSubmission / getEvaluations: öğrenci ve teslim/ödev ilişkisi doğrulanır; yetkisiz erişim 404.

### Varsayımlar (invariants)

1. studentId, userId ile eşleşen Student kaydına karşılık gelir; öğrencinin bir class'ı vardır.
2. Assignment targets (class/student) ve levelId tutarlı; ödevler seviye bazlı filtrelenir.
3. Consent kaydı varsa accepted alanı güvenilir; teslim öncesi consent zorunluluğu değişmez.
4. SubmissionInput validatörden geçmiş; gerekli alanlar mevcut.

---

## service: assignment.service

**Dosya:** `backend/src/services/assignment.service.ts`

### Tek sorumluluk

**Sorumluluk:** Ödev (assignment) oluşturma, güncelleme, listeleme ve hedefleme (sınıf/öğrenci); taslak (homework) ile ilişki ve benzerlik kontrolü (SimilarityService) dahil ödev yaşam döngüsünü yönetmek.

### İş kuralları

- Oluşturan öğretmen geçerli Teacher kaydına karşılık gelmeli; yoksa 404.
- homeworkId varsa taslak o öğretmene ait olmalı; yoksa 404. Yeni ödev için title, levelId, weekNumber zorunlu.
- Aynı öğretmen + levelId + title + weekNumber ile tekrarlanan ödev 409.
- Hedef: classId verilirse CLASS hedefi; studentIds verilirse STUDENT hedefleri; ikisi de yoksa tüm seviye.
- Taslak (homework) yoksa create sırasında homework oluşturulur; assignment homework'e bağlanır.
- Benzerlik kontrolü (similarity) servis içinde kullanılır; çift ödev uyarısı/engeli iş kuralına bağlı.

### Varsayımlar (invariants)

1. teacherId, userId ile eşleşen Teacher'ın id'si; levelId, classId, studentIds geçerli ID'ler.
2. AssignmentInput validatörden geçmiş; startDate, dueDate, homeworkType vb. uyumlu.
3. SimilarityService findSimilarAssignments ile tutarlı sonuç döner.
4. Hedef tipleri (CLASS / STUDENT) ve target kayıtları şema ile uyumlu.

---

## service: announcement.service

**Dosya:** `backend/src/services/announcement.service.ts`

### Tek sorumluluk

**Sorumluluk:** Duyuru listeleme, oluşturma ve silme işlemlerini veritabanı üzerinden sağlamak; yazar (author) bilgisini ilişkilendirmek.

### İş kuralları

- list: En son oluşturulan duyurular, varsayılan limit 50; author id ve name dahil.
- create: title, body, authorId (opsiyonel); authorId null olabilir.
- delete: id ile tek duyuru silinir; yetki kontrolü servis dışında (controller/route) yapılır.

### Varsayımlar (invariants)

1. Announcement modeli ve Author (User) ilişkisi şemada tanımlı.
2. delete çağrısı yetkili kullanıcı tarafından yapılır (servis yetki kontrolü yapmıyor).
3. list limit makul aralıkta; aşırı büyük limit performans riski.

---

## service: attendance.service

**Dosya:** `backend/src/services/attendance.service.ts`

### Tek sorumluluk

**Sorumluluk:** Yoklama oturumu başlatma (kod üretimi, süre, konum), öğrencinin koda ile katılımı (konum/mesafe), oturum ve kayıt listeleme işlemlerini yönetmek.

### İş kuralları

- startSession: Öğretmen ve sınıf geçerli olmalı; kod 6 haneli benzersiz; süre (varsayılan 15 dk), startTime/endTime set edilir; konum/topic/resourceLinks opsiyonel.
- joinSession: Öğrenci, kod ile oturum bulunur; oturum süresi içinde olmalı; konum verilmişse MAX_DISTANCE_METERS (50 m) içinde olmalı; aynı öğrenci-oturum için tek kayıt.
- Oturum kodu benzersiz; çakışma olana kadar yeni kod üretilir.

### Varsayımlar (invariants)

1. Teacher ve Class geçerli; Student'ın classId'si oturumun classId'si ile eşleşmeli (aynı sınıf).
2. haversineDistance doğru hesaplar; latitude/longitude WGS84.
3. Kod uzunluğu ve sayısal aralık çakışma olasılığını makul tutar.
4. Oturum süresi (endTime) geçmişse katılım kabul edilmez.

---

## service: evaluation.service

**Dosya:** `backend/src/services/evaluation.service.ts`

### Tek sorumluluk

**Sorumluluk:** Öğretmenin bir teslime (submission) puan, geri bildirim ve kabul/red (accepted) bilgisini yazması; değerlendirme kaydının tekilleştirilmesi (upsert).

### İş kuralları

- Değerlendirme yapan kullanıcı Teacher olmalı; teslim, ödevi o öğretmenin oluşturduğu ödeve ait olmalı; aksi halde 403/404.
- submissionId başına tek Evaluation (upsert: varsa güncelle, yoksa oluştur).
- score, feedback, accepted, annotationData alanları isteğe göre güncellenir; accepted boolean zorunlu.

### Varsayımlar (invariants)

1. userId öğretmene karşılık gelir; submission ve assignment ilişkisi tutarlı.
2. EvaluationInput validatörden geçmiş; score aralığı ve tipler uyumlu.
3. annotationData JSON olarak saklanabilir (Prisma InputJsonValue).

---

## service: timeline.service

**Dosya:** `backend/src/services/timeline.service.ts`

### Tek sorumluluk

**Sorumluluk:** Öğrenci için zaman çizelgesi (sınıf bazlı), sınıf bazlı post listesi, öğretmen tarafı post oluşturma/silme ve öğretmenin sınıf listesini sağlamak.

### İş kuralları

- Öğrenci timeline: Öğrencinin sınıfına ait post'lar; öğrenci ve sınıf geçerli olmalı.
- create: Öğretmen ve sınıf geçerli; post sınıfa bağlanır.
- delete: Sadece post'un sahibi öğretmen silebilir; aksi 403.

### Varsayımlar (invariants)

1. studentUserId → Student → classId; teacherUserId → Teacher ilişkisi geçerli.
2. TimelinePost modeli teacherId ve classId ile ilişkili; yetki teacherId ile kontrol edilir.

---

## service: teacherWiki.service

**Dosya:** `backend/src/services/teacherWiki.service.ts`

### Tek sorumluluk

**Sorumluluk:** Öğretmen wiki sayfalarını kategoriye göre listeleme, id ile getirme, oluşturma, güncelleme ve silme; sahiplik ve admin istisnası ile yetkilendirme.

### İş kuralları

- create: Öğretmen geçerli; title ve content trim sonrası boş olamaz (400).
- update/delete: Sayfa ya o öğretmene ait olmalı ya da isAdmin true; değilse 403.
- list: Opsiyonel category filtresi; sayfalar listelenir.

### Varsayımlar (invariants)

1. teacherUserId → Teacher; isAdmin bilgisi güvenilir şekilde dışarıdan gelir.
2. Sayfa sahipliği teacherId ile tutarlı; admin tüm sayfalara yetkili kabul edilir.

---

## service: teacherResource.service

**Dosya:** `backend/src/services/teacherResource.service.ts`

### Tek sorumluluk

**Sorumluluk:** Öğretmen materyallerini (resource) level'a göre listeleme, oluşturma ve silme; sadece sahibi silebilir.

### İş kuralları

- create: Öğretmen geçerli; levelId ve diğer alanlar ile kayıt oluşturulur.
- delete: Kaynak bulunmalı ve resource.teacherId, isteği atan öğretmenle eşleşmeli; değilse 403.

### Varsayımlar (invariants)

1. teacherUserId → Teacher; levelId geçerli Level id'si.
2. TeacherResource modeli teacherId ile sahiplik taşır.

---

## service: errorBank.service

**Dosya:** `backend/src/services/errorBank.service.ts`

### Tek sorumluluk

**Sorumluluk:** Öğrencinin hata bankası (Dikkat Etmem Gerekenler) kayıtlarını listeleme, benzersiz hataları kur sonu tekrar listesi olarak sunma; öğretmenin değerlendirme bağlamında hatayı bankaya eklemesi.

### İş kuralları

- getMyErrors: Öğrenci geçerli; kendi errorBankEntry kayıtları; uniqueErrors metin bazlı gruplanır (count, lastAt).
- add: Öğretmen ve öğrenci geçerli; errorText trim; submissionId opsiyonel.
- getReviewList: getMyErrors uniqueErrors çıktısını "kur sonu tekrar" formatında döner.

### Varsayımlar (invariants)

1. studentUserId → Student; teacherUserId → Teacher; studentId geçerli Student id.
2. ErrorBankEntry öğrenci ve öğretmen ile ilişkili; öğretmen herhangi bir öğrenciye hata ekleyebilir (yetki controller'da kısıtlanabilir).

---

## service: intervention.service

**Dosya:** `backend/src/services/intervention.service.ts`

### Tek sorumluluk

**Sorumluluk:** Risk altındaki öğrencileri (üst üste devamsızlık, kaçırılan ödev sayısı) hesaplamak; müdahale log'u oluşturmak ve listelemek.

### İş kuralları

- "Kırmızı alarm": Üst üste 2 devamsızlık veya 2+ kaçırılmış ödev; bu öğrenciler atRisk listesine girer.
- Devamsızlık: Sınıfın oturum tarihleri ile öğrencinin katılım tarihleri karşılaştırılır; ardışık 2 oturumda yoksa sebep eklenir.
- Kaçırılan ödev: Seviye/sınıf/öğrenci hedefli, süresi geçmiş ödevlerden teslimi olmayanlar; 2+ ise sebep eklenir.
- logIntervention: Öğretmen veya sistem; studentId ve not ile log kaydı.
- getAtRiskStudents: teacherUserId opsiyonel (filtre uygulanabilir); son müdahale tarihi dahil.

### Varsayımlar (invariants)

1. AttendanceSession, Assignment, Submission, InterventionLog modelleri ve tarih alanları tutarlı.
2. "Üst üste 2" ve "2 kaçırılan ödev" eşikleri sabit; değişirse iş kuralı güncellenir.
3. Öğrenci–sınıf–seviye ve ödev hedefleri doğru; kaçırılan ödev hesabı aynı hedef mantığı ile uyumlu.

---

## service: makeUp.service

**Dosya:** `backend/src/services/makeUp.service.ts`

### Tek sorumluluk

**Sorumluluk:** Telafi slotu oluşturma, öğretmen slot listesi, öğrenci rezervasyonu ve slot detayı; kapasite (maxStudents) ve tarih kısıtları.

### İş kuralları

- createSlot: Öğretmen ve sınıf geçerli; slotEnd > slotStart (400); maxStudents 1–50 (400).
- Rezervasyon: Öğrenci slot'un sınıfında olmalı; slot kapasitesi aşılmamalı; çift rezervasyon engellenir.
- getSlotsForTeacher: Sadece o öğretmenin slot'ları; getAvailableForStudent: öğrencinin sınıfına ait, gelecek, kapasitesi dolmamış slot'lar.

### Varsayımlar (invariants)

1. teacherUserId → Teacher; classId geçerli Class; studentUserId → Student ve classId eşleşmesi.
2. slotStart/slotEnd zaman dilimi geçerli; kapasite kontrolü booking sayısı ile yapılır.
3. MakeUpSlot ve MakeUpBooking modelleri şemaya uygun.

---

## service: peerReview.service

**Dosya:** `backend/src/services/peerReview.service.ts`

### Tek sorumluluk

**Sorumluluk:** Akran değerlendirmesi: öğrenciye değerlendireceği teslimleri listeleme, puan gönderme, alınan değerlendirmeleri görme; adillik lider tablosu ve "benim aldığım değerlendirmeler" sorguları.

### İş kuralları

- Değerlendirilecek teslimler: Ödev peerReviewEnabled olmalı; öğrenci ile ödev aynı seviyede; kendi teslimi ve zaten puanladıkları hariç.
- submitPeerReview: Kendi teslimine puan verilemez (400); aynı teslime ikinci puan 409.
- getPeerReviewsReceived: Ya teslim sahibi ya da ilgili öğretmen; değilse 403.
- getFairnessLeaderboard: Adillik metriği (verilen/alınan puan dağılımı) hesaplanır.

### Varsayımlar (invariants)

1. assignment.peerReviewEnabled, levelId ve submission–student ilişkisi tutarlı.
2. peerReviewsPerStudent vb. ayarlar assignment'ta; bir öğrenciye atanacak değerlendirme sayısı bu kurala uyar.
3. Reviewer ve reviewee farklı öğrenci; tek submission'a tek PeerReview per reviewer.

---

## service: similarity.service

**Dosya:** `backend/src/services/similarity.service.ts`

### Tek sorumluluk

**Sorumluluk:** Metin/teslim benzerliği hesaplama ve aynı öğretmenin ödevleri arasında benzer ödev tespiti; assignment oluşturma akışında "benzer ödev var mı?" sorusuna cevap vermek.

### İş kuralları

- Metin benzerliği: İki metin kümesi verilir; karşılaştırma algoritması (örn. token/jaccard) ile benzerlik sonucu döner.
- findSimilarAssignments: Öğretmen, levelId, title/weekNumber vb. ile mevcut ödevler taranır; benzerlik eşiği aşılıyorsa liste döner.
- Hedef açıklaması: targets yoksa "Tüm seviye"; varsa sınıf/öğrenci bilgisi ile metin üretilir.

### Varsayımlar (invariants)

1. Benzerlik algoritması deterministik veya tutarlı eşik ile kullanılır; false positive/negative kabul edilebilir aralıkta.
2. Assignment ve Homework verileri (title, description vb.) karşılaştırma için okunabilir.
3. findSimilarAssignments çağrıldığında öğretmen ve seviye geçerli.

---

## service: analytics.service

**Dosya:** `backend/src/services/analytics.service.ts`

### Tek sorumluluk

**Sorumluluk:** Dashboard ve raporlama: toplam ödev/öğrenci/öğretmen/teslim sayıları, ortalama puan, tamamlanma oranı, seviye/hafta bazlı gruplamalar, son aktiviteler ve öğretmen/belirli sınıf için özelleştirilmiş istatistikler.

### İş kuralları

- getDashboardStats: Sistem geneli sayılar ve aggregate'ler; assignmentsByLevel, submissionsByWeek, recentActivity gibi gruplar.
- Öğretmen/sınıf bazlı istatistikler: İlgili assignment ve submission'lar filtrelenir; yetki (öğretmen/sınıf) controller veya parametre ile sınırlanır.
- Sayısal alanlar (averageScore, completionRate) null/zero durumlarına göre güvenli hesaplanır.

### Varsayımlar (invariants)

1. Prisma aggregate, groupBy, count sorguları doğru sonuç verir; ilişkiler (assignment–submission–evaluation) tutarlı.
2. Tarih ve weekNumber alanları raporlama mantığı ile uyumlu.
3. Büyük veri setinde performans (limit, sayfa boyutu) kabul edilebilir.

---

## service: homework.service

**Dosya:** `backend/src/services/homework.service.ts`

### Tek sorumluluk

**Sorumluluk:** Ödev taslağı (homework) oluşturma, öğretmene göre listeleme, id ile getirme, güncelleme ve silme; homework–assignment ilişkisini yönetmek.

### İş kuralları

- create: Öğretmen geçerli; HomeworkInput (title, levelId, weekNumber, type vb.) ile kayıt; type varsayılan TEXT.
- getByTeacher: teacherUserId varsa sadece o öğretmenin taslakları; yoksa tümü (admin benzeri).
- getById: Tekil taslak; assignments ve submission sayıları dahil.
- update/delete: Taslak bulunmalı ve sahibi isteği atan öğretmen olmalı; değilse 403/404.

### Varsayımlar (invariants)

1. teacherUserId → Teacher; HomeworkInput validatörden geçmiş.
2. Homework, Assignment ile ilişkili; taslak silinirken assignment kısıtları (cascade/restrict) şemaya bağlı.
3. levelId ve weekNumber Level/Curriculum ile uyumlu.
