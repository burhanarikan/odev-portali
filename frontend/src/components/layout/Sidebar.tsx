import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/authStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { APP_VERSION, APP_UPDATED_AT } from '@/config/version';
import { LayoutDashboard, FileText, Users, BarChart3, Inbox, Settings, Award, ClipboardCheck, LogIn, Megaphone, BookOpen, MessageSquare, Clock, Library, AlertTriangle, Phone, CalendarClock, BookMarked, X } from 'lucide-react';
import { useEffect } from 'react';

const navigation = [
  {
    name: 'Ana Sayfa',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['STUDENT', 'TEACHER', 'ADMIN'],
  },
  {
    name: 'Derse Katıl',
    href: '/attendance/join',
    icon: LogIn,
    roles: ['STUDENT'],
  },
  {
    name: 'Telafi & Eksik Konu',
    href: '/makeup',
    icon: CalendarClock,
    roles: ['STUDENT'],
  },
  {
    name: 'Öğrenim Yolculuğum',
    href: '/portfolio',
    icon: BookOpen,
    roles: ['STUDENT'],
  },
  {
    name: 'Değerlendirmelerim',
    href: '/evaluations',
    icon: Award,
    roles: ['STUDENT'],
  },
  {
    name: 'Akran Değerlendirme',
    href: '/peer-review',
    icon: MessageSquare,
    roles: ['STUDENT'],
  },
  {
    name: 'Zaman Tüneli',
    href: '/timeline',
    icon: Clock,
    roles: ['STUDENT', 'TEACHER', 'ADMIN'],
  },
  {
    name: 'Hata Bankası',
    href: '/error-bank',
    icon: AlertTriangle,
    roles: ['STUDENT'],
  },
  {
    name: 'Duyurular',
    href: '/announcements',
    icon: Megaphone,
    roles: ['STUDENT', 'TEACHER', 'ADMIN'],
  },
  {
    name: 'Yoklama',
    href: '/attendance',
    icon: ClipboardCheck,
    roles: ['TEACHER', 'ADMIN'],
  },
  {
    name: 'Ödev Oluştur',
    href: '/assignments/create',
    icon: FileText,
    roles: ['TEACHER', 'ADMIN'],
  },
  {
    name: 'Teslimler',
    href: '/submissions',
    icon: Inbox,
    roles: ['TEACHER', 'ADMIN'],
  },
  {
    name: 'Ders Havuzu',
    href: '/teacher-resources',
    icon: Library,
    roles: ['TEACHER', 'ADMIN'],
  },
  {
    name: 'Öğretmenler Odası (Wiki)',
    href: '/teacher-wiki',
    icon: BookMarked,
    roles: ['TEACHER', 'ADMIN'],
  },
  {
    name: 'Müdahale Takvimi',
    href: '/intervention',
    icon: Phone,
    roles: ['TEACHER', 'ADMIN'],
  },
  {
    name: 'Öğrenciler',
    href: '/students',
    icon: Users,
    roles: ['TEACHER', 'ADMIN'],
  },
  {
    name: 'Analitik',
    href: '/analytics',
    icon: BarChart3,
    roles: ['TEACHER', 'ADMIN'],
  },
  {
    name: 'Ayarlar',
    href: '/settings',
    icon: Settings,
    roles: ['STUDENT', 'TEACHER', 'ADMIN'],
  },
];

export const Sidebar = () => {
  const { user } = useAuthStore();
  const { open, setOpen } = useSidebarStore();
  const location = useLocation();

  const filteredNavigation = navigation.filter(item =>
    item.roles.includes(user?.role || '')
  );

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, setOpen]);

  return (
    <>
      {/* Overlay: sadece açıkken görünür, tıklanınca menüyü kapat */}
      {open && (
        <button
          type="button"
          aria-label="Menüyü kapat"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50"
        />
      )}
      {/* Açılır panel: kapalıyken ekranda hiç yer kaplamaz (görünmez + ekran dışında) */}
      <aside
        aria-hidden={!open}
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] flex flex-col bg-card border-r border-border shadow-xl transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        )}
      >
        <div className="flex items-center justify-between flex-shrink-0 px-4 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Menü</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            aria-label="Menüyü kapat"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {filteredNavigation.map((item) => {
            const href = item.name === 'Ana Sayfa'
              ? (user?.role === 'STUDENT' ? '/student' : '/teacher')
              : item.href;
            return (
              <NavLink
                key={item.name}
                to={href}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150',
                    isActive
                      ? 'bg-primary/10 text-primary border-l-4 border-primary ml-0 pl-[calc(0.75rem-4px)]'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground border-l-4 border-transparent'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    />
                    {item.name}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
        <div className="flex-shrink-0 px-4 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">{APP_VERSION}</span>
            <span className="mx-1">·</span>
            <span>{APP_UPDATED_AT}</span>
          </p>
          <p className="text-xs text-muted-foreground/80 mt-0.5">Güncelleme</p>
        </div>
      </aside>
    </>
  );
};
