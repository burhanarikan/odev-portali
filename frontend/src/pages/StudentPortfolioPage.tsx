import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { analyticsApi } from '@/api/analytics.api';
import { ArrowLeft, BookOpen, FileText } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';

export const StudentPortfolioPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: portfolio, isLoading, error } = useQuery({
    queryKey: ['analytics', 'portfolio', id],
    queryFn: () => analyticsApi.getStudentPortfolio(id ?? ''),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="space-y-4">
        <Link to="/students">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Öğrencilere dön
          </Button>
        </Link>
        <p className="text-red-600">Portfolyo yüklenemedi.</p>
      </div>
    );
  }

  const { student, evaluations, summary } = portfolio;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/students/${id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Öğrenciye dön
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Öğrenim yolculuğu</h1>
        <p className="text-gray-600">{student.name} · {student.class} · {student.level}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Özet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Ortalama puan</p>
              <p className="text-xl font-semibold">{summary.averageScore != null ? summary.averageScore.toFixed(1) : '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Teslim / Toplam ödev</p>
              <p className="text-xl font-semibold">{summary.submittedCount} / {summary.totalAssignments}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Katılım (yoklama)</p>
              <p className="text-xl font-semibold">%{summary.attendanceRate.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Devamsızlık</p>
              <p className="text-xl font-semibold">%{summary.absenceRate.toFixed(0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Değerlendirmeler ve geri bildirimler
          </CardTitle>
          <CardDescription>Hocaların bıraktığı notlar</CardDescription>
        </CardHeader>
        <CardContent>
          {evaluations.length === 0 ? (
            <p className="text-gray-500 text-sm">Henüz değerlendirme yok.</p>
          ) : (
            <ul className="space-y-4">
              {evaluations.map((e, i) => (
                <li key={i} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-medium">{e.assignmentTitle}</span>
                    <div className="flex items-center gap-2">
                      {e.weekNumber > 0 && <Badge variant="outline">{e.weekNumber}. Hafta</Badge>}
                      {e.score != null && <Badge variant="secondary">{e.score} puan</Badge>}
                    </div>
                  </div>
                  {e.feedback && (
                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap bg-gray-50 p-2 rounded">
                      {e.feedback}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Teslim: {formatDate(e.submittedAt)}
                    {e.evaluatedAt && ` · Değerlendirme: ${formatDate(e.evaluatedAt)}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
