/**
 * Demo/seed veri kümeleri: B1 aktif, A1/A2 tamamlanmış dil okulu simülasyonu.
 * Öğrenci isimleri ülkeye göre; ağırlık Afrika, az sayıda Türkmenistan/Kazakistan, AB/Amerika/Asya.
 */

export const DEMO_PASSWORD_HASH = 'türkçe'; // hash edilecek
export const DEMO_PASSWORD_LEGACY = '123456';

/** 1 Müdür Yardımcısı (derse girmiyor) + 6 öğretmen. Sabit hesaplar: Eva, PDG. */
export const STAFF = [
  { name: 'PDG', email: 'pdg@isubudilmer.com', role: 'ADMIN' as const }, // Müdür Yardımcısı
  { name: 'Eva', email: 'eva@isubudilmer.com', role: 'TEACHER' as const },
  { name: 'Elif Yılmaz', email: 'elif.yilmaz@isubudilmer.com', role: 'TEACHER' as const },
  { name: 'Mehmet Kaya', email: 'mehmet.kaya@isubudilmer.com', role: 'TEACHER' as const },
  { name: 'Zeynep Demir', email: 'zeynep.demir@isubudilmer.com', role: 'TEACHER' as const },
  { name: 'Can Öztürk', email: 'can.ozturk@isubudilmer.com', role: 'TEACHER' as const },
  { name: 'Selin Arslan', email: 'selin.arslan@isubudilmer.com', role: 'TEACHER' as const },
];

/** Öğrenci: isim + ülke (ülke e-posta/bağlam için). Ağırlık Afrika, az Türkmenistan/Kazakistan, diğer. */
export const STUDENTS_A101 = [
  { name: 'Chukwuemeka Okonkwo', country: 'Nigeria' },
  { name: 'Amara Diallo', country: 'Senegal' },
  { name: 'Kofi Mensah', country: 'Ghana' },
  { name: 'Fatou Sow', country: 'Senegal' },
  { name: 'Ibrahim Traoré', country: 'Mali' },
  { name: 'Amina Hassan', country: 'Somalia' },
  { name: 'Omar Khalil', country: 'Sudan' },
  { name: 'Ngozi Eze', country: 'Nigeria' },
  { name: 'Juma Mwangi', country: 'Kenya' },
  { name: 'Zara Mohammed', country: 'Nigeria' },
  { name: 'Abdi Hassan', country: 'Somalia' },
  { name: 'Grace Osei', country: 'Ghana' },
  { name: 'Yusuf Ahmed', country: 'Sudan' },
  { name: 'Leyla Ibrahim', country: 'Kenya' },
  { name: 'Musa Kamara', country: 'Sierra Leone' },
  { name: 'Aisha Bello', country: 'Nigeria' },
  { name: 'Rashid Bakari', country: 'Tanzania' },
  { name: 'Mercy Wambui', country: 'Kenya' },
  { name: 'Bakary Jallow', country: 'Gambia' },
  { name: 'Hawa Juma', country: 'Tanzania' },
  { name: 'Mekan Annayev', country: 'Turkmenistan' },
  { name: 'Aigerim Nurlan', country: 'Kazakhstan' },
  { name: 'James Wilson', country: 'USA' },
  { name: 'Emma Thompson', country: 'UK' },
];

export const STUDENTS_A102 = [
  { name: 'Chiamaka Nwosu', country: 'Nigeria' },
  { name: 'Idrissa Ba', country: 'Senegal' },
  { name: 'Blessing Asante', country: 'Ghana' },
  { name: 'Moussa Keita', country: 'Mali' },
  { name: 'Halima Abdi', country: 'Somalia' },
  { name: 'Tariq Mahmoud', country: 'Sudan' },
  { name: 'Chioma Okoli', country: 'Nigeria' },
  { name: 'Wanjiku Kariuki', country: 'Kenya' },
  { name: 'Sekou Doumbia', country: 'Mali' },
  { name: 'Nasra Ali', country: 'Somalia' },
  { name: 'Kwame Addo', country: 'Ghana' },
  { name: 'Farida Omar', country: 'Sudan' },
  { name: 'Oluwaseun Adeyemi', country: 'Nigeria' },
  { name: 'Peter Ochieng', country: 'Kenya' },
  { name: 'Mariama Bah', country: 'Gambia' },
  { name: 'Hassan Yusuf', country: 'Somalia' },
  { name: 'Dawit Bekele', country: 'Ethiopia' },
  { name: 'Zainab Umar', country: 'Nigeria' },
  { name: 'Rahma Said', country: 'Tanzania' },
  { name: 'Solomon Kibet', country: 'Kenya' },
  { name: 'Gulnar Orazova', country: 'Turkmenistan' },
  { name: 'Daniyar Kozhabek', country: 'Kazakhstan' },
  { name: 'Marie Dubois', country: 'France' },
  { name: 'Carlos García', country: 'Spain' },
];

/** Test öğrenci hesabı (sabit). */
export const TEST_STUDENT = { name: 'Demo Öğrenci', email: 'ogrenci@isubudilmer.com' };

/** A1 haftalık ödev başlıkları (geçmiş kur, 10 hafta). */
export const A1_ASSIGNMENT_TITLES = [
  'A1 - Alfabe ve sesler',
  'A1 - Selamlaşma ve tanışma',
  'A1 - Sayılar 1-100',
  'A1 - Günlük ifadeler',
  'A1 - Aile ve meslekler',
  'A1 - Haftanın günleri',
  'A1 - Basit cümleler',
  'A1 - Soru kalıpları',
  'A1 - Şimdiki zaman',
  'A1 - Kur sonu değerlendirme',
];

/** A2 haftalık ödev başlıkları (geçmiş kur, 10 hafta). */
export const A2_ASSIGNMENT_TITLES = [
  'A2 - Geçmiş zaman',
  'A2 - Günlük rutin',
  'A2 - Yemek ve alışveriş',
  'A2 - Şehir ve ulaşım',
  'A2 - Hava durumu',
  'A2 - Planlar ve öneriler',
  'A2 - Kısa paragraf',
  'A2 - Mektup / e-posta',
  'A2 - Dinleme özeti',
  'A2 - Kur sonu değerlendirme',
];

/** B1 haftalık ödev başlıkları (20 hafta + güncel). */
export const B1_ASSIGNMENT_TITLES = [
  'B1 - Kendinizi tanıtın',
  'B1 - Günlük rutininiz',
  'B1 - Geçen hafta sonu',
  'B1 - Sevdiğiniz bir film/dizi',
  'B1 - Bu hafta planlarınız',
  'B1 - Türkiye\'de bir şehir',
  'B1 - Alışveriş diyaloğu',
  'B1 - Sağlık ve beslenme',
  'B1 - Ulaşım ve yol tarifi',
  'B1 - Geçmiş zaman paragraf',
  'B1 - Dilek ve öneri cümleleri',
  'B1 - Karşılaştırma (daha / en)',
  'B1 - Bir olay anlatısı',
  'B1 - Resmi e-posta',
  'B1 - Sınav hazırlık metni',
  'B1 - Kısa hikaye',
  'B1 - Haber özeti',
  'B1 - Tartışma metni',
  'B1 - Kur sonu değerlendirme',
  'B1 - Portfolyo özeti',
  'B1 - Bu hafta ödevi (güncel)',
];

/** Duyuru başlıkları (hoca/yonetici). */
export const ANNOUNCEMENT_TITLES = [
  'Hoş geldiniz – B1 dönemi başlıyor',
  'Ders programı güncellemesi',
  'Bu Cuma Speaking Club',
  'Haftaya ara sınav',
  'Ödev teslim tarihleri',
  'Sınav sonuçları açıklandı',
  'Telafi dersi duyurusu',
  'Kütüphane saatleri',
  'Kampüs etkinlikleri',
  'B1 sınav tarihi',
  'Ders kitapları dağıtımı',
  'Zoom linki – çevrimiçi ders',
  'Yoklama kuralları hatırlatması',
  'Kur sonu değerlendirme',
  'Tatil programı',
  'Yeni materyaller yüklendi',
  'Konuşma sınavı formatı',
  'Dinleme çalışması ödevi',
  'Yazma sınavı örnekleri',
  'Genel tekrar dersi',
  'B1 bitiş töreni',
  'Sertifika dağıtımı',
];

/** Zaman tüneli özet metinleri (hoca paylaşımı). */
export const TIMELINE_SUMMARIES = [
  'Bugün geçmiş zaman (-di, -miş) işlendi. Ev ödevi: sayfa 24-25.',
  'Konuşma: günlük rutin. Haftaya dinleme sınavı.',
  'Okuma metni üzerine tartışma yaptık. Ödev: paragraf yazın.',
  'Dil bilgisi: gelecek zaman. Alıştırma defteri tamamlanacak.',
  'Kelime: alışveriş ve sayılar. Tekrar edin.',
  'Sınav haftası. Dersler normal; Cuma sınav.',
  'Sınav sonuçları görüşüldü. Eksikler için ek materyal paylaşıldı.',
  'Konuşma kulübü: Türkçe film fragmanı izlendi.',
  'Yazma: resmi e-posta formatı. Örnekler Canvas\'ta.',
  'Dinleme: haber bülteni. Not alma alıştırması.',
  'Kur ortası değerlendirme. Geri bildirim verildi.',
  'Telafi dersi: geçmiş zaman tekrar.',
  'Proje sunumları başladı. Haftaya devam.',
  'Dil bilgisi: birleşik zamanlar. Ödev: 5 cümle.',
  'Kelime sınavı yapıldı. Sonuçlar haftaya.',
  'Konuşma: rol play (restoran). Çok iyi geçti.',
  'Okuma: uzun metin. Soru-cevap ödevi.',
  'Kur sonu genel tekrar. Sınav formatı anlatıldı.',
  'Sertifika töreni provası. Cuma 14:00.',
  'B1 dönemi tamamlandı. Hepinize teşekkürler.',
];

/** Hata bankası örnek cümleler (grammar/vocabulary). */
export const ERROR_BANK_TEXTS = [
  'Ben dün okula gittim.',
  'O her gün çay içiyor.',
  'Yarın sinemaya gideceğiz.',
  'Bu kitap çok güzel.',
  'Türkçe öğrenmek zor.',
  'Dün hava çok sıcak idi.',
  'Benim annem doktor.',
  'Saат kaç?',
  'O benden büyük.',
  'Ev ödevi yaptım.',
  'Geçen hafta sonu denize gittik.',
  'Lütfen bana yardım eder misiniz?',
  'Daha iyi konuşmak istiyorum.',
  'Sınav çok zordu.',
  'Kitabı okudum ama anlamadım.',
];

/** Müdahale gerekçeleri. */
export const INTERVENTION_REASONS = [
  '3 haftadır devamsız; iletişime geçildi.',
  'Ödev teslim edilmedi; hatırlatma yapıldı.',
  'Düşük sınav notu; ek çalışma önerildi.',
  'Akademik risk; veli bilgilendirildi.',
  'Devamsızlık tekrarlı; yoklama kuralı hatırlatıldı.',
  'Ödev teslim oranı düşük; birebir görüşme.',
  'Sınav notu 50 altı; telafi çalışması.',
  '5 haftadır devamsız; müdahale kaydı.',
];
