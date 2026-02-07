import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { timelineApi, type TimelinePost } from '@/api/timeline.api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/utils/formatDate';
import { Loader2, Calendar, Link as LinkIcon, Send } from 'lucide-react';

export const TimelinePage = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isStudent = user?.role === 'STUDENT';

  const { data: posts = [], isLoading, error: timelineError } = useQuery({
    queryKey: ['timeline', 'my'],
    queryFn: timelineApi.getMyTimeline,
    enabled: isStudent,
  });

  const { data: teacherClasses = [], error: teacherClassesError } = useQuery({
    queryKey: ['timeline', 'teacher-classes'],
    queryFn: timelineApi.getTeacherClasses,
    enabled: !isStudent,
  });

  const [selectedClassId, setSelectedClassId] = useState('');
  useEffect(() => {
    if (!isStudent && teacherClasses.length > 0 && !selectedClassId) {
      setSelectedClassId(teacherClasses[0].id);
    }
  }, [isStudent, teacherClasses, selectedClassId]);
  const { data: classPosts = [] } = useQuery({
    queryKey: ['timeline', 'class', selectedClassId],
    queryFn: () => timelineApi.getTimelineByClass(selectedClassId),
    enabled: !isStudent && !!selectedClassId,
  });

  const [summary, setSummary] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const createMutation = useMutation({
    mutationFn: timelineApi.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      setSummary('');
      setImageUrl('');
      setLinkUrl('');
      toast({ title: 'Paylaşım eklendi.' });
    },
    onError: (e: { response?: { data?: { error?: string } } }) => {
      toast({ title: 'Hata', description: e.response?.data?.error ?? 'Eklenemedi', variant: 'destructive' });
    },
  });

  const displayPosts = isStudent ? posts : classPosts;
  const hasError = isStudent ? timelineError : teacherClassesError;

  const handleSubmit = () => {
    if (!selectedClassId && !isStudent) {
      toast({ title: 'Sınıf seçin', variant: 'destructive' });
      return;
    }
    if (!summary.trim()) {
      toast({ title: 'En az 1 cümlelik özet yazın', variant: 'destructive' });
      return;
    }
    createMutation.mutate({
      classId: selectedClassId,
      summary: summary.trim(),
      imageUrl: imageUrl.trim() || undefined,
      linkUrl: linkUrl.trim() || undefined,
    });
  };

  if (hasError) {
    const message = (hasError as Error)?.message || 'Zaman tüneli yüklenemedi.';
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sınıfın Zaman Tüneli</h1>
          <p className="text-gray-600">Haftalık ders özetleri ve paylaşımlar</p>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sınıfın Zaman Tüneli</h1>
        <p className="text-gray-600">
          {isStudent ? 'Haftalık ders özetleri ve paylaşımlar' : 'Ders sonrası özet paylaşın (3 cümle, foto veya link)'}
        </p>
      </div>

      {!isStudent && (
        <Card>
          <CardHeader>
            <CardTitle>Yeni paylaşım</CardTitle>
            <CardDescription>Bugünkü ders özeti (konu, bir foto veya link)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Sınıf</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger><SelectValue placeholder="Sınıf seçin" /></SelectTrigger>
                <SelectContent>
                  {teacherClasses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.level?.name ? `· ${c.level.name}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Özet (3 cümle)</Label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Bugün neler işledik?"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Fotoğraf URL (isteğe bağlı)</Label>
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label>Link (isteğe bağlı)</Label>
                <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || !summary.trim()}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Send className="h-4 w-4 mr-2" />
              Paylaş
            </Button>
          </CardContent>
        </Card>
      )}

      {!isStudent && teacherClasses.length > 0 && !selectedClassId && (
        <p className="text-gray-500">Paylaşım görmek için yukarıdan bir sınıf seçin veya önce paylaşım ekleyin.</p>
      )}

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {!isLoading && displayPosts.length === 0 && (isStudent || selectedClassId) && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Henüz paylaşım yok.
          </CardContent>
        </Card>
      )}

      {!isLoading && displayPosts.length > 0 && (
        <div className="space-y-4">
          {displayPosts.map((post: TimelinePost) => (
            <Card key={post.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(post.postDate)}
                    {post.class?.name && (
                      <span className="text-sm font-normal text-gray-500">· {post.class.name}</span>
                    )}
                  </CardTitle>
                  <CardDescription>{post.teacher?.user?.name ?? 'Hoca'}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="whitespace-pre-wrap text-gray-700">{post.summary}</p>
                {post.imageUrl && (
                  <div>
                    <img src={post.imageUrl} alt="" className="max-w-full rounded-lg max-h-64 object-contain" />
                  </div>
                )}
                {post.linkUrl && (
                  <a
                    href={post.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                  >
                    <LinkIcon className="h-4 w-4" /> Link
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
