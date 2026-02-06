import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { Settings } from 'lucide-react';

export const SettingsPage = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-600">Hesap ve uygulama ayarları</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Hesap bilgileri
          </CardTitle>
          <CardDescription>Profil bilgileriniz (güncelleme özelliği yakında eklenecek)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="font-medium text-gray-700">Ad:</span> {user?.name ?? '—'}</p>
          <p><span className="font-medium text-gray-700">E-posta:</span> {user?.email ?? '—'}</p>
          <p><span className="font-medium text-gray-700">Rol:</span> {user?.role ?? '—'}</p>
        </CardContent>
      </Card>
    </div>
  );
};
