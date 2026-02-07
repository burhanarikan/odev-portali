import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { teacherResourceApi, type TeacherResource } from '@/api/teacherResource.api';
import { useLevels } from '@/hooks/useAssignments';
import { useToast } from '@/components/ui/use-toast';
import { FileText, ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export const TeacherResourcesPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [levelId, setLevelId] = useState('');

  const { data: levels = [] } = useLevels();
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['teacher-resources', levelFilter],
    queryFn: () => teacherResourceApi.list(levelFilter || undefined),
  });

  const createMutation = useMutation({
    mutationFn: teacherResourceApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-resources'] });
      setDialogOpen(false);
      setTitle('');
      setDescription('');
      setFileUrl('');
      setLinkUrl('');
      setLevelId('');
      toast({ title: 'Materyal eklendi.' });
    },
    onError: (e: { response?: { data?: { error?: string } } }) => {
      toast({ title: 'Hata', description: e.response?.data?.error ?? 'Eklenemedi', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: teacherResourceApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-resources'] });
      toast({ title: 'Silindi.' });
    },
  });

  const handleCreate = () => {
    if (!title.trim()) {
      toast({ title: 'Başlık gerekli', variant: 'destructive' });
      return;
    }
    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      fileUrl: fileUrl.trim() || undefined,
      linkUrl: linkUrl.trim() || undefined,
      levelId: levelId || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ders Paylaşım Havuzu</h1>
          <p className="text-gray-600">Hocalar arası ortak materyal kütüphanesi</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Havuza Ekle
        </Button>
      </div>

      <div className="flex gap-2 items-center">
        <Label className="text-sm">Seviye filtre:</Label>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">Tümü</option>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {!isLoading && resources.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Henüz materyal yok. Havuza ilk materyali siz ekleyin.
          </CardContent>
        </Card>
      )}

      {!isLoading && resources.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {resources.map((r: TeacherResource) => (
            <Card key={r.id}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{r.title}</CardTitle>
                  <CardDescription>{r.teacher?.user?.name ?? '—'} · {r.level?.name ?? 'Tüm seviye'}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600"
                  onClick={() => deleteMutation.mutate(r.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {r.description && <p className="text-sm text-gray-600 line-clamp-2">{r.description}</p>}
                <div className="flex flex-wrap gap-2">
                  {r.fileUrl && (
                    <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                      <FileText className="h-4 w-4" /> Dosya
                    </a>
                  )}
                  {r.linkUrl && (
                    <a href={r.linkUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                      <ExternalLink className="h-4 w-4" /> Link
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Havuza materyal ekle</DialogTitle>
            <DialogDescription>Başlık, açıklama ve isteğe bağlı dosya/link</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Başlık</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: Şimdiki Zaman sunumu" />
            </div>
            <div>
              <Label>Açıklama (isteğe bağlı)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Dosya URL (isteğe bağlı)</Label>
              <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>Link (isteğe bağlı)</Label>
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>Seviye (isteğe bağlı)</Label>
              <select value={levelId} onChange={(e) => setLevelId(e.target.value)} className="w-full border rounded px-3 py-2">
                <option value="">Tümü</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
