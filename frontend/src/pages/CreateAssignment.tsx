import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateAssignment, useCheckSimilarity, useLevels, useTeacherStudents } from '@/hooks/useAssignments';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, AlertTriangle, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

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
  const similarityMutation = useCheckSimilarity();
  const { data: levels = [], isLoading: levelsLoading } = useLevels();
  const { data: studentsList = [] } = useTeacherStudents();
  const [showSimilarityWarning, setShowSimilarityWarning] = useState(false);
  const [similarAssignments, setSimilarAssignments] = useState<import('@/types').SimilarAssignment[]>([]);
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
  const studentsInLevel = levelId
    ? studentsList.filter((s) => s.class?.level?.id === levelId)
    : [];
  const classesInLevel = studentsInLevel.reduce<{ id: string; name: string }[]>((acc, s) => {
    if (s.class && !acc.some((c) => c.id === s.class!.id)) acc.push({ id: s.class.id, name: s.class.name });
    return acc;
  }, []);

  const onSubmit = async (data: AssignmentFormData) => {
    console.log('Form submit edildi:', data);
    // Doğrudan ödev oluştur - similarity check'i tamamen kaldır
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

  const proceedAnyway = () => {
    const data = form.getValues();
    setShowSimilarityWarning(false);
    setSimilarAssignments([]);
    createAssignment(data);
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
                {createMutation.isPending || similarityMutation.isPending ? (
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

      {showSimilarityWarning && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Benzer Ödev Uyarısı</span>
            </CardTitle>
            <CardDescription>
              Bu ödevle benzer ödevler zaten mevcut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {similarAssignments.map((assignment) => (
                <div key={assignment.id} className="p-3 bg-white rounded border">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                      <p className="text-sm text-gray-600">
                        {assignment.levelName} - {assignment.weekNumber}. Hafta
                      </p>
                      <p className="text-sm text-gray-500">
                        Öğretmen: {assignment.teacherName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-yellow-600">
                        %{assignment.similarityScore} benzerlik
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex space-x-4">
              <Button onClick={proceedAnyway} variant="default">
                Yine de Devam Et
              </Button>
              <Button onClick={() => { setShowSimilarityWarning(false); setSimilarAssignments([]); }} variant="outline">
                İptal Et
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
