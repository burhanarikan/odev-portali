import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { useLogout } from '@/hooks/useAuth';
import { LogOut, User, Moon, Sun, Menu } from 'lucide-react';

export const Header = () => {
  const { user } = useAuthStore();
  const logout = useLogout();
  const { effective, toggle } = useThemeStore();
  const sidebarToggle = useSidebarStore((s) => s.toggle);

  return (
    <header className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 lg:h-16">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={sidebarToggle}
              className="shrink-0"
              aria-label="Menüyü aç"
            >
              <Menu className="h-5 w-5 text-foreground" />
            </Button>
            <h1 className="text-lg lg:text-xl font-bold text-foreground tracking-tight">
              Ödev Yönetim Sistemi
            </h1>
            <span className="text-xs font-medium text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
              Deneme
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="rounded-full"
              aria-label={effective === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
            >
              {effective === 'dark' ? (
                <Sun className="h-5 w-5 text-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-foreground" />
              )}
            </Button>
            <div className="flex items-center space-x-2 border-l border-border pl-2 sm:pl-4">
              <User className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground hidden sm:inline">
                {user?.name}
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded hidden sm:inline">
                {user?.role === 'STUDENT' ? 'Öğrenci' : user?.role === 'TEACHER' ? 'Öğretmen' : 'Yönetici'}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="flex items-center space-x-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Çıkış</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
