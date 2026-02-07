import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { attendanceApi, type AttendanceSession } from '@/api/attendance.api';
import { teacherApi } from '@/api/teacher.api';
import { useTeacherStudents } from '@/hooks/useAssignments';
import { Loader2, Users, Clock, MapPin, CalendarPlus } from 'lucide-react';
import { formatDate, formatDateTime } from '@/utils/formatDate';
import { Link } from 'react-router-dom';

export const AttendancePage = () => {
  const { toast } = useToast();
  const [classId, setClassId] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [topic, setTopic] = useState('');
  const [resourceLinksText, setResourceLinksText] = useState('');
  const [starting, setStarting] = useState(false);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const queryClient = useQueryClient();
  const { data: studentsList = [] } = useTeacherStudents();
  const { data: makeUpSlots = [], isLoading: loadingMakeUp } = useQuery({
    queryKey: ['teacher', 'makeup-slots'],
    queryFn: teacherApi.getMyMakeUpSlots,
  });
  const createSlotMutation = useMutation({
    mutationFn: teacherApi.createMakeUpSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'makeup-slots'] });
      toast({ title: 'Telafi slotu oluşturuldu' });
      setMakeUpClassId('');
      setMakeUpStart('');
      setMakeUpEnd('');
      setMakeUpTitle('');
    },
    onError: (e: Error) => toast({ title: 'Hata', description: e.message, variant: 'destructive' }),
  });

  const [makeUpClassId, setMakeUpClassId] = useState('');
  const [makeUpStart, setMakeUpStart] = useState('');
  const [makeUpEnd, setMakeUpEnd] = useState('');
  const [makeUpTitle, setMakeUpTitle] = useState('');

  const classesMap = new Map<string, { id: string; name: string }>();
  studentsList.forEach((s) => {
    if (s.class) classesMap.set(s.class.id, { id: s.class.id, name: s.class.name });
  });
  const classes = Array.from(classesMap.values());

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const list = await attendanceApi.getSessionsForTeacher();
      setSessions(list);
    } catch {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (!activeSession?.id) return;
    const t = setInterval(async () => {
      try {
        const live = await attendanceApi.getSessionLive(activeSession.id);
        setActiveSession(live);
        if (new Date(live.endTime) < new Date()) {
          setActiveSession(null);
          loadSessions();
        }
      } catch {
        clearInterval(t);
      }
    }, 3000);
    return () => clearInterval(t);
  }, [activeSession?.id]);

  const handleStart = async () => {
    if (!classId) {
      toast({ title: 'Sınıf seçin', variant: 'destructive' });
      return;
    }
    setStarting(true);
    let lat: number | undefined;
    let lon: number | undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
    } catch {
      toast({
        title: 'Konum alınamadı',
        description: 'Yoklama konum doğrulaması olmadan başlatılıyor.',
        variant: 'default',
      });
    }
    try {
      const resourceLinks = resourceLinksText
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const session = await attendanceApi.startSession({
        classId,
        durationMinutes,
        latitude: lat,
        longitude: lon,
        topic: topic.trim() || undefined,
        resourceLinks: resourceLinks.length ? resourceLinks : undefined,
      });
      setActiveSession(session);
      toast({ title: 'Yoklama başlatıldı', description: `Kod: ${session.code}` });
    } catch (e) {
      toast({
        title: 'Hata',
        description: (e as Error).message,
        variant: 'destructive',
      });
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Yoklama</h1>
        <p className="text-gray-600">Yoklama başlatın, kodu sınıfa gösterin; öğrenciler &quot;Derse Katıl&quot; ile kodu girer</p>
      </div>

      {!activeSession ? (
        <Card>
          <CardHeader>
            <CardTitle>Yoklama Başlat</CardTitle>
            <CardDescription>
              Sınıf seçin, süre (dakika) belirleyin. Konum izni verirseniz öğrenci konumu doğrulanır (50m).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Sınıf</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sınıf seçin" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Geçerlilik süresi (dakika)</Label>
              <Select value={String(durationMinutes)} onValueChange={(v) => setDurationMinutes(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20, 30].map((m) => (
                    <SelectItem key={m} value={String(m)}>{m} dk</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Konu (isteğe bağlı)</Label>
              <input
                type="text"
                placeholder="Örn: Unit 5 – Past Simple"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              />
              <p className="text-xs text-gray-500">Kaçıran öğrenci &quot;Bu konuyu kaçırdın&quot; mesajında görür.</p>
            </div>
            <div className="space-y-2">
              <Label>Kaynak linkleri (isteğe bağlı, her satırda bir)</Label>
              <textarea
                placeholder="https://..."
                value={resourceLinksText}
                onChange={(e) => setResourceLinksText(e.target.value)}
                rows={2}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <Button onClick={handleStart} disabled={starting || !classId}>
              {starting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yoklamayı Aç
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Yoklama açık
            </CardTitle>
            <CardDescription>
              Kodu sınıfa yansıtın. Süre: {formatDate(activeSession.endTime)} tarihine kadar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Yoklama kodu</p>
              <p className="text-5xl font-mono font-bold tracking-widest text-gray-900">
                {activeSession.code}
              </p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                <span className="font-semibold">{activeSession.joinedCount ?? activeSession._count?.records ?? 0}</span>
                <span className="text-gray-600">katıldı</span>
              </div>
              {activeSession.latitude != null && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  Konum açık
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 text-center">
              Liste her birkaç saniyede güncellenir. Süre dolunca yoklama kapanır.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Geçmiş yoklamalar</CardTitle>
          <CardDescription>Son yoklama oturumları</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSessions ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-gray-500 text-sm">Henüz yoklama yok.</p>
          ) : (
            <ul className="space-y-2">
              {sessions.slice(0, 10).map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <span className="font-mono font-medium">{s.code}</span>
                    <span className="text-gray-500 ml-2">{s.class?.name ?? ''}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDate(s.startTime)} · {s._count?.records ?? 0} katılım
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" />
            Telafi dersi slotları
          </CardTitle>
          <CardDescription>
            Öğrenciler kaçırdıkları ders için bu slotlardan randevu alabilir. Tarih/saat seçip slot oluşturun.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Sınıf</Label>
              <Select value={makeUpClassId} onValueChange={setMakeUpClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sınıf seçin" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Başlangıç</Label>
              <Input
                type="datetime-local"
                value={makeUpStart}
                onChange={(e) => setMakeUpStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Bitiş</Label>
              <Input
                type="datetime-local"
                value={makeUpEnd}
                onChange={(e) => setMakeUpEnd(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Başlık (isteğe bağlı)</Label>
              <Input
                placeholder="Örn: Unit 5 telafi"
                value={makeUpTitle}
                onChange={(e) => setMakeUpTitle(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={() => {
              if (!makeUpClassId || !makeUpStart || !makeUpEnd) {
                toast({ title: 'Sınıf, başlangıç ve bitiş gerekli', variant: 'destructive' });
                return;
              }
              createSlotMutation.mutate({
                classId: makeUpClassId,
                slotStart: new Date(makeUpStart).toISOString(),
                slotEnd: new Date(makeUpEnd).toISOString(),
                title: makeUpTitle.trim() || undefined,
              });
            }}
            disabled={createSlotMutation.isPending}
          >
            {createSlotMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Slot oluştur
          </Button>
          {loadingMakeUp ? (
            <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : makeUpSlots.length === 0 ? (
            <p className="text-gray-500 text-sm">Henüz telafi slotu yok.</p>
          ) : (
            <ul className="space-y-2 pt-2 border-t">
              {makeUpSlots.slice(0, 10).map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span>{s.class?.name ?? ''} · {s.title || 'Telafi'}</span>
                  <span className="text-gray-600">
                    {formatDateTime(s.slotStart)} · {s._count?.bookings ?? 0}/{s.maxStudents}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Devamsızlık raporu</CardTitle>
          <CardDescription>Kur sonu devamsızlık yüzdesi</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/analytics">
            <Button variant="outline">Analitik sayfasında görüntüle</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};
