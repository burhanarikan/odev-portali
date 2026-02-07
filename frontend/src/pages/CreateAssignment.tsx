import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateAssignment, useLevels, useTeacherStudents } from '@/hooks/useAssignments';
import { useToast } from '@/components/ui/use-toast';
import { teacherApi } from '@/api/teacher.api';
import { ArrowLeft, Users, FileText, AlertTriangle, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { SimilarAssignment } from '@/types';

const assignmentSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir'),
  description: z.string().optional(),
  levelId: z.string().min(1, 'Seviye seçiniz'),
  weekNumber: z.number().int().min(1).max(16),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  isDraft: z.boolean().default(false),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

export const CreateAssignment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createMutation = useCreateAssignment();
  const { data: levels = [], isLoading: levelsLoading } = useLevels();
  const { data: studentsList = [] } = useTeacherStudents();
  const [liveSimilarAssignments, setLiveSimilarAssignments] = useState<SimilarAssignment[]>([]);
  const [liveSimilarWarning, setLiveSimilarWarning] = useState<string | null>(null);
  const [liveSimilarLoading, setLiveSimilarLoading] = useState(false);
  type TargetType = 'level' | 'class' | 'students';
  const [targetType, setTargetType] = useState<TargetType>('level');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      isDraft: false,
      weekNumber: 1,
    },
  });

  const levelId = form.watch('levelId');
  const title = form.watch('title');
  const weekNumber = form.watch('weekNumber');
  const description = form.watch('description');

  // Yazarken benzer ödevleri canlı ara: başlık veya açıklama en az 1 karakter (baş harf eşleşmesi dahil)
  const hasEnoughText = (title?.trim().length ?? 0) >= 1 || (description?.trim().length ?? 0) >= 1;
  useEffect(() => {
    if (!hasEnoughText) {
      setLiveSimilarAssignments([]);
      return;
    }
    const t = setTimeout(() => {
      setLiveSimilarLoading(true);
      teacherApi
        .checkSimilarity({
          title: title?.trim() ?? '',
          description: description?.trim() ?? '',
          levelId: levelId || undefined,
          weekNumber: weekNumber || 1,
        })
        .then((res) => {
          setLiveSimilarAssignments(res.similarAssignments ?? []);
          setLiveSimilarWarning(res.warningMessage ?? null);
        })
        .catch(() => setLiveSimilarAssignments([]))
        .finally(() => setLiveSimilarLoading(false));
    }, 400);
    return () => clearTimeout(t);
  }, [title, description, levelId, weekNumber, hasEnoughText]);

  const studentsInLevel = levelId
    ? studentsList.filter((s) => s.class?.level?.id === levelId)
    : [];
  // Kurumda sadece 101 ve 102 sınıfı var; tüm öğrencilerden unique sınıf listesi (seviyeden bağımsız)
  const classesInLevel = studentsList.reduce<{ id: string; name: string }[]>((acc, s) => {
    if (s.class && !acc.some((c) => c.id === s.class!.id)) acc.push({ id: s.class.id, name: s.class.name });
    return acc;
  }, []);

  const onSubmit = async (data: AssignmentFormData) => {
    createAssignment(data);
  };

  const createAssignment = (data: AssignmentFormData) => {
    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const startDate = data.startDate ? new Date(data.startDate) : now;
    const dueDate = data.dueDate ? new Date(data.dueDate) : weekLater;
    const backendData: Record<string, unknown> = {
      ...data,
      startDate: startDate.toISOString(),
      dueDate: dueDate.toISOString(),
    };
    if (targetType === 'class' && selectedClassId) backendData.classId = selectedClassId;
    if (targetType === 'students' && selectedStudentIds.length > 0) backendData.studentIds = selectedStudentIds;
    createMutation.mutate(backendData as Parameters<typeof createMutation.mutate>[0], {
      onSuccess: () => {
        toast({
          title: "Başarılı",
          description: "Ödev başarıyla oluşturuldu.",
        });
        navigate('/dashboard');
      },
      onError: (error: { response?: { data?: { error?: string } }; message?: string }) => {
        const msg =
          (error as { response?: { data?: { error?: string } } }).response?.data?.error ||
          (error as { message?: string }).message ||
          'Ödev oluşturulurken bir hata oluştu.';
        toast({
          title: "Hata",
          description: msg,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yeni Ödev</h1>
          <p className="text-gray-600">Öğrencileriniz için yeni bir ödev oluşturun</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ödev Bilgileri</CardTitle>
          <CardDescription>
            Ödevin temel bilgilerini girin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Ödev Başlığı</Label>
                <Input
                  id="title"
                  placeholder="Ödev başlığını girin"
                  autoComplete="off"
                  {...form.register('title')}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="weekNumber">Hafta</Label>
                <Select onValueChange={(value) => form.setValue('weekNumber', parseInt(value))}>
                  <SelectTrigger id="weekNumber">
                    <SelectValue placeholder="Hafta seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 16 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}. Hafta
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.weekNumber && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.weekNumber.message}
                  </p>
                )}
              </div>
            </div>

            {/* Benzer ödevler - başlık/açıklama yazılınca canlı listele; eşleşen kelimeler ve detay link */}
            {hasEnoughText && (
              <Card className={liveSimilarAssignments.length > 0 ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200'}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 flex-wrap">
                    {liveSimilarLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : liveSimilarAssignments.length > 0 ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    Benzer ödevler
                    {!liveSimilarLoading && liveSimilarAssignments.length > 0 && (
                      <Badge variant="secondary" className="text-xs font-normal">
                        {liveSimilarAssignments.length} sonuç
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {liveSimilarLoading
                      ? 'Başlık ve açıklamadaki kelimelere göre kontrol ediliyor…'
                      : liveSimilarAssignments.length === 0
                        ? 'Başlık veya açıklama yazdıkça benzer ödevler burada listelenir.'
                        : liveSimilarWarning || 'Aynı veya benzer kelimeler geçen mevcut ödevler. Aynı ödevi tekrar vermemek için başlık/açıklamayı gözden geçirin.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {liveSimilarLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Kontrol ediliyor…</span>
                    </div>
                  ) : liveSimilarAssignments.length === 0 ? (
                    <p className="text-sm text-gray-500 py-1">Bu metinde benzer ödev bulunamadı.</p>
                  ) : (
                    <ul className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                      {liveSimilarAssignments.map((a) => {
                        const severity =
                          a.similarityScore >= 70 ? 'yüksek' : a.similarityScore >= 40 ? 'orta' : 'düşük';
                        return (
                          <li
                            key={a.id}
                            className="p-3 rounded-lg bg-white border border-amber-100 shadow-sm space-y-2 hover:border-amber-200 transition-colors"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 break-words">{a.title}</p>
                                <p className="text-xs text-gray-600 mt-0.5">
                                  {a.levelName} · {a.weekNumber}. Hafta · {a.teacherName}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <Badge
                                  variant={severity === 'yüksek' ? 'destructive' : severity === 'orta' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  %{a.similarityScore}
                                </Badge>
                                <Link
                                  to={`/assignments/${a.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-400 hover:text-amber-600 p-1 rounded"
                                  title="Ödevi yeni sekmede aç"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Link>
                              </div>
                            </div>
                            {a.matchedWords && a.matchedWords.length > 0 && (
                              <p className="text-xs text-amber-800 bg-amber-50 rounded px-2 py-1">
                                <span className="font-medium">Eşleşen kelimeler:</span>{' '}
                                {a.matchedWords.join(', ')}
                              </p>
                            )}
                            {a.targetsSummary && (
                              <p className="text-xs text-gray-600">
                                <span className="font-medium text-gray-700">Kime atandı:</span> {a.targetsSummary}
                              </p>
                            )}
                            {a.description && (
                              <div className="text-xs text-gray-600 bg-gray-50 rounded p-2 max-h-16 overflow-y-auto">
                                {a.description.length > 180 ? a.description.slice(0, 180) + '…' : a.description}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                placeholder="Ödev açıklamasını girin"
                className="min-h-[120px]"
                autoComplete="off"
                {...form.register('description')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="levelId">Seviye</Label>
                <Select
                  onValueChange={(value) => form.setValue('levelId', value)}
                  disabled={levelsLoading}
                >
                  <SelectTrigger id="levelId">
                    <SelectValue placeholder={levelsLoading ? 'Yükleniyor...' : 'Seviye seçin'} />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.levelId && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.levelId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  autoComplete="off"
                  {...form.register('startDate')}
                />
                {form.formState.errors.startDate && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.startDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Bitiş Tarihi</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  autoComplete="off"
                  {...form.register('dueDate')}
                />
                {form.formState.errors.dueDate && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.dueDate.message}
                  </p>
                )}
              </div>
            </div>

            {/* Kime atanacak */}
            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium leading-none flex items-center gap-2">
                <Users className="h-4 w-4" />
                Kime atanacak
              </p>
              <div className="flex flex-wrap gap-4" role="radiogroup" aria-label="Kime atanacak">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    id="target-level"
                    name="targetType"
                    checked={targetType === 'level'}
                    onChange={() => setTargetType('level')}
                    className="rounded border-gray-300"
                  />
                  <span>Tüm seviye (seçilen seviyedeki herkes)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    id="target-class"
                    name="targetType"
                    checked={targetType === 'class'}
                    onChange={() => setTargetType('class')}
                    className="rounded border-gray-300"
                    disabled={!levelId || classesInLevel.length === 0}
                  />
                  <span>Belirli sınıf</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    id="target-students"
                    name="targetType"
                    checked={targetType === 'students'}
                    onChange={() => setTargetType('students')}
                    className="rounded border-gray-300"
                    disabled={!levelId || studentsInLevel.length === 0}
                  />
                  <span>Belirli öğrenciler</span>
                </label>
              </div>
              {targetType === 'class' && levelId && (
                <div className="mt-2 max-w-xs">
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger id="targetClass">
                      <SelectValue placeholder="Sınıf seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {classesInLevel.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {targetType === 'students' && levelId && (
                <div className="mt-2 max-w-md space-y-1">
                  <p className="text-sm text-gray-600">Ödevi görecek öğrencileri seçin</p>
                  <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                    {studentsInLevel.map((s) => (
                      <label key={s.id} htmlFor={`student-${s.id}`} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          id={`student-${s.id}`}
                          name="studentIds"
                          checked={selectedStudentIds.includes(s.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedStudentIds((prev) => [...prev, s.id]);
                            else setSelectedStudentIds((prev) => prev.filter((id) => id !== s.id));
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{s.name}</span>
                        <span className="text-xs text-gray-500">({s.class?.name})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDraft"
                {...form.register('isDraft')}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isDraft">Taslak olarak kaydet</Label>
            </div>

            <div className="flex space-x-4">
              <Button 
                type="submit" 
                disabled={false}
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {form.watch('isDraft') ? 'Taslak Kaydet' : 'Ödevi Yayınla'}
              </Button>
              
              <Link to="/dashboard">
                <Button variant="outline">İptal</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

    </div>
  );
};
