import { useQuery } from '@tanstack/react-query';
import { analyticsApi, type StudentsProgressItem } from '@/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BookOpen, 
  CheckSquare, 
  TrendingUp,
  Activity,
  BarChart3,
  Calendar,
  ClipboardList,
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';
import { Link } from 'react-router-dom';

export const AnalyticsPage = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: analyticsApi.getDashboardStats,
  });
  const { data: studentsProgress = [], isLoading: progressLoading } = useQuery({
    queryKey: ['analytics', 'students-progress'],
    queryFn: analyticsApi.getStudentsProgress,
    enabled: isAdmin,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center text-red-600">
        Analitik verileri yüklenirken bir hata oluştu.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analitik ve Raporlama</h1>
        <p className="text-gray-600">Sistem genel performans ve istatistikler</p>
      </div>

      {/* Ana İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Ödev</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Aktif ödev sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Öğrenciler</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Kayıtlı öğrenci sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teslimler</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              Toplam teslim sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlama Oranı</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Ödev tamamlama oranı
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detaylı İstatistikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seviyeye Göre Ödevler */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Seviyeye Göre Ödev Dağılımı</span>
            </CardTitle>
            <CardDescription>
              Her seviyedeki ödev sayısı
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(stats.assignmentsByLevel ?? []).map((level: { levelName: string; count: number }) => (
                <div key={level.levelName} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{level.levelName}</Badge>
                    <span className="text-sm text-gray-600">{level.count} ödev</span>
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${stats.totalAssignments > 0 ? (level.count / stats.totalAssignments) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Haftalık Teslimler */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Haftalık Teslim Dağılımı</span>
            </CardTitle>
            <CardDescription>
              Haftalara göre teslim sayısı
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.submissionsByWeek.length === 0 ? (
                <p className="text-sm text-gray-500">Henüz teslim yok.</p>
              ) : (
                [...stats.submissionsByWeek]
                  .sort((a: { weekNumber: number }, b: { weekNumber: number }) => a.weekNumber - b.weekNumber)
                  .slice(0, 8)
                  .map((week: { weekNumber: number; count: number }) => {
                    const maxCount = Math.max(...stats.submissionsByWeek.map((w: { count: number }) => w.count), 1);
                    return (
                      <div key={week.weekNumber} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{week.weekNumber}. Hafta</Badge>
                          <span className="text-sm text-gray-600">{week.count} teslim</span>
                        </div>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${Math.max((week.count / maxCount) * 100, 5)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Yönetim: Kur sonu raporu – toplam verilen / tamamlanan oranı */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ClipboardList className="h-5 w-5" />
              <span>Kur sonu raporu – Öğrenci takibi</span>
            </CardTitle>
            <CardDescription>
              Her öğrenci için toplam verilen ödev / tamamlanan ödev oranı (yüzdelik). Hangi öğrenci kaç ödev teslim etmiş; düzenli yapan / yapmayan takibi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {progressLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Öğrenci</th>
                      <th className="text-left py-2 font-medium">Sınıf / Seviye</th>
                      <th className="text-right py-2 font-medium">Teslim</th>
                      <th className="text-right py-2 font-medium">Tamamlama</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(studentsProgress as StudentsProgressItem[]).map((row) => (
                      <tr key={row.studentId} className="border-b hover:bg-gray-50">
                        <td className="py-2">
                          <Link to={`/students/${row.studentId}`} className="text-blue-600 hover:underline font-medium">
                            {row.name}
                          </Link>
                          <p className="text-xs text-gray-500">{row.email}</p>
                        </td>
                        <td className="py-2">
                          {row.className} · {row.levelName}
                        </td>
                        <td className="py-2 text-right">
                          {row.submittedAssignments} / {row.totalAssignments}
                        </td>
                        <td className="py-2 text-right">
                          <Badge variant={row.completionRate >= 80 ? 'default' : row.completionRate >= 50 ? 'secondary' : 'destructive'}>
                            %{Math.round(row.completionRate)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Son Aktiviteler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Son Aktiviteler</span>
          </CardTitle>
          <CardDescription>
            Sistemdeki son hareketler
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(stats.recentActivity ?? []).map((activity: { type: string; title: string; user: string; timestamp: string }, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'assignment_created' ? 'bg-blue-500' : 
                    activity.type === 'submission' ? 'bg-green-500' : 'bg-orange-500'
                  }`} />
                  <div>
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-xs text-gray-600">{activity.user}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={
                    activity.type === 'assignment_created' ? 'default' : 
                    activity.type === 'submission' ? 'secondary' : 'outline'
                  }>
                    {activity.type === 'assignment_created' ? 'Ödev' : 
                     activity.type === 'submission' ? 'Teslim' : 'Değerlendirme'}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
