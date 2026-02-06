import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTeacherSubmissions } from '@/hooks/useAssignments';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2 } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';

export const SubmissionsPage = () => {
  const { data: submissions = [], isLoading } = useTeacherSubmissions();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[280px] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
        <p className="text-sm text-gray-500">Teslimler yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Teslimler</h1>
        <p className="text-gray-600">Öğrencilerin teslim ettiği ödevlerin listesi</p>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            Henüz teslim edilmiş ödev yok.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <Card key={sub.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      <Link
                        to={`/assignments/${sub.assignmentId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {sub.assignment.title}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {sub.assignment.level?.name ?? ''} · {sub.student?.user.name ?? '—'} ({sub.student?.user.email ?? '—'})
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {sub.evaluation ? (
                      <Badge variant={sub.evaluation.accepted ? 'default' : 'secondary'}>
                        {sub.evaluation.score != null ? `${sub.evaluation.score} puan` : 'Değerlendirildi'}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Bekliyor</Badge>
                    )}
                    {sub.isLate && <Badge variant="destructive">Gecikmiş</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600">
                  Teslim: {formatDate(sub.submittedAt)}
                  {sub.contentText && (
                    <>
                      {' · '}
                      <span className="line-clamp-2">{sub.contentText}</span>
                    </>
                  )}
                </p>
                <Link
                  to={`/assignments/${sub.assignmentId}`}
                  className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                >
                  Ödev detayına git →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
