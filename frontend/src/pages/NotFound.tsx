import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Home, ArrowLeft, FileQuestion } from 'lucide-react';

export const NotFound = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const goHome = () => {
    if (isAuthenticated && user?.role === 'STUDENT') navigate('/student', { replace: true });
    else if (isAuthenticated && (user?.role === 'TEACHER' || user?.role === 'ADMIN')) navigate('/teacher', { replace: true });
    else navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardContent className="pt-8 pb-8">
          <div className="mb-6">
            <FileQuestion className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-6xl font-bold text-muted-foreground/50">404</p>
            <h1 className="page-title mt-2">Sayfa bulunamadı</h1>
            <p className="page-description mt-2 max-w-sm mx-auto">
              Aradığınız sayfa mevcut değil veya taşınmış olabilir.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={goHome} className="gap-2">
              <Home className="h-4 w-4" />
              Ana sayfa
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Geri
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
