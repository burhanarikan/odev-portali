import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { teacherWikiApi, type TeacherWikiPage as TeacherWikiPageType } from '@/api/teacherWiki.api';
import { toast } from 'sonner';
import { BookOpen, Plus, Pencil, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const CATEGORIES = ['Ders İşleniş Rehberi', 'Zor Konular', 'Genel', 'Diğer'];

export const TeacherWikiList = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['teacher-wiki'],
    queryFn: () => teacherWikiApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: teacherWikiApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-wiki'] });
      setDialogOpen(false);
      setTitle('');
      setContent('');
      setCategory('');
      toast.success('Sayfa eklendi.');
    },
    onError: (e: { response?: { data?: { error?: string } } }) => {
      toast.error(e.response?.data?.error ?? 'Eklenemedi');
    },
  });

  const handleCreate = () => {
    if (!title.trim()) {
      toast.error('Başlık gerekli');
      return;
    }
    if (!content.trim()) {
      toast.error('İçerik gerekli');
      return;
    }
    createMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      category: category.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Öğretmenler Odası</h1>
          <p className="text-muted-foreground">Ders rehberi, zor konular nasıl anlatılır — sadece öğretmenlere açık wiki</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Sayfa
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && pages.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Henüz sayfa yok. İlk sayfayı siz ekleyin (örn. Ders İşleniş Rehberi, Zor Konular).
          </CardContent>
        </Card>
      )}

      {!isLoading && pages.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {pages.map((p: TeacherWikiPageType) => (
            <Link key={p.id} to={`/teacher-wiki/${p.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    {p.title}
                  </CardTitle>
                  <CardDescription>
                    {p.category ?? 'Genel'} · {p.teacher?.user?.name ?? '—'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">{p.content}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yeni wiki sayfası</DialogTitle>
            <DialogDescription>Ders rehberi veya zor konu notu ekleyin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Başlık</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Şimdiki Zaman Nasıl Anlatılır?"
              />
            </div>
            <div>
              <Label>Kategori (isteğe bağlı)</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="">Seçin</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>İçerik</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder="Metin, madde madde notlar, linkler..."
                className="resize-y"
              />
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

export const TeacherWikiDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const { data: page, isLoading } = useQuery({
    queryKey: ['teacher-wiki', id],
    queryFn: () => teacherWikiApi.get(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id: pageId, data }: { id: string; data: { title?: string; content?: string; category?: string } }) =>
      teacherWikiApi.update(pageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-wiki'] });
      setEditOpen(false);
      toast.success('Sayfa güncellendi.');
    },
    onError: (e: { response?: { data?: { error?: string } } }) => {
      toast.error(e.response?.data?.error ?? 'Güncellenemedi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: teacherWikiApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-wiki'] });
      toast.success('Sayfa silindi.');
      navigate('/teacher-wiki');
    },
    onError: (e: { response?: { data?: { error?: string } } }) => {
      toast.error(e.response?.data?.error ?? 'Silinemedi');
    },
  });

  const openEdit = () => {
    if (page) {
      setEditTitle(page.title);
      setEditContent(page.content);
      setEditCategory(page.category ?? '');
      setEditOpen(true);
    }
  };

  const handleUpdate = () => {
    if (!id || !editTitle.trim() || !editContent.trim()) {
      toast.error('Başlık ve içerik gerekli');
      return;
    }
    updateMutation.mutate({
      id,
      data: {
        title: editTitle.trim(),
        content: editContent.trim(),
        category: editCategory.trim() || undefined,
      },
    });
  };

  if (!id) return null;
  if (isLoading || !page) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/teacher-wiki')} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Listeye dön
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{page.title}</CardTitle>
            <CardDescription>
              {page.category ?? 'Genel'} · {page.teacher?.user?.name ?? '—'} · {new Date(page.updatedAt).toLocaleDateString('tr-TR')}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openEdit} className="gap-1">
              <Pencil className="h-4 w-4" />
              Düzenle
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                if (window.confirm('Bu sayfayı silmek istediğinize emin misiniz?')) {
                  deleteMutation.mutate(id);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground">{page.content}</div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sayfayı düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Başlık</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div>
              <Label>Kategori</Label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="">Seçin</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>İçerik</Label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
                className="resize-y"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>İptal</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

