import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { studentApi } from '@/api/student.api';
import { formatDate, formatDateTime } from '@/utils/formatDate';
import { BookOpen, CalendarCheck, CalendarPlus, ExternalLink, Loader2 } from 'lucide-react';

export const MakeUpPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: missed = [], isLoading: loadingMissed, error: missedError } = useQuery({
    queryKey: ['student', 'missed-sessions'],
    queryFn: studentApi.getMissedSessions,
  });

  const { data: availableSlots = [], isLoading: loadingSlots, error: slotsError } = useQuery({
    queryKey: ['student', 'makeup-slots'],
    queryFn: studentApi.getAvailableMakeUpSlots,
  });

  const { data: myBookings = [], isLoading: loadingBookings, error: bookingsError } = useQuery({
    queryKey: ['student', 'makeup-bookings'],
    queryFn: studentApi.getMyMakeUpBookings,
  });

  const bookMutation = useMutation({
    mutationFn: (slotId: string) => studentApi.bookMakeUpSlot(slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'makeup-slots'] });
      queryClient.invalidateQueries({ queryKey: ['student', 'makeup-bookings'] });
      toast({ title: 'Randevu alındı', description: 'Telafi dersi randevunuz kaydedildi.' });
    },
    onError: (e: Error) => {
      toast({ title: 'Randevu alınamadı', description: e.message, variant: 'destructive' });
    },
  });

  const anyError = missedError || slotsError || bookingsError;
  if (anyError) {
    const message = (anyError as Error)?.message || 'Veriler yüklenirken bir hata oluştu.';
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ders telafi & eksik konu</h1>
          <p className="text-gray-600">Kaçırdığınız dersler ve telafi randevusu</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600">{message}</p>
            <p className="text-sm text-gray-500 mt-1">Sayfayı yenileyip tekrar deneyin.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingMissed && loadingSlots && loadingBookings) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ders telafi & eksik konu</h1>
        <p className="text-gray-600">
          Kaçırdığınız dersler ve telafi randevusu alabileceğiniz saatler
        </p>
      </div>

      {/* Kaçırdığın dersler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Kaçırdığın dersler
          </CardTitle>
          <CardDescription>
            Bu derslere yoklamada katılamadın. Konu ve kaynaklar aşağıda; telafi için aşağıdan randevu alabilirsin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {missed.length === 0 ? (
            <p className="text-gray-500 text-sm">Kaçırdığınız ders bulunmuyor.</p>
          ) : (
            <ul className="space-y-4">
              {missed.map((s) => (
                <li key={s.id} className="border rounded-lg p-4 bg-amber-50/50 border-amber-100">
                  <p className="font-medium text-gray-900">{s.topic}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDateTime(s.startTime)} · {s.teacherName}
                  </p>
                  {s.resourceLinks.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-amber-800 font-medium mb-1">Bu konuyu kaçırdın; şu kaynaklara bakabilirsin:</p>
                      <ul className="space-y-1">
                        {s.resourceLinks.map((url, i) => (
                          <li key={i}>
                            <a
                              href={url.startsWith('http') ? url : `https://${url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {url.length > 50 ? url.slice(0, 50) + '…' : url}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Telafi randevularım */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Telafi randevularım
          </CardTitle>
          <CardDescription>Aldığınız telafi dersi randevuları</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingBookings ? (
            <Skeleton className="h-20 rounded-lg" />
          ) : myBookings.length === 0 ? (
            <p className="text-gray-500 text-sm">Henüz telafi randevunuz yok.</p>
          ) : (
            <ul className="space-y-2">
              {myBookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{b.slot?.title || 'Telafi dersi'}</p>
                    <p className="text-sm text-gray-600">
                      {b.slot && formatDateTime(b.slot.slotStart)} · {b.slot?.teacher?.user?.name ?? '—'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Uygun telafi slotları */}
      <Card>
        <CardHeader>
          <CardTitle>Telafi dersi randevusu al</CardTitle>
          <CardDescription>
            Aşağıdaki uygun saatlerden birini seçerek telafi randevusu alabilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSlots ? (
            <Skeleton className="h-24 rounded-lg" />
          ) : availableSlots.length === 0 ? (
            <p className="text-gray-500 text-sm">Şu an için uygun telafi slotu yok. Hocanız yeni slot açtığında burada görünecek.</p>
          ) : (
            <ul className="space-y-3">
              {availableSlots.map((slot) => (
                <li
                  key={slot.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3 border rounded-lg bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{slot.title || 'Telafi dersi'}</p>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(slot.slotStart)} – {formatDate(slot.slotEnd, 'HH:mm')} · {slot.teacherName} · {slot.bookedCount}/{slot.maxStudents} dolu
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => bookMutation.mutate(slot.id)}
                    disabled={bookMutation.isPending}
                  >
                    {bookMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CalendarPlus className="h-4 w-4 mr-1" />}
                    Randevu al
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
