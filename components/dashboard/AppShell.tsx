'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import type { Session } from 'next-auth';
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Inbox,
  Settings,
  Award,
  ClipboardCheck,
  LogIn,
  Megaphone,
  BookOpen,
  MessageSquare,
  Clock,
  Library,
  AlertTriangle,
  Phone,
  CalendarClock,
  BookMarked,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/utils/cn';

const navigation = [
  { name: 'Ana Sayfa', href: '/dashboard', icon: LayoutDashboard, roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { name: 'Derse Katıl', href: '/dashboard/attendance/join', icon: LogIn, roles: ['STUDENT'] },
  { name: 'Telafi & Eksik Konu', href: '/dashboard/makeup', icon: CalendarClock, roles: ['STUDENT'] },
  { name: 'Öğrenim Yolculuğum', href: '/dashboard/portfolio', icon: BookOpen, roles: ['STUDENT'] },
  { name: 'Değerlendirmelerim', href: '/dashboard/evaluations', icon: Award, roles: ['STUDENT'] },
  { name: 'Akran Değerlendirme', href: '/dashboard/peer-review', icon: MessageSquare, roles: ['STUDENT'] },
  { name: 'Zaman Tüneli', href: '/dashboard/timeline', icon: Clock, roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { name: 'Hata Bankası', href: '/dashboard/error-bank', icon: AlertTriangle, roles: ['STUDENT'] },
  { name: 'Duyurular', href: '/dashboard/announcements', icon: Megaphone, roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { name: 'Yoklama', href: '/dashboard/attendance', icon: ClipboardCheck, roles: ['TEACHER', 'ADMIN'] },
  { name: 'Ödev Oluştur', href: '/dashboard/assignments/create', icon: FileText, roles: ['TEACHER', 'ADMIN'] },
  { name: 'Teslimler', href: '/dashboard/submissions', icon: Inbox, roles: ['TEACHER', 'ADMIN'] },
  { name: 'Ders Havuzu', href: '/dashboard/teacher-resources', icon: Library, roles: ['TEACHER', 'ADMIN'] },
  { name: 'Öğretmenler Odası', href: '/dashboard/teacher-wiki', icon: BookMarked, roles: ['TEACHER', 'ADMIN'] },
  { name: 'Müdahale Takvimi', href: '/dashboard/intervention', icon: Phone, roles: ['TEACHER', 'ADMIN'] },
  { name: 'Öğrenciler', href: '/dashboard/students', icon: Users, roles: ['TEACHER', 'ADMIN'] },
  { name: 'Analitik', href: '/dashboard/analytics', icon: BarChart3, roles: ['TEACHER', 'ADMIN'] },
  { name: 'Ayarlar', href: '/dashboard/settings', icon: Settings, roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
];

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: Session['user'];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const role = (user as { role?: string })?.role || '';
  const filteredNav = navigation.filter((item) => item.roles.includes(role));
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
                aria-label="Menüyü aç"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Ödev Portali – Dil Eğitim Merkezi</h1>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {role === 'STUDENT' ? 'Öğrenci' : role === 'TEACHER' ? 'Öğretmen' : 'Yönetici'}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4" />
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Overlay: menü açıkken arka plan, tıklanınca kapat */}
      {menuOpen && (
        <button
          type="button"
          aria-label="Menüyü kapat"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/50"
        />
      )}

      {/* Açılır menü paneli - kapalıyken ekranda yer kaplamaz */}
      <aside
        aria-hidden={!menuOpen}
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] flex flex-col border-r border-gray-200 bg-white shadow-xl transition-transform duration-200 ease-out',
          menuOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <span className="font-semibold text-gray-900">Menü</span>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            aria-label="Menüyü kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {filteredNav.map((item) => {
            const href = item.name === 'Ana Sayfa'
              ? (role === 'STUDENT' ? '/dashboard/student' : '/dashboard/teacher')
              : item.href;
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={item.name}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg',
                  isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className={cn('mr-3 h-5 w-5 flex-shrink-0', isActive ? 'text-gray-900' : 'text-gray-500')} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 p-6">{children}</main>
    </div>
  );
}
