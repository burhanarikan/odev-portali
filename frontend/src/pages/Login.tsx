import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLogin, useRegister } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { pingBackendHealth, getBaseURL } from '@/api/client';

const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(1, 'Şifre gereklidir'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  role: z.enum(['STUDENT', 'TEACHER']),
  classId: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

const isDev = import.meta.env.DEV;

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [backendReady, setBackendReady] = useState(isDev);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const { toast } = useToast();
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  useEffect(() => {
    if (isDev) return;
    pingBackendHealth(120000).then((ok) => {
      setBackendReady(true);
      if (!ok) {
        toast({
          title: 'Sunucuya ulaşılamadı',
          description: 'Giriş/kayıt yine de deneyebilirsiniz; bazen ikinci denemede çalışır.',
          variant: 'destructive',
        });
      }
    });
  }, []);

  const showError = (error: unknown) => {
    const err = error as { code?: string; message?: string; response?: { data?: { error?: string } } };
    const isTimeout = err?.code === 'ECONNABORTED' || (typeof err?.message === 'string' && err.message.includes('timeout'));
    const isNetwork = err?.code === 'ERR_NETWORK' || !err?.response;
    let msg: string;
    if (isTimeout) {
      msg = 'Sunucu yanıt vermiyor (zaman aşımı). Backend (Render) uyanıyor olabilir: 1–2 dakika bekleyip sayfayı yenileyin ve tekrar deneyin.';
    } else if (isNetwork) {
      const apiBase = getBaseURL();
      msg = `Ağ hatası. Kontrol: 1) Vercel → Settings → Environment → VITE_API_URL = Render adresi (https://...onrender.com). 2) Render → Environment → FRONTEND_URL = Vercel adresiniz. Şu an istek gidiyor: ${apiBase}`;
    } else {
      msg = err?.response?.data?.error || (error instanceof Error ? error.message : 'Bir hata oluştu. Lütfen tekrar deneyin.');
    }
    toast({
      title: isLogin ? 'Giriş başarısız' : 'Kayıt başarısız',
      description: msg,
      variant: 'destructive',
    });
  };

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data, {
      onError: showError,
    });
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data, {
      onError: showError,
    });
  };

  if (!backendReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 pb-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="font-medium text-gray-900">Sunucuya bağlanılıyor</p>
            <p className="text-sm text-gray-500 mt-1">
              İlk açılışta 1–2 dakika sürebilir. Form hazır olunca otomatik açılacak.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin 
              ? 'Hesabınıza giriş yapın' 
              : 'Yeni hesap oluşturun'
            }
            {(loginMutation.isPending || registerMutation.isPending) && (
              <span className="block mt-2 text-amber-600 text-sm">
                İstek gönderiliyor…
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  autoComplete="email"
                  {...loginForm.register('email')}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-600">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="pr-10"
                    {...loginForm.register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-600">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Giriş Yap
              </Button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ad Soyad</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ad Soyad"
                  autoComplete="name"
                  {...registerForm.register('name')}
                />
                {registerForm.formState.errors.name && (
                  <p className="text-sm text-red-600">
                    {registerForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email">E-posta</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="ornek@email.com"
                  autoComplete="email"
                  {...registerForm.register('email')}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-sm text-red-600">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reg-password">Şifre</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="pr-10"
                    {...registerForm.register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((p) => !p)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showRegPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  >
                    {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-sm text-red-600">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select onValueChange={(value) => registerForm.setValue('role', value as 'STUDENT' | 'TEACHER')}>
                  <SelectTrigger id="role" aria-label="Rol seçin">
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Öğrenci</SelectItem>
                    <SelectItem value="TEACHER">Öğretmen</SelectItem>
                  </SelectContent>
                </Select>
                {registerForm.formState.errors.role && (
                  <p className="text-sm text-red-600">
                    {registerForm.formState.errors.role.message}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Kayıt Ol
              </Button>
            </form>
          )}

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {isLogin 
                ? 'Hesabınız yok mu? Kayıt olun' 
                : 'Zaten hesabınız var mı? Giriş yapın'
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
