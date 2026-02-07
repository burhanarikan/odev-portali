# Yetki / rol kontrol boşlukları: `middleware.ts`

Bu dosyada yapılması gereken ama yapılmayan yetki/rol kontrolleri. Hangi path’lerde hangi rolün engellenmesi veya yönlendirilmesi gerekir ama middleware’de uygulanmıyor?

---

## Genel durum

Middleware’de **rol bazlı kontrol** yalnızca **`/`** ve **`/dashboard`** (ve `/dashboard/`) için yapılıyor. Diğer tüm korumalı path’lerde sadece “token var mı?” bakılıyor; **rol kontrolü yok**. Bu path’lere giren herhangi bir giriş yapmış kullanıcı (STUDENT, TEACHER, ADMIN) middleware’den geçiyor. Rol kısıtı yalnızca client-side (ör. frontend’deki `ProtectedRoute`) uygulanıyorsa, ilk istekte yetkisiz kullanıcı da sayfaya kadar ulaşabilir; güvenlik ve tutarlılık tamamen client’a kalıyor.

---

## Öğretmen/Admin’e özel path’ler — STUDENT engellenmiyor veya yönlendirilmiyor

Bu path’ler uygulama tasarımında öğretmen veya admin içindir. **STUDENT** bu path’lere istek atınca **engellenmesi veya örn. `/dashboard/student` / `/student`’a yönlendirilmesi** gerekir; middleware’de böyle bir kontrol yok.

| Path(ler) | Beklenen | Middleware’deki eksik |
|-----------|----------|------------------------|
| `/teacher` | Sadece TEACHER, ADMIN | STUDENT geçiyor; yönlendirme yok. |
| `/teacher-resources` | Sadece TEACHER, ADMIN | STUDENT geçiyor; yönlendirme yok. |
| `/teacher-wiki` (ve alt path’ler) | Sadece TEACHER, ADMIN | STUDENT geçiyor; yönlendirme yok. |
| `/students` (ve `/students/*`) | Sadece TEACHER, ADMIN | STUDENT geçiyor; yönlendirme yok. |
| `/analytics` | Sadece TEACHER, ADMIN | STUDENT geçiyor; yönlendirme yok. |
| `/submissions` | Sadece TEACHER, ADMIN | STUDENT geçiyor; yönlendirme yok. |
| `/attendance` | Sadece TEACHER, ADMIN (not: `/attendance/join` öğrenci) | STUDENT geçiyor; yönlendirme yok. |
| `/intervention` | Sadece TEACHER, ADMIN | STUDENT geçiyor; yönlendirme yok. |

Özet: **Öğretmen tarafı path’lerinde STUDENT’in engellenmesi veya uygun sayfaya yönlendirilmesi yapılmıyor.**

---

## Öğrenciye özel path’ler — TEACHER/ADMIN engellenmiyor veya yönlendirilmiyor

Bu path’ler öğrenci akışı içindir. **TEACHER** veya **ADMIN** bu path’lere istek atınca **engellenmesi veya örn. `/dashboard/teacher` / `/teacher`’a yönlendirilmesi** istenebilir; middleware’de böyle bir kontrol yok.

| Path(ler) | Beklenen | Middleware’deki eksik |
|-----------|----------|------------------------|
| `/student` | Sadece STUDENT | TEACHER/ADMIN geçiyor; yönlendirme yok. |
| `/evaluations` | Sadece STUDENT | TEACHER/ADMIN geçiyor; yönlendirme yok. |
| `/portfolio` | Sadece STUDENT | TEACHER/ADMIN geçiyor; yönlendirme yok. |
| `/makeup` | Sadece STUDENT | TEACHER/ADMIN geçiyor; yönlendirme yok. |
| `/peer-review` | Sadece STUDENT | TEACHER/ADMIN geçiyor; yönlendirme yok. |
| `/error-bank` | Sadece STUDENT | TEACHER/ADMIN geçiyor; yönlendirme yok. |
| `/attendance/join` | Sadece STUDENT | TEACHER/ADMIN geçiyor; yönlendirme yok. |

Özet: **Öğrenci path’lerinde TEACHER/ADMIN’in engellenmesi veya öğretmen dashboard’una yönlendirilmesi yapılmıyor.**

---

## Karma / rol-bağımsız path’ler

`/assignments` (genel), `/announcements`, `/timeline`, `/settings` gibi path’ler uygulamada hem öğrenci hem öğretmen kullanıyor olabilir. Bu path’lerde **rol bazlı engelleme veya yönlendirme zorunlu değil**; sadece giriş kontrolü yeterli. Middleware şu an sadece giriş kontrolü yaptığı için bu path’lerde ek bir “yapılması gereken ama yapılmayan” rol kontrolü sayılmaz.

---

## Özet

- **Yapılması gereken ama yapılmayan:** Tüm rol-spesifik path’lerde (yukarıdaki tablolar) middleware’in token’daki `role`’e göre erişimi reddetmesi veya uygun dashboard/path’e yönlendirmesi.
- **Sonuç:** Yetkisiz rol, ilk istekte korumalı path’e kadar ulaşabiliyor; rol kontrolü sadece client’ta olduğu için güvenlik ve davranış tutarlılığı zayıf kalıyor.

---

## auth login

**Dosya:** `app/api/auth/[...nextauth]/route.ts` ve bu route'un kullandığı `lib/auth.ts` (authOptions). Bu yapı uygulama path'leri değil, `/api/auth/*` (signin, session, signout, callback) üzerinden giriş ve oturum akışını sunar. Aşağıdaki yetki/rol boşlukları bu akışla ilgilidir.

---

### Genel durum

Auth route ve authOptions'ta **rol doğrulaması yok**. Backend'den gelen `user.role` veya token'daki `role` için "sadece STUDENT, TEACHER, ADMIN geçerli" gibi bir kontrol yapılmıyor; bilinmeyen, boş veya hatalı rol ile de oturum oluşturulup session'a yazılıyor. Sonuç: yetkisiz veya tutarsız rol ile giriş kabul ediliyor; engelleme veya yönlendirme bu katmanda uygulanmıyor.

---

### Giriş (authorize) — Rolün engellenmemesi

- **Path/akış:** Login isteği → `POST /api/auth/callback/credentials` (veya signin) → `authorize(credentials)` → backend `POST .../api/auth/login` → dönen `user.role` doğrudan kabul ediliyor.
- **Beklenen:** Sadece `user.role` değeri `STUDENT`, `TEACHER` veya `ADMIN` ise oturum oluşturulmalı; diğer tüm değerler (undefined, null, boş string, typo, enum dışı) için `authorize` null dönmeli ve giriş reddedilmeli.
- **Eksik:** `authorize` içinde `user.role` kontrolü yok. Backend yanlış/eksik rol döndürse bile oturum oluşturuluyor; bilinmeyen rol ile giriş engellenmiyor.

---

### JWT callback — Rolün filtrelenmemesi

- **Path/akış:** Giriş başarılı olduktan sonra NextAuth `jwt` callback'i çağrılıyor; `user.role` token'a yazılıyor.
- **Beklenen:** Sadece izin verilen roller (STUDENT, TEACHER, ADMIN) token'a yazılmalı; diğer değerler ya reddedilmeli (oturum oluşturulmamalı) ya da token'a hiç yazılmamalı / varsayılan davranışla ele alınmalı.
- **Eksik:** `token.role = user.role` koşulsuz atanıyor; rolün geçerliliği kontrol edilmiyor. Bilinmeyen rol JWT'de kalıyor ve session'a taşınıyor.

---

### Session callback — Rolün doğrulanmaması

- **Path/akış:** Client `/api/auth/session` istediğinde veya sayfa session kullandığında `session` callback çalışıyor; `token.role` session.user'a kopyalanıyor.
- **Beklenen:** Session'a yazılmadan önce `token.role` geçerli rollerden biri mi diye kontrol edilebilir; geçersizse session'da rol atanmamalı veya istek reddedilebilir.
- **Eksik:** `session.user.role = token.role` doğrulama olmadan yapılıyor. Eski/bozuk token'daki geçersiz rol, session üzerinden client ve middleware'e aynen gidiyor; bu katmanda engelleme yok.

---

### Özet (auth login)

- **Yapılması gereken ama yapılmayan:** (1) Girişte backend'den gelen `user.role` için sadece STUDENT, TEACHER, ADMIN kabul edilmesi; diğer tüm değerlerde oturum açılmaması. (2) JWT ve session callback'lerinde rolün geçerli listeden olmasının sağlanması veya geçersiz rolün session'a taşınmaması.
- **Sonuç:** Bilinmeyen veya hatalı rol ile oturum oluşabiliyor; engelleme ve yönlendirme yalnızca middleware ve client'ta (path bazlı) kaldığı için, auth katmanında "geçerli rol" garantisi yok.

---

## lib/auth

**Dosya:** `lib/auth.ts`. Bu dosyada yapılması gereken ama yapılmayan yetki/rol kontrolleri; özellikle role bilgisinin üretilmediği, taşınmadığı veya session/JWT'ye yazılmadığı durumlar ile varsayılan role düşülen ama açık bırakılan senaryolar.

---

### Genel durum

Rol bilgisi bu dosyada **üretilmiyor**; yalnızca backend cevabından alınıp JWT ve session'a **aktarılıyor**. Geçerli rol listesi (STUDENT, TEACHER, ADMIN) kontrol edilmiyor; eksik veya geçersiz role için ne yapılacağı (reddetmek, varsayılan atamak) tanımlı değil. Sonuç: rol eksik veya hatalı olsa bile oturum oluşuyor; "varsayılan rol" davranışı bu dosyada değil, middleware/client'ta örtük kalıyor.

---

### Role bilgisinin üretilmediği durumlar

- **Backend user.role göndermiyor veya null:** authorize (satır 29–35) `user.role`'ü olduğu gibi döndürür; undefined/null aynen JWT'ye ve session'a yazılır. Bu dosyada "rol yoksa oturum açma" veya "rol yoksa şu varsayılanı kullan" gibi bir **üretim** (doğrulama veya varsayılan atama) yok. Yapılması gereken: ya girişi reddetmek (authorize null) ya da açıkça belirlenmiş bir varsayılan rol atamak; ikisi de yapılmıyor.
- **Backend cevabında user yok (data.user yok):** Bu durumda authorize null döner; oturum oluşmaz. "Rol üretilmediği" anlamında ek bir kontrol gerekmez; ancak "user var role yok" senaryosu yukarıdaki gibi açık bırakılıyor.

---

### Role bilgisinin taşınmadığı / JWT'ye yazılmadığı durumlar

- **JWT callback'te user yok (sonraki istekler):** jwt callback (satır 40–46) yalnızca `user` varken token.role, token.id, token.accessToken yazar. Sonraki isteklerde `user` yok; mevcut token aynen döndürülür. Eğer cookie'deki JWT'de role zaten yoksa (eski token, migration öncesi, bozuk payload) **role hiç taşınmaz**; token.role undefined kalır. Bu dosyada "token'da role yoksa ne yapılacak" (varsayılan yazmak, oturumu geçersiz saymak) tanımlı değil; eksik role sessizce session'a taşınıyor.
- **Session callback'te token.role undefined:** session callback (satır 50) `session.user.role = token.role` atar; token.role undefined ise session.user.role undefined olur. Eksik rol **session'a yazılmıyor** (değer undefined); "yazılmadığı" = anlamlı bir rol değeri atanmıyor. Yapılması gereken: token.role geçersiz/eksikse session'a yazmamak veya açık bir varsayılan kullanmak; şu an sadece undefined kopyalanıyor.

---

### Rolün session/JWT'ye anlamlı yazılmadığı durumlar

- **user.role geçersiz string (typo, enum dışı):** authorize ve jwt callback bu değeri doğrulamıyor; "STUDENT" | "TEACHER" | "ADMIN" dışındaki her şey (örn. "student", "Teacher", "ADMIN ") aynen JWT ve session'a yazılıyor. Yapılması gereken: sadece geçerli üç değeri kabul etmek; geçersizse girişi reddetmek veya normalize etmek. Şu an **anlamlı/geçerli rol garantisi olmadan** yazılıyor.
- **user.role sayı veya object:** Backend yanlış tip döndürürse jwt callback yine yazar; session callback `token.role as string` ile kopyalar. Rol bilgisi session/JWT'ye **tutarlı string rol olarak** yazılmıyor; tip kontrolü yok.

---

### Varsayılan role düşülen ama açık bırakılan senaryolar

- **"Rol yok" için varsayılan rol yok:** Backend role göndermediğinde veya token'da role olmadığında bu dosyada "varsayılan rol" (örn. GUEST, STUDENT veya "bilinmeyen") atanmıyor. Middleware'de bilinmeyen rol için `/dashboard/teacher`'a yönlendirme var; bu bir **varsayılan davranış** ama lib/auth'ta "role undefined ise şu rolü kullan" diye tanımlı değil. Sonuç: varsayılan role düşme **açıkça** bu dosyada yapılmıyor; middleware ve client undefined/geçersiz role'ü kendi mantıklarıyla yorumluyor. Tutarlılık ve bakım riski: varsayılan davranış tek yerde (lib/auth) toplanmıyor.
- **Geçersiz rol için varsayılan:** "STUDENT/TEACHER/ADMIN dışındaki değerler için oturum açma" veya "dışındakiler için X rolü say" gibi bir kural yok. Geçersiz rol hem kabul ediliyor hem de varsayılan bir role çevrilmiyor; **açık bırakılmış** senaryo: ne reddediliyor ne de açıkça varsayılana düşürülüyor.

---

### Özet (lib/auth)

- **Yapılması gereken ama yapılmayan:** (1) Backend'den role gelmediğinde veya geçersiz olduğunda girişi reddetmek veya açıkça tanımlı bir varsayılan rol atamak. (2) JWT/session'a yazmadan önce rolü geçerli listeden (STUDENT, TEACHER, ADMIN) biri olarak doğrulamak veya normalize etmek. (3) Token'da role yokken (eski/bozuk token) ne yapılacağını tanımlamak: varsayılan yazmak veya oturumu geçersiz saymak. (4) Varsayılan role düşen senaryoları bu dosyada açıkça tanımlamak; undefined/geçersiz role'ü middleware/client'a bırakmamak.
- **Sonuç:** Rol eksik veya geçersiz olsa bile oturum oluşuyor; role bilgisi bazen üretilmiyor/taşınmıyor veya anlamsız yazılıyor; varsayılan role davranışı örtük ve dağınık kalıyor.

---

## service: auth.service

**Dosya:** `backend/src/services/auth.service.ts`

- **register:** İşlemi kimin yapabilmesi gerektiği (kayıt açık mı, sadece admin mi) serviste tanımlı değil; rol (STUDENT/TEACHER/ADMIN) validatöre bırakılmış. ADMIN ile kayıt yapıldığında User oluşur ama Teacher/Student kaydı oluşturulmaz — "bu rol bu işlemi yapamaz" veya "ADMIN için ek kayıt gerekir" kontrolü yok.
- **Eksik senaryo:** ADMIN rolü ile register; yetki/sahiplik değil ama rol bazlı tutarlı kayıt (ilişkili kayıt oluşturma) eksik.

---

## service: student.service

**Dosya:** `backend/src/services/student.service.ts`

- **submitAssignment:** Bu işlemi sadece **ilgili ödevin hedefinde olan öğrenci** (aynı seviye ve class/student hedefi) yapabilmeli. Servis assignment'ı sadece id ile buluyor; ödevin bu öğrencinin seviyesinde/hedefinde olduğu kontrol edilmiyor.
- **Eksik senaryo:** Başka seviye veya hedefteki bir ödevin assignmentId'si ile teslim gönderilirse yetki kontrolü yapılmaz; teslim oluşturulur (yetkisiz işlem).

---

## service: assignment.service

**Dosya:** `backend/src/services/assignment.service.ts`

- **getAssignments(teacherUserId?: string):** Öğretmen kendi oluşturduğu ödevleri görmeli; admin tümünü görebilir. teacherUserId undefined geçtiğinde where: {} kullanılıyor; **çağıranın admin olup olmadığı** serviste kontrol edilmiyor. Liste tüm ödevleri döndürür.
- **Eksik senaryo:** teacherUserId yanlışlıkla veya yetkisiz şekilde gönderilmezse (controller hatası) herkes tüm ödevleri görür; rol/sahiplik kontrolü eksik.
- **getAssignmentById(id):** Ödev detayını **sadece o ödevi oluşturan öğretmen veya admin** (veya ödev hedefindeki öğrenci, ayrı endpoint'te) görmeli. Servis sadece id ile getiriyor; çağıranın bu ödeve yetkisi var mı kontrol edilmiyor.
- **Eksik senaryo:** Herhangi bir kullanıcı id ile başka öğretmenin ödev detayını okuyabilir; sahiplik/yetki kontrolü yok.
- **createAssignment — studentIds/classId:** Hedef olarak verilen classId veya studentIds'in **bu öğretmenin erişebildiği sınıf/öğrenciler** olması gerekir. Servis sadece teacher varlığını kontrol ediyor; classId/studentIds'in o öğretmene ait ders/sınıf ile ilişkisi doğrulanmıyor.
- **Eksik senaryo:** Başka öğretmenin sınıfına veya öğrencisine hedefli ödev oluşturulabilir; sahiplik/erişim kontrolü eksik.

---

## service: announcement.service

**Dosya:** `backend/src/services/announcement.service.ts`

- **delete(id):** Duyuruyu **sadece yazan (author) veya admin** silebilmeli. Servis id ile sadece silme yapıyor; çağıranın authorId ile eşleşip eşleşmediği veya admin olup olmadığı kontrol edilmiyor.
- **Eksik senaryo:** Herhangi yetkili görünen kullanıcı (veya id bilen biri) başkasının duyurusunu silebilir; sahiplik/yetki kontrolü yok.
- **create:** Duyuru oluşturmayı **genelde öğretmen veya admin** yapabilir; servis authorId parametre alıyor ama çağıranın o yetkiye sahip olduğu veya authorId'nin çağırana ait olduğu kontrol edilmiyor (controller'da yapılıyor olabilir).
- **Eksik senaryo:** authorId başka kullanıcı id'si verilirse duyuru onun adına oluşturulur; sahiplik (author = caller) kontrolü serviste yok.

---

## service: attendance.service

**Dosya:** `backend/src/services/attendance.service.ts`

- **startSession(teacherUserId, classId, ...):** Yoklamayı **o sınıfta ders veren veya yetkili öğretmen** başlatabilmeli. Servis öğretmenin ve sınıfın varlığını kontrol ediyor; "bu öğretmen bu sınıfa yoklama başlatabilir mi" (örn. o sınıfta ders vermesi) kontrol edilmiyor.
- **Eksik senaryo:** Herhangi bir öğretmen herhangi bir sınıf için yoklama oturumu başlatabilir; sınıf–öğretmen ilişkisi / yetki kontrolü eksik.

---

## service: evaluation.service

**Dosya:** `backend/src/services/evaluation.service.ts`

- **submitEvaluation:** Bu işlemi **sadece teslimin ait olduğu ödevi oluşturan öğretmen** yapabilmeli. Kod submission.assignment.createdBy !== teacher.id ise 403 atıyor; sahiplik kontrolü **yapılıyor**. Eksik senaryo: (Yok — bu serviste yetki kontrolü mevcut.)

---

## service: timeline.service

**Dosya:** `backend/src/services/timeline.service.ts`

- **create(teacherUserId, { classId, ... }):** Postu **sadece o sınıfa post atma yetkisi olan öğretmen** (örn. o sınıfta ders veren veya yoklama başlatan) atabilmeli. Servis öğretmen ve sınıf varlığını kontrol ediyor; "bu öğretmen bu sınıfa post atabilir mi" kontrolü yok.
- **Eksik senaryo:** Herhangi bir öğretmen herhangi bir sınıfın timeline'ına post ekleyebilir; sınıf–öğretmen yetkisi eksik.
- **getByClassId(classId):** Sınıf zaman çizelgesini **o sınıfın öğrencileri veya o sınıfta yetkili öğretmenler** görmeli. Servis sadece classId ile listeliyor; çağıranın o sınıfa erişim yetkisi kontrol edilmiyor (öğrenci tarafı getTimelineForStudent ile kendi classId'sini kullanıyor; doğrudan getByClassId ile keyfi classId verilirse yetkisiz erişim).
- **Eksik senaryo:** classId bilen herkes o sınıfın timeline'ını okuyabilir; rol/erişim kontrolü yok.

---

## service: teacherWiki.service

**Dosya:** `backend/src/services/teacherWiki.service.ts`

- **update / delete:** Bu işlemi **sayfanın sahibi (teacherId) veya admin** yapabilmeli. Kod !isAdmin && page.teacherId !== teacher.id ise 403 atıyor; sahiplik ve admin istisnası **uygulanıyor**. Eksik: isAdmin bilgisi dışarıdan (controller) geliyor; servis isAdmin'in gerçekten yetkili bir admin tarafından set edildiğini doğrulamıyor.
- **Eksik senaryo:** isAdmin yanlış veya kasıtlı true gönderilirse yetkisiz kullanıcı tüm sayfaları düzenleyebilir/silebilir; admin yetkisi serviste doğrulanmıyor.
- **getById:** Sayfayı **herkes (giriş yapmış) veya sadece öğretmenler** görebilir — iş kuralına bağlı. Servis sadece id ile getiriyor; erişim kısıtı yok (wiki public kabul ediliyorsa tamam). Özel ise: rol/erişim kontrolü eksik olabilir.

---

## service: teacherResource.service

**Dosya:** `backend/src/services/teacherResource.service.ts`

- **delete:** Bu işlemi **sadece materyalin sahibi (teacherId)** yapabilmeli. Kod resource.teacherId !== teacher.id ise 403 atıyor; sahiplik **kontrol ediliyor**. (Eksik yok.)
- **create:** Materyal oluşturmayı **sadece öğretmen** yapabilmeli; teacher varlığı kontrol ediliyor. levelId'in geçerli ve (isteğe bağlı) öğretmenin erişebildiği seviye olması beklenebilir; serviste levelId yetkisi yok.
- **Eksik senaryo:** levelId başka bir seviye id'si (yetki dışı) verilse bile kayıt oluşur; seviye–öğretmen ilişkisi kontrol edilmiyor.

---

## service: errorBank.service

**Dosya:** `backend/src/services/errorBank.service.ts`

- **add(teacherUserId, { studentId, ... }):** Hatayı **sadece o öğrenciye değerlendirme yapan / o öğrencinin öğretmeni** ekleyebilmeli. Servis öğretmen ve öğrenci varlığını kontrol ediyor; "bu öğretmen bu öğrenciye hata ekleyebilir mi" (örn. ödevi o öğretmenin, teslim ona ait) kontrol edilmiyor.
- **Eksik senaryo:** Herhangi bir öğretmen herhangi bir öğrenciye hata bankası kaydı ekleyebilir; rol/erişim (öğretmen–öğrenci kapsamı) kontrolü yok.
- **getByStudent(studentId, teacherUserId):** Öğrencinin hata listesini **sadece o öğrenciye erişimi olan öğretmen(ler)** görmeli. Servis sadece öğretmen varlığını kontrol ediyor; öğretmenin bu öğrenciye (sınıf/ders bazlı) erişimi doğrulanmıyor.
- **Eksik senaryo:** Herhangi bir öğretmen herhangi bir öğrencinin hata listesini okuyabilir; yetki kontrolü eksik.

---

## service: intervention.service

**Dosya:** `backend/src/services/intervention.service.ts`

- **getAtRiskStudents(teacherUserId?):** Bu işlemi **admin tümünü, öğretmen kendi kapsamındaki öğrencileri** görebilmeli. teacherUserId parametre alınıyor ama **kullanılmıyor**; tüm riskli öğrenciler döner.
- **Eksik senaryo:** Öğretmen çağırdığında sadece kendi sınıfındaki/ödev verdiği öğrenciler filtelenmiyor; rol/kapsam kontrolü eksik.
- **addLog(teacherUserId, { studentId, ... }):** Müdahale logunu **o öğrenciye müdahale yetkisi olan öğretmen (örn. sınıfında veya ödev verdiği)** ekleyebilmeli. Servis öğretmen ve öğrenci varlığını kontrol ediyor; öğretmen–öğrenci ilişkisi (sınıf, ödev) kontrol edilmiyor.
- **Eksik senaryo:** Herhangi bir öğretmen herhangi bir öğrenci için müdahale logu ekleyebilir; yetki/kapsam kontrolü yok.
- **getLogs(studentId?, teacherUserId?):** Logları **ilgili öğretmen veya admin** görmeli. teacherUserId kullanılmıyor; tüm loglar (veya studentId ile filtrelenmiş) döner, çağıranın yetkisi kontrol edilmiyor.
- **Eksik senaryo:** Herhangi kullanıcı tüm müdahale loglarını okuyabilir; rol/erişim kontrolü eksik.

---

## service: makeUp.service

**Dosya:** `backend/src/services/makeUp.service.ts`

- **createSlot(teacherUserId, classId, ...):** Telafi slotunu **sadece o sınıfta ders veren / yetkili öğretmen** oluşturabilmeli. Servis öğretmen ve sınıf varlığını kontrol ediyor; "bu öğretmen bu sınıf için slot açabilir mi" kontrolü yok.
- **Eksik senaryo:** Herhangi bir öğretmen herhangi bir sınıf için telafi slotu oluşturabilir; sınıf–öğretmen yetkisi eksik.
- **bookSlot:** Öğrenci sadece **kendi sınıfına ait** slot için rezervasyon yapabilmeli. Kod slot.classId !== student.classId ise 403 atıyor; kontrol **var**. (Eksik yok.)

---

## service: peerReview.service

**Dosya:** `backend/src/services/peerReview.service.ts`

- **getPeerReviewsReceived(submissionId, requesterUserId, requesterRole):** Bu işlemi **teslim sahibi (öğrenci) veya o ödevi oluşturan öğretmen** yapabilmeli. Kod isOwner (teslim sahibi) veya isTeacher (role TEACHER/ADMIN) ise izin veriyor; yani **herhangi bir öğretmen** herhangi bir teslimin akran değerlendirmelerini görebiliyor.
- **Eksik senaryo:** Ödevi oluşturmayan bir öğretmen de başka öğretmenin öğrencisinin teslimine gelen akran puanlarını görebilir; sahiplik (assignment.createdBy) kontrolü yok.

---

## service: similarity.service

**Dosya:** `backend/src/services/similarity.service.ts`

- Servis sadece benzerlik hesaplama ve liste döndürüyor; doğrudan "kim bu işlemi yapabilir" veri değiştiren bir operasyon yok. Çağıran assignment.service üzerinden kullanıyor; yetki assignment tarafında. (Bu dosyada ek yetki/rol/sahiplik boşluğu listelenmeye gerek yok.)

---

## service: analytics.service

**Dosya:** `backend/src/services/analytics.service.ts`

- **getDashboardStats:** Bu işlemi **sadece admin veya yetkili roller** yapabilmeli. Servis parametre almıyor; kim çağırırsa çağırsın tüm sistem istatistiklerini döndürüyor. Rol/yetki kontrolü yok.
- **Eksik senaryo:** Öğretmen veya öğrenci token ile bu endpoint'e ulaşırsa tüm dashboard verisini (ödev/öğrenci/öğretmen sayıları, seviye bazlı veriler vb.) görebilir; rol kontrolü eksik.
- **Öğretmen/sınıf bazlı istatistikler:** İlgili metodlarda teacherUserId veya classId ile filtre var; bu id'lerin çağırana ait olduğu veya çağıranın o veriyi görme yetkisi olduğu serviste doğrulanmıyorsa, keyfi teacherId/classId ile başkasının istatistiği istenebilir. (Metod imzaları ve kullanımı controller'a bağlı; serviste "sadece kendi teacherId'si" kontrolü yok.)

---

## service: homework.service

**Dosya:** `backend/src/services/homework.service.ts`

- **getById(id):** Taslak detayını **sadece taslağın sahibi öğretmen (veya admin)** görmeli. Servis sadece id ile getiriyor; çağıranın homework.teacherId ile eşleşip eşleşmediği kontrol edilmiyor.
- **Eksik senaryo:** Herhangi bir kullanıcı (id bilgisi ile) başka öğretmenin taslağını okuyabilir; sahiplik kontrolü eksik.
- **update / delete:** Sahiplik kontrolü **yapılıyor** (homework.teacherId !== teacherId ise 403). (Eksik yok.)
