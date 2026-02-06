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
import { useCreateAssignment, useCheckSimilarity } from '@/hooks/useAssignments';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
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
  const [showSimilarityWarning, setShowSimilarityWarning] = useState(false);
  const [similarAssignments, setSimilarAssignments] = useState<any[]>([]);

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      isDraft: false,
      weekNumber: 1,
    },
  });

  const checkSimilarity = async (data: AssignmentFormData) => {
    try {
      const result = await similarityMutation.mutateAsync(data);
      if (result.similarAssignments.length > 0) {
        setSimilarAssignments(result.similarAssignments);
        setShowSimilarityWarning(true);
        return false;
      }
      return true;
    } catch (error) {
      return true;
    }
  };

  const onSubmit = async (data: AssignmentFormData) => {
    console.log('Form submit edildi:', data);
    // Doğrudan ödev oluştur - similarity check'i tamamen kaldır
    createAssignment(data);
  };

  const createAssignment = (data: AssignmentFormData) => {
    console.log('Ödev oluşturma verisi:', data);
    
    // Backend'e gönderirken tarih formatını düzelt
    const backendData = {
      ...data,
      startDate: data.startDate || new Date().toISOString(),
      dueDate: data.dueDate || new Date().toISOString(),
    };
    
    console.log('Backend verisi:', backendData);
    
    createMutation.mutate(backendData, {
      onSuccess: () => {
        console.log('Ödev oluşturma başarılı');
        toast({
          title: "Başarılı",
          description: "Ödev başarıyla oluşturuldu.",
        });
        navigate('/dashboard');
      },
      onError: (error) => {
        console.error('Ödev oluşturma hatası:', error);
        toast({
          title: "Hata",
          description: "Ödev oluşturulurken bir hata oluştu.",
          variant: "destructive",
        });
      },
    });
  };

  const proceedAnyway = () => {
    const data = form.getValues();
    setShowSimilarityWarning(false);
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
                  <SelectTrigger>
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
                {...form.register('description')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="levelId">Seviye</Label>
                <Select onValueChange={(value) => form.setValue('levelId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seviye seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="129097d5-dfad-45fe-886d-bdcffb3a30eb">A1</SelectItem>
                    <SelectItem value="950085d8-c613-4a72-a35c-cb5ff075cb2d">A2</SelectItem>
                    <SelectItem value="ee6518e7-54e9-42c3-a12e-db2623d796e1">B1</SelectItem>
                    <SelectItem value="abc82634-7318-42c1-a54a-287fa5c1ec50">B2</SelectItem>
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
                  {...form.register('dueDate')}
                />
                {form.formState.errors.dueDate && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.dueDate.message}
                  </p>
                )}
              </div>
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
              <Button onClick={() => setShowSimilarityWarning(false)} variant="outline">
                İptal Et
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
