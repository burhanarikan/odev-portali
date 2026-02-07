import { useStudentEvaluations } from '@/hooks/useAssignments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/formatDate';
import { FileText, Award, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLoading } from '@/components/feedback/PageLoading';
import { PageError } from '@/components/feedback/PageError';

type EvaluatedSubmission = {
  id: string;
  assignmentId: string;
  submittedAt: string;
  assignment: {
    id: string;
    title: string;
    level?: { name: string };
  };
  evaluation: {
    score?: number;
    feedback?: string;
    accepted: boolean;
  };
};

export const EvaluationsPage = () => {
  const { data: evaluations = [], isLoading, error, refetch } = useStudentEvaluations();
  const list = evaluations as unknown as EvaluatedSubmission[];

  if (isLoading) {
    return <PageLoading message="Değerlendirmeler yükleniyor…" />;
  }

  if (error) {
    const message = (error as Error)?.message || 'Değerlendirmeler yüklenirken bir hata oluştu.';
    return <PageError message={message} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Değerlendirmelerim</h1>
        <p className="page-description">
          Öğretmenlerinizin verdiği puan ve geri bildirimler
        </p>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Award className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-600 font-medium">Henüz değerlendirme yok</p>
            <p className="text-sm text-gray-500 mt-1">
              Teslim ettiğiniz ödevler değerlendirildikçe burada listelenecek.
            </p>
            <Link to="/student" className="mt-4">
              <Button variant="outline">Ana Sayfaya Dön</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {list.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        <Link
                          to={`/assignments/${item.assignment.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {item.assignment.title}
                        </Link>
                      </CardTitle>
                      <CardDescription>
                        {item.assignment.level?.name ?? ''} · Teslim: {formatDate(item.submittedAt)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.evaluation.score != null && (
                      <Badge className="bg-green-100 text-green-800">
                        {item.evaluation.score}/100
                      </Badge>
                    )}
                    {item.evaluation.accepted ? (
                      <Badge variant="secondary">Kabul edildi</Badge>
                    ) : (
                      <Badge variant="outline">Değerlendirildi</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              {item.evaluation.feedback && (
                <CardContent className="pt-0">
                  <div className="flex gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    <MessageSquare className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <p className="whitespace-pre-wrap">{item.evaluation.feedback}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
