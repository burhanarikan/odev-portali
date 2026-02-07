'use client';

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

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Ödev Portali – Dil Eğitim Merkezi</h1>
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
      <div className="flex">
        <aside className="hidden md:flex md:w-64 md:flex-col border-r border-gray-200 bg-white min-h-[calc(100vh-4rem)]">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {filteredNav.map((item) => {
              const href = item.name === 'Ana Sayfa'
                ? (role === 'STUDENT' ? '/dashboard/student' : '/dashboard/teacher')
                : item.href;
              const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
              return (
                <Link
                  key={item.name}
                  href={href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
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
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
