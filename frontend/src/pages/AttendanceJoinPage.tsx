import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { attendanceApi } from '@/api/attendance.api';
import { Loader2, LogIn, MapPin, AlertCircle } from 'lucide-react';

const CODE_LENGTH = 6;

export const AttendanceJoinPage = () => {
  const { toast } = useToast();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join('');

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  const handleDigitChange = (index: number, value: string) => {
    const num = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = num;
    setDigits(next);
    if (num && index < CODE_LENGTH - 1) focusInput(index + 1);
    else if (!num && index > 0) focusInput(index - 1);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      focusInput(index - 1);
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    const next = pasted.split('').concat(Array(CODE_LENGTH).fill('')).slice(0, CODE_LENGTH);
    setDigits(next);
    const lastIdx = Math.min(pasted.length, CODE_LENGTH) - 1;
    focusInput(lastIdx);
  };

  const handleJoin = async () => {
    const trimmed = code.trim();
    if (trimmed.length < 4) {
      toast({ title: 'En az 4 haneli kod girin', variant: 'destructive' });
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
        description: 'Derste olduğunuzu doğrulamak için konum izni gereklidir. İzin vermezseniz kayıt "Konum paylaşılmadı" olarak loglanır.',
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
        setDigits(Array(CODE_LENGTH).fill(''));
        focusInput(0);
      } else {
        toast({
          title: 'Katılım başarısız',
          description: 'Girdiğiniz kod hatalı veya süresi dolmuş. Lütfen hocanızdan yeni kod isteyin.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      toast({
        title: 'Katılım başarısız',
        description: 'Girdiğiniz kod hatalı veya süresi dolmuş. Lütfen hocanızdan yeni kod isteyin.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6 px-4 sm:py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Derse Katıl
          </CardTitle>
          <CardDescription>
            Hocanın tahtada paylaştığı 6 haneli yoklama kodunu girin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Yoklama kodu</p>
            <div
              className="flex justify-center gap-2 sm:gap-3"
              onPaste={handlePaste}
            >
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-11 h-12 sm:w-12 sm:h-14 text-center text-2xl font-mono font-semibold border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                  aria-label={`Rakam ${i + 1}`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              Derste olduğunuzu doğrulamak için konum izni gereklidir. İzin vermezseniz katılım kaydınız &quot;Konum paylaşılmadı&quot; olarak işaretlenir.
            </p>
          </div>
          <Button
            className="w-full h-12 text-base"
            onClick={handleJoin}
            disabled={loading || code.length < 4}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yoklamaya Katıl
          </Button>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              Yanlış veya süresi dolmuş kod girerseniz katılım kabul edilmez. Lütfen hocanızdan güncel kodu isteyin. Aynı kodla sadece bir kez katılabilirsiniz.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
