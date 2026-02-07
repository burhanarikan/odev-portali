import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/authStore';
import { APP_VERSION, APP_UPDATED_AT } from '@/config/version';
import { LayoutDashboard, FileText, Users, BarChart3, Inbox, Settings, Award, ClipboardCheck, LogIn, Megaphone, BookOpen, MessageSquare, Clock, Library, AlertTriangle, Phone } from 'lucide-react';

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

  const filteredNavigation = navigation.filter(item =>
    item.roles.includes(user?.role || '')
  );

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 bg-white overflow-y-auto border-r">
        <div className="flex items-center flex-shrink-0 px-4">
          <h2 className="text-lg font-semibold text-gray-900">Menü</h2>
        </div>
        <div className="mt-8 flex-1 flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {filteredNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        'mr-3 h-5 w-5 flex-shrink-0',
                        isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                      )}
                    />
                    {item.name}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <span className="font-medium text-gray-600">{APP_VERSION}</span>
            <span className="mx-1">·</span>
            <span>{APP_UPDATED_AT}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Güncelleme</p>
        </div>
      </div>
    </div>
  );
};
