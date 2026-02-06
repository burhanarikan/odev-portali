import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/authStore';
import { LayoutDashboard, FileText, Users, BarChart3 } from 'lucide-react';

const navigation = [
  {
    name: 'Ana Sayfa',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['STUDENT', 'TEACHER', 'ADMIN'],
  },
  {
    name: 'Ödev Oluştur',
    href: '/assignments/create',
    icon: FileText,
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
      </div>
    </div>
  );
};
