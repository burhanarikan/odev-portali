import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Sayfa Bulunamadı
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir. Ana sayfaya dönerek işleme devam edebilirsiniz.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2"
          >
            <Home className="h-4 w-4" />
            <span>Ana Sayfa</span>
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Geri</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
