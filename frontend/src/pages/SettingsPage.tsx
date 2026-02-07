import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore, type Theme } from '@/store/themeStore';
import { Settings, Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/utils/cn';

export const SettingsPage = () => {
  const { user } = useAuthStore();
  const { theme, setTheme, effective } = useThemeStore();

  const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Açık', icon: Sun },
    { value: 'dark', label: 'Koyu', icon: Moon },
    { value: 'system', label: 'Sistem (cihaz ayarı)', icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ayarlar</h1>
        <p className="text-muted-foreground">Hesap ve uygulama ayarları</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Görünüm
          </CardTitle>
          <CardDescription>Tema seçin. Koyu mod özellikle akşam kullanımında göz yormaz.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {themeOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={theme === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme(opt.value)}
              className={cn('gap-1.5', theme === opt.value && 'ring-2 ring-ring ring-offset-2 ring-offset-background')}
            >
              <opt.icon className="h-4 w-4" />
              {opt.label}
            </Button>
          ))}
          <p className="w-full text-xs text-muted-foreground mt-2">
            Şu an: {effective === 'dark' ? 'Koyu' : 'Açık'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Hesap bilgileri
          </CardTitle>
          <CardDescription>Profil bilgileriniz (güncelleme özelliği yakında eklenecek)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="font-medium text-foreground">Ad:</span> <span className="text-muted-foreground">{user?.name ?? '—'}</span></p>
          <p><span className="font-medium text-foreground">E-posta:</span> <span className="text-muted-foreground">{user?.email ?? '—'}</span></p>
          <p><span className="font-medium text-foreground">Rol:</span> <span className="text-muted-foreground">{user?.role ?? '—'}</span></p>
        </CardContent>
      </Card>
    </div>
  );
};
