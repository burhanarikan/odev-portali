# Dil Kursları Ödev Yönetim Sistemi

Modern, ölçeklenebilir ve kullanıcı dostu bir web uygulaması ile dil kursları için ödev yönetimi.

## 📋 Teknik Özellikler

### Backend
- **Node.js** + **Express.js**
- **PostgreSQL** (veritabanı)
- **Prisma ORM**
- **JWT** (authentication)
- **Bcrypt** (password hashing)
- **Multer** (file upload)
- **Zod** (validation)
- **TypeScript**

### Frontend
- **React 18+** (TypeScript)
- **Vite**
- **React Router v6**
- **TanStack Query** (React Query)
- **Zustand** (state management)
- **Tailwind CSS**
- **shadcn/ui** (UI components)
- **React Hook Form + Zod** (form validation)

## 🗄️ Veritabanı Şeması

Sistem aşağıdaki ana modelleri içerir:
- **Users** (Kullanıcılar: Student, Teacher, Admin)
- **Levels** (Seviyeler: A1, A2, B1, B2)
- **Classes** (Sınıflar)
- **Assignments** (Ödevler)
- **Submissions** (Teslimler)
- **Evaluations** (Değerlendirmeler)
- **Groups** (Gruplar)

## 🚀 Kurulum

### Ön Gereksinimler
- Node.js 18+
- PostgreSQL
- npm veya yarn

### 1. Proje Klonlama
```bash
git clone <repository-url>
cd homework-management-system
```

### 2. Backend Kurulumu
```bash
cd backend
npm install
```

#### Ortam Değişkenleri
```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/homework_db"
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"
UPLOAD_MAX_SIZE="10485760"
NODE_ENV="development"
PORT="5000"
```

#### Veritabanı Kurulumu
```bash
npx prisma generate
npx prisma db push
# veya
npx prisma migrate dev
```

### 3. Frontend Kurulumu
```bash
cd frontend
npm install
```

#### Ortam Değişkenleri
```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:
```env
VITE_API_URL=http://localhost:5000
```

## 🏃‍♂️ Çalıştırma

### Backend
```bash
cd backend
npm run dev
```
Backend http://localhost:5000 adresinde çalışacaktır.

### Frontend
```bash
cd frontend
npm run dev
```
Frontend http://localhost:3000 adresinde çalışacaktır.

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Kayıt ol
- `POST /api/auth/login` - Giriş yap
- `GET /api/auth/me` - Profil bilgileri

### Student
- `GET /api/student/assignments` - Ödevleri listele (active, upcoming, past)
- `GET /api/student/assignments/:id` - Ödev detayı
- `POST /api/student/submissions` - Ödev teslim et
- `GET /api/student/submissions/:assignmentId` - Teslim detayı
- `GET /api/student/evaluations` - Değerlendirmeler

### Teacher
- `POST /api/teacher/assignments` - Ödev oluştur
- `GET /api/teacher/assignments` - Ödevleri listele
- `GET /api/teacher/assignments/:id` - Ödev detayı
- `PUT /api/teacher/assignments/:id` - Ödev güncelle
- `DELETE /api/teacher/assignments/:id` - Ödev sil
- `POST /api/teacher/assignments/check-similarity` - Benzerlik kontrolü
- `GET /api/teacher/assignments/by-week/:weekNumber` - Haftaya göre ödevler
- `GET /api/teacher/assignments/by-level/:levelId` - Seviyeye göre ödevler

## 🔐 Özellikler

### Kimlik Doğrulama
- JWT tabanlı authentication
- Role-based access control (STUDENT, TEACHER, ADMIN)
- Protected routes
- Auto logout on token expiry

### Öğrenci Özellikleri
- Dashboard görünümleri (Aktif, Gelecek, Geçmiş ödevler)
- Ödev detayları görüntüleme
- Dosya ile ödev teslimi
- Teslim durumu takibi
- Puan ve geri bildirim görüntüleme

### Öğretmen Özellikleri
- Ödev oluşturma (Kur + Hafta seçimi, Dosya ekleme, Başlangıç - Bitiş tarihi, Taslak kaydetme)
- Atama Seçenekleri (Tüm sınıfa, Seçili öğrencilere, Grup ödevi)
- Benzer Ödev Uyarısı (Jaccard + Cosine similarity, Türkçe stop-word filtreleme, %70 üzeri benzerlikte uyarı)
- Filtreleme (Haftaya göre, Öğrenciye göre, Kura göre, Teslim durumuna göre)
- Ödev değerlendirme ve puanlama

### Benzer Ödev Tespit Algoritması
Backend'de geliştirilen benzerlik hizmeti:
- Jaccard ve Cosine similarity algoritmaları
- Türkçe stop-word filtreleme
- %70 üzeri benzerlikte uyarı sistemi
- Mevcut ödevlerle karşılaştırma

## 🎨 UI/UX Özellikleri
- Responsive Design (Mobil, tablet, desktop uyumlu)
- Modern UI with shadcn/ui components
- Loading States (Skeleton loaders)
- Error Handling (Toast notifications)
- File Upload (Drag & drop + progress bar)
- Date Pickers (Türkçe format)
- Accessibility (ARIA labels, keyboard navigation)

## 📁 Proje Yapısı

```
homework-management-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── upload.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── student.routes.ts
│   │   │   └── teacher.routes.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── student.controller.ts
│   │   │   └── teacher.controller.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── assignment.service.ts
│   │   │   └── similarity.service.ts
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   ├── bcrypt.ts
│   │   │   └── validators.ts
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── uploads/
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/ (shadcn components)
│   │   │   ├── layout/
│   │   │   ├── student/
│   │   │   └── teacher/
│   │   ├── pages/
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── README.md
```

## 🔧 Geliştirme

### Script'ler

#### Backend
```bash
npm run dev          # Geliştirme modu
npm run build        # Build
npm run start        # Production
npm run db:generate  # Prisma client generate
npm run db:push      # Veritabanı senkronizasyon
npm run db:migrate   # Veritabanı migrasyon
npm run db:studio    # Prisma Studio
npm run lint         # ESLint
npm run lint:fix     # ESLint fix
```

#### Frontend
```bash
npm run dev          # Geliştirme modu
npm run build        # Build
npm run preview      # Preview
npm run lint         # ESLint
```

## 🛡️ Güvenlik

- SQL injection koruması (Prisma otomatik)
- XSS koruması
- Rate limiting (express-rate-limit)
- CORS yapılandırması
- JWT token güvenliği
- Password hashing (bcrypt)
- File upload güvenliği (mime type check, size limit)

## 📝 Lisans

Bu proje MIT lisansı altında dağıtılmaktadır.

## 🤝 Katkı

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişiklikleri commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'e push edin (`git push origin feature/AmazingFeature`)
5. Pull request açın
