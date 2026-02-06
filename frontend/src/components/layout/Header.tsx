import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { LogOut, User } from 'lucide-react';

export const Header = () => {
  const { user } = useAuthStore();
  const logout = useLogout();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Ödev Yönetim Sistemi
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {user?.name}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {user?.role === 'STUDENT' ? 'Öğrenci' : 
                 user?.role === 'TEACHER' ? 'Öğretmen' : 'Yönetici'}
              </span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={logout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Çıkış</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
