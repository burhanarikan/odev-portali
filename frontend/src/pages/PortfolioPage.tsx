import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { studentApi } from '@/api/student.api';
import { useAuthStore } from '@/store/authStore';
import { Loader2, BookOpen, FileText, Radar } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';
import { SkillRadarChart } from '@/components/charts/SkillRadarChart';

export const PortfolioPage = () => {
  const { user } = useAuthStore();
  const { data: portfolio, isLoading, error } = useQuery({
    queryKey: ['student', 'portfolio'],
    queryFn: studentApi.getMyPortfolio,
    enabled: user?.role === 'STUDENT',
  });

  if (user?.role !== 'STUDENT') {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Bu sayfa sadece öğrenciler içindir.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-red-600">
          Portfolyo yüklenemedi.
        </CardContent>
      </Card>
    );
  }

  const { student, evaluations, summary, skillScores } = portfolio;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Öğrenim Yolculuğum</h1>
        <p className="text-gray-600">Ödev notları, devamsızlık ve geri bildirimler</p>
      </div>

      {skillScores && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radar className="h-5 w-5" />
              Başarı ısı haritası
            </CardTitle>
            <CardDescription>
              Kelime, dilbilgisi, dinleme ve konuşma alanlarındaki gelişim özeti (0–100)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <SkillRadarChart skillScores={skillScores} size={260} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Özet
          </CardTitle>
          <CardDescription>{student.name} · {student.class} · {student.level}</CardDescription>
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
          <CardDescription>Hocalarınızın bıraktığı notlar</CardDescription>
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
                      {e.weekNumber && <Badge variant="outline">{e.weekNumber}. Hafta</Badge>}
                      {e.score != null && (
                        <Badge variant="secondary">{e.score} puan</Badge>
                      )}
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
