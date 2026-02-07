import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';
import { announcementApi, type Announcement } from '@/api/announcement.api';
import { Megaphone, Loader2, Plus, Trash2 } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';
import { useToast } from '@/components/ui/use-toast';

export const AnnouncementsPage = () => {
  const { user } = useAuthStore();
  const canCreate = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: list = [], isLoading, error: listError } = useQuery({
    queryKey: ['announcements'],
    queryFn: announcementApi.list,
  });

  const createMutation = useMutation({
    mutationFn: announcementApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setOpen(false);
      setTitle('');
      setBody('');
      toast({ title: 'Duyuru eklendi' });
    },
    onError: (e: Error) => {
      toast({ title: 'Hata', description: e.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: announcementApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast({ title: 'Duyuru silindi' });
    },
  });

  const handleCreate = () => {
    if (!title.trim()) {
      toast({ title: 'Başlık girin', variant: 'destructive' });
      return;
    }
    createMutation.mutate({ title: title.trim(), body: body.trim() });
  };

  if (listError) {
    const message = (listError as Error)?.message || 'Duyurular yüklenemedi.';
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Duyurular</h1>
          <p className="text-gray-600">Speaking Club, sınav tarihleri, genel duyurular</p>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Duyurular</h1>
          <p className="text-gray-600">Speaking Club, sınav tarihleri, genel duyurular</p>
        </div>
        {canCreate && (
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Yeni Duyuru
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni duyuru</DialogTitle>
            <DialogDescription>Başlık ve metin girin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Başlık</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Bu Cuma Speaking Club"
              />
            </div>
            <div className="space-y-2">
              <Label>Metin</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Duyuru içeriği..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yayınla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Megaphone className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            Henüz duyuru yok.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(list as Announcement[]).map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{a.title}</CardTitle>
                    <CardDescription>
                      {a.author?.name ?? 'Sistem'} · {formatDate(a.createdAt)}
                    </CardDescription>
                  </div>
                  {canCreate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => deleteMutation.mutate(a.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{a.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
