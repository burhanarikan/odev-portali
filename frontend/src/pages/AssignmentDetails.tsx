import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStudentAssignment, useTeacherAssignment, useSubmitEvaluation, useDeleteAssignment } from '@/hooks/useAssignments';
import { useAuthStore } from '@/store/authStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, formatRelativeTime } from '@/utils/formatDate';
import { Calendar, Clock, User, FileText, Download, AlertCircle, ArrowLeft, ChevronDown, ChevronUp, Trash2, AlertTriangle } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { SubmissionForm } from '@/components/student/SubmissionForm';

export const AssignmentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const isStudent = user?.role === 'STUDENT';
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();

  const studentResult = useStudentAssignment(id ?? '');
  const teacherResult = useTeacherAssignment(id ?? '');
  const submitEvaluationMutation = useSubmitEvaluation();
  const deleteAssignmentMutation = useDeleteAssignment();

  const assignment = isStudent ? studentResult.data : teacherResult.data;
  const isLoading = isStudent ? studentResult.isLoading : teacherResult.isLoading;
  const error = isStudent ? studentResult.error : teacherResult.error;

  if (!id?.trim()) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-600 font-medium">Ödev adresi geçersiz</p>
          <Link to="/dashboard" className="mt-4">
            <Button variant="outline">Ana Sayfaya Dön</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
        <p className="text-sm text-gray-500">Ödev yükleniyor…</p>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-red-600 font-medium">Ödev yüklenirken bir hata oluştu.</p>
          <p className="text-sm text-gray-500 mt-1">
            Bu ödev size atanmamış olabilir veya artık mevcut olmayabilir.
          </p>
          <Link to="/dashboard" className="mt-4">
            <Button variant="outline">Ana Sayfaya Dön</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const hasSubmitted = assignment.submissions && assignment.submissions.length > 0;
  const submission = assignment.submissions?.[0];

  // Backend bazen attachments'ı JSON string döndürüyor; normalize et, tüm bileşende güvenle kullan
  const attachmentList = ((): string[] => {
    const a = assignment.attachments;
    if (Array.isArray(a)) return a;
    if (typeof a === 'string') {
      try {
        const parsed = JSON.parse(a);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  })();
  const normalizedAssignment = { ...assignment, attachments: attachmentList };

  // Ödevi tanımlayan hoca giriş yapan kullanıcı mı? (Başka hoca değerlendiremez)
  const canEvaluate =
    !!user?.id && !!normalizedAssignment.teacher?.user?.id && user.id === normalizedAssignment.teacher.user.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{normalizedAssignment.title}</h1>
            <p className="text-gray-600">
              {normalizedAssignment.level?.name} - {normalizedAssignment.weekNumber}. Hafta
            </p>
          </div>
          {normalizedAssignment.isDraft && (
            <Badge variant="outline">Taslak</Badge>
          )}
        </div>
        {!isStudent && (
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Ödevi Sil
          </Button>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ödevi sil</DialogTitle>
            <DialogDescription>
              Bu ödevi silmek istediğinize emin misiniz? Tüm teslimler ve değerlendirmeler de silinecektir. Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button
              variant="destructive"
              disabled={deleteAssignmentMutation.isPending}
              onClick={async () => {
                await deleteAssignmentMutation.mutateAsync(normalizedAssignment.id);
                setDeleteDialogOpen(false);
                navigate('/dashboard');
              }}
            >
              {deleteAssignmentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ödev Açıklaması</CardTitle>
            </CardHeader>
            <CardContent>
              {normalizedAssignment.description ? (
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700">
                    {normalizedAssignment.description}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 italic">Açıklama bulunmuyor</p>
              )}
            </CardContent>
          </Card>

          {attachmentList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ekli Dosyalar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {attachmentList.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{attachment}</span>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {isStudent && (
            <Card>
              <CardHeader>
                <CardTitle>Ödev Teslimi</CardTitle>
                <CardDescription>
                  {hasSubmitted 
                    ? `Ödevi ${formatRelativeTime(submission!.submittedAt)} teslim ettiniz`
                    : 'Ödevinizi teslim etmek için aşağıdaki formu kullanın'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasSubmitted ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-green-800">
                        <FileText className="h-5 w-5" />
                        <span className="font-medium">Teslim Edildi</span>
                      </div>
                      <p className="text-green-700 text-sm mt-1">
                        Teslim tarihi: {formatDate(submission!.submittedAt)}
                      </p>
                      {submission!.isLate && (
                        <div className="flex items-center space-x-2 text-yellow-700 text-sm mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <span>Gecikmiş teslim</span>
                        </div>
                      )}
                    </div>
                    
                    {submission!.contentText && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Teslim Edilen Metin:</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {submission!.contentText}
                          </p>
                        </div>
                      </div>
                    )}

                    {submission!.evaluation && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-2">Değerlendirme</h4>
                        {submission!.evaluation.score && (
                          <p className="text-blue-700">
                            Puan: {submission!.evaluation.score}/100
                          </p>
                        )}
                        {submission!.evaluation.feedback && (
                          <p className="text-blue-700 mt-2">
                            Geri bildirim: {submission!.evaluation.feedback}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <SubmissionForm assignmentId={normalizedAssignment.id} />
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ödev Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Öğretmen:</span>
                <span className="text-sm font-medium">
                  {normalizedAssignment.teacher?.user?.name}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Başlangıç:</span>
                <span className="text-sm font-medium">
                  {formatDate(normalizedAssignment.startDate)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Son teslim:</span>
                <span className="text-sm font-medium">
                  {formatDate(normalizedAssignment.dueDate)}
                </span>
              </div>
            </CardContent>
          </Card>

          {!isStudent && normalizedAssignment.submissions && normalizedAssignment.submissions.length > 0 && (
            <SubmissionListCard
              submissions={normalizedAssignment.submissions}
              expandedId={expandedSubmissionId}
              onToggleExpand={setExpandedSubmissionId}
              onSubmitEvaluation={submitEvaluationMutation.mutateAsync}
              isSubmitting={submitEvaluationMutation.isPending}
              onSuccess={() => {
                teacherResult.refetch();
              }}
              canEvaluate={canEvaluate}
              assignmentCreatorName={normalizedAssignment.teacher?.user?.name}
            />
          )}
        </div>
      </div>
    </div>
  );
}

type SubmissionItem = {
  id: string;
  submittedAt: string;
  isLate: boolean;
  contentText?: string | null;
  evaluation?: { score?: number; feedback?: string; accepted: boolean } | null;
  student?: { user?: { name: string } } | null;
};

function SubmissionListCard({
  submissions,
  expandedId,
  onToggleExpand,
  onSubmitEvaluation,
  isSubmitting,
  onSuccess,
  canEvaluate,
  assignmentCreatorName,
}: {
  submissions: SubmissionItem[];
  expandedId: string | null;
  onToggleExpand: (id: string | null) => void;
  onSubmitEvaluation: (params: {
    submissionId: string;
    data: { score?: number; feedback?: string; accepted: boolean };
  }) => Promise<unknown>;
  isSubmitting: boolean;
  onSuccess: () => void;
  canEvaluate: boolean;
  assignmentCreatorName?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Teslimler</CardTitle>
        <CardDescription>
          {submissions.length} öğrenci teslim etti
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!canEvaluate && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>
              Bu ödevi {assignmentCreatorName ? `${assignmentCreatorName} ` : 'başka bir hoca '}tanımlamıştır.
              Yetki almadan değerlendirme yapamazsınız.
            </p>
          </div>
        )}
        <div className="space-y-2">
          {submissions.map((sub) => (
            <div key={sub.id} className="border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => onToggleExpand(expandedId === sub.id ? null : sub.id)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
              >
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">{sub.student?.user?.name ?? 'Öğrenci'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {sub.isLate && (
                    <Badge variant="destructive" className="text-xs">Gecikmiş</Badge>
                  )}
                  {sub.evaluation && (
                    <Badge variant="secondary" className="text-xs">
                      {sub.evaluation.score != null ? `${sub.evaluation.score}/100` : 'Değerlendirildi'}
                    </Badge>
                  )}
                  {expandedId === sub.id ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </button>
              {expandedId === sub.id && (
                canEvaluate ? (
                  <SubmissionEvaluationForm
                    submission={sub}
                    onSubmit={async (data) => {
                      await onSubmitEvaluation({ submissionId: sub.id, data });
                      onSuccess();
                      onToggleExpand(null);
                    }}
                    isSubmitting={isSubmitting}
                  />
                ) : (
                  <div className="p-4 pt-0 border-t bg-gray-50/50 flex items-center gap-2 text-sm text-amber-700">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>Bu teslimi sadece ödevi tanımlayan hoca değerlendirebilir.</span>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SubmissionEvaluationForm({
  submission,
  onSubmit,
  isSubmitting,
}: {
  submission: SubmissionItem;
  onSubmit: (data: { score?: number; feedback?: string; accepted: boolean }) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [score, setScore] = useState<string>(
    submission.evaluation?.score != null ? String(submission.evaluation.score) : ''
  );
  const [feedback, setFeedback] = useState<string>(submission.evaluation?.feedback ?? '');
  const [accepted, setAccepted] = useState<boolean>(submission.evaluation?.accepted ?? false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numScore = score.trim() === '' ? undefined : Number(score);
    if (numScore != null && (numScore < 0 || numScore > 100)) return;
    await onSubmit({
      score: numScore,
      feedback: feedback.trim() || undefined,
      accepted,
    });
  };

  return (
    <div className="p-4 pt-0 border-t bg-gray-50/50 space-y-4">
      {submission.contentText && (
        <div>
          <Label className="text-xs text-gray-500">Teslim edilen metin</Label>
          <div className="mt-1 p-3 bg-white border rounded text-sm text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
            {submission.contentText}
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor={`score-${submission.id}`}>Puan (0-100)</Label>
          <Input
            id={`score-${submission.id}`}
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`feedback-${submission.id}`}>Geri bildirim</Label>
          <Textarea
            id={`feedback-${submission.id}`}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            className="mt-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`accepted-${submission.id}`}
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor={`accepted-${submission.id}`} className="font-normal">
            Teslim kabul edildi
          </Label>
        </div>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Kaydet
        </Button>
      </form>
    </div>
  );
}
