import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStudentAssignments } from '@/hooks/useAssignments';
import { peerReviewApi, type SubmissionToReview, type MyReceivedPeerReviewGroup } from '@/api/peerReview.api';
import { useToast } from '@/components/ui/use-toast';
import { MessageSquare, Inbox, Loader2, Star, Send } from 'lucide-react';

type Tab = 'give' | 'received';

export const PeerReviewPage = () => {
  const { toast } = useToast();
  const { data: assignmentsData } = useStudentAssignments();
  const [tab, setTab] = useState<Tab>('give');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [submissionsToReview, setSubmissionsToReview] = useState<SubmissionToReview[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [receivedGroups, setReceivedGroups] = useState<MyReceivedPeerReviewGroup[]>([]);
  const [loadingReceived, setLoadingReceived] = useState(false);
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState<string | null>(null);
  const [score, setScore] = useState<number>(5);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const peerAssignments = [
    ...(assignmentsData?.active ?? []),
    ...(assignmentsData?.past ?? []),
  ].filter((a) => a.peerReviewEnabled);

  useEffect(() => {
    if (tab === 'received') {
      setLoadingReceived(true);
      peerReviewApi
        .getMyReceivedPeerReviews()
        .then(setReceivedGroups)
        .catch(() => toast({ title: 'Hata', description: 'Bana gelen değerlendirmeler yüklenemedi.', variant: 'destructive' }))
        .finally(() => setLoadingReceived(false));
    }
  }, [tab, toast]);

  useEffect(() => {
    if (tab === 'give' && selectedAssignmentId) {
      setLoadingSubmissions(true);
      setSubmissionsToReview([]);
      peerReviewApi
        .getSubmissionsToReview(selectedAssignmentId)
        .then(setSubmissionsToReview)
        .catch((err) => {
          const msg = err.response?.data?.error ?? 'Değerlendirilecek ödevler yüklenemedi.';
          toast({ title: 'Hata', description: msg, variant: 'destructive' });
        })
        .finally(() => setLoadingSubmissions(false));
    }
  }, [tab, selectedAssignmentId, toast]);

  const handleSubmitReview = async () => {
    if (!reviewingSubmissionId) return;
    setSubmitting(true);
    try {
      await peerReviewApi.submitPeerReview({
        submissionId: reviewingSubmissionId,
        score,
        feedback: feedback.trim() || undefined,
      });
      toast({ title: 'Gönderildi', description: 'Akran değerlendirmeniz kaydedildi.' });
      setReviewingSubmissionId(null);
      setFeedback('');
      setScore(5);
      setSubmissionsToReview((prev) => prev.filter((s) => s.submissionId !== reviewingSubmissionId));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gönderilemedi.';
      toast({ title: 'Hata', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Akran Değerlendirme</h1>
        <p className="text-gray-600">Arkadaşlarınızın ödevlerini anonim olarak puanlayın; bana gelen değerlendirmeleri görün.</p>
      </div>

      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setTab('give')}
          className={`px-4 py-2 text-sm font-medium rounded-t-md ${tab === 'give' ? 'bg-gray-100 text-gray-900 border border-b-0 border-gray-200' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <MessageSquare className="inline h-4 w-4 mr-2" />
          Değerlendir
        </button>
        <button
          type="button"
          onClick={() => setTab('received')}
          className={`px-4 py-2 text-sm font-medium rounded-t-md ${tab === 'received' ? 'bg-gray-100 text-gray-900 border border-b-0 border-gray-200' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <Inbox className="inline h-4 w-4 mr-2" />
          Bana gelenler
        </button>
      </div>

      {tab === 'give' && (
        <Card>
          <CardHeader>
            <CardTitle>Değerlendirilecek ödevler</CardTitle>
            <CardDescription>
              Ödev seçin; size atanan anonim teslimleri 1–10 arası puanlayıp kısa geri bildirim yazın.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Ödev seçin</Label>
              <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Akran değerlendirmeli bir ödev seçin" />
                </SelectTrigger>
                <SelectContent>
                  {peerAssignments.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      Akran değerlendirmeli ödev yok
                    </SelectItem>
                  ) : (
                    peerAssignments.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.title} · {a.weekNumber}. Hafta
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {loadingSubmissions && (
              <div className="flex items-center gap-2 text-gray-500 py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Yükleniyor…</span>
              </div>
            )}

            {!loadingSubmissions && selectedAssignmentId && submissionsToReview.length === 0 && selectedAssignmentId !== '_none' && (
              <p className="text-gray-500 py-4">Değerlendirecek yeni ödev kalmadı veya bu ödevde size atanan teslim yok.</p>
            )}

            {!loadingSubmissions && submissionsToReview.length > 0 && !reviewingSubmissionId && (
              <ul className="space-y-2">
                {submissionsToReview.map((s) => (
                  <li key={s.submissionId}>
                    <Card className="border-gray-200">
                      <CardContent className="py-3 flex flex-row items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {s.contentPreview || '(Metin yok)'}
                            {s.hasAudio && <span className="ml-1 text-xs text-gray-500">🎤 Ses</span>}
                            {s.hasFile && <span className="ml-1 text-xs text-gray-500">📎 Dosya</span>}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Teslim: {new Date(s.submittedAt).toLocaleString('tr-TR')}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setReviewingSubmissionId(s.submissionId)}
                        >
                          Puanla
                        </Button>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}

            {reviewingSubmissionId && (
              <Card className="border-blue-200 bg-blue-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Puan ve geri bildirim</CardTitle>
                  <CardDescription>1–10 arası puan verin; isteğe bağlı kısa geri bildirim yazın.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Puan (1–10)</Label>
                    <Select value={String(score)} onValueChange={(v) => setScore(Number(v))}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Geri bildirim (isteğe bağlı)</Label>
                    <Textarea
                      placeholder="Kısa bir yorum yazabilirsiniz..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSubmitReview} disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                      Gönder
                    </Button>
                    <Button variant="outline" onClick={() => { setReviewingSubmissionId(null); setFeedback(''); }}>
                      İptal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'received' && (
        <Card>
          <CardHeader>
            <CardTitle>Bana gelen akran değerlendirmeleri</CardTitle>
            <CardDescription>Ödevlerinize arkadaşlarınızdan gelen anonim puan ve geri bildirimler.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingReceived && (
              <div className="flex items-center gap-2 text-gray-500 py-8">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Yükleniyor…</span>
              </div>
            )}
            {!loadingReceived && receivedGroups.length === 0 && (
              <p className="text-gray-500 py-8">Henüz size gelen akran değerlendirmesi yok.</p>
            )}
            {!loadingReceived && receivedGroups.length > 0 && (
              <ul className="space-y-4">
                {receivedGroups.map((g) => (
                  <li key={g.submissionId}>
                    <Card className="border-gray-200">
                      <CardHeader className="py-3">
                        <CardTitle className="text-base">{g.assignmentTitle}</CardTitle>
                        <CardDescription>{g.weekNumber}. Hafta · {g.reviews.length} değerlendirme</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        {g.reviews.map((r) => (
                          <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                            <span className="flex items-center gap-1 text-amber-600" title="Puan">
                              <Star className="h-4 w-4" />
                              <span className="font-medium">{r.score}</span>/10
                            </span>
                            {r.feedback && <p className="text-sm text-gray-700 flex-1">{r.feedback}</p>}
                            <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString('tr-TR')}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
