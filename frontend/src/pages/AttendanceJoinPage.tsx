import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { attendanceApi } from '@/api/attendance.api';
import { Loader2, LogIn, MapPin, AlertCircle } from 'lucide-react';

export const AttendanceJoinPage = () => {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      toast({ title: 'Kod girin', variant: 'destructive' });
      return;
    }
    setLoading(true);
    let lat: number | undefined;
    let lon: number | undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
    } catch {
      toast({
        title: 'Konum alınamadı',
        description: 'Yoklamaya katılmak için konum izni verin. Konum verilmezse kayıt "Konum bilgisi paylaşılmadı" olarak loglanır.',
        variant: 'destructive',
      });
    }
    try {
      const result = await attendanceApi.joinSession({
        code: trimmed,
        latitude: lat,
        longitude: lon,
      });
      if (result.success) {
        toast({
          title: 'Katıldınız',
          description: result.message,
        });
        setCode('');
      } else {
        toast({
          title: 'Katılım başarısız',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (e) {
      toast({
        title: 'Hata',
        description: (e as Error).message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Derse Katıl
          </CardTitle>
          <CardDescription>
            Hocanın söylediği yoklama kodunu girin. Konum izni verirseniz sınıf içinde olduğunuz doğrulanır (50m).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Yoklama kodu</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Örn: 123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-2xl font-mono tracking-widest"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4" />
            <span>Konum izni vererek sınıf içi doğrulama yapılır</span>
          </div>
          <Button
            className="w-full"
            onClick={handleJoin}
            disabled={loading || code.length < 4}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yoklamaya Katıl
          </Button>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              Süre dolmuş veya yanlış kod girerseniz katılım kabul edilmez. Aynı kodla sadece bir kez katılabilirsiniz.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
