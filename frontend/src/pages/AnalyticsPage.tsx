import { useQuery } from '@tanstack/react-query';
import { analyticsApi, type StudentsProgressItem } from '@/api';
import { attendanceApi } from '@/api/attendance.api';
import { peerReviewApi } from '@/api/peerReview.api';
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
  Briefcase,
  Award,
  Trophy,
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
  const { data: absenceReport = [], isLoading: absenceLoading } = useQuery({
    queryKey: ['attendance', 'absence-report'],
    queryFn: () => attendanceApi.getAbsenceReport(),
    enabled: !!user && (user.role === 'TEACHER' || user.role === 'ADMIN'),
  });
  const { data: teacherWorkload = [], isLoading: workloadLoading } = useQuery({
    queryKey: ['analytics', 'teacher-workload'],
    queryFn: analyticsApi.getTeacherWorkload,
    enabled: isAdmin,
  });
  const { data: fairnessLeaderboard = [], isLoading: fairnessLoading } = useQuery({
    queryKey: ['peer-review', 'fairness-leaderboard'],
    queryFn: () => peerReviewApi.getFairnessLeaderboard(10),
    enabled: !!user && (user.role === 'TEACHER' || user.role === 'ADMIN'),
  });
  const { data: classLeaderboard = [], isLoading: classLeaderboardLoading } = useQuery({
    queryKey: ['analytics', 'class-leaderboard'],
    queryFn: analyticsApi.getClassLeaderboard,
    enabled: !!user && (user.role === 'TEACHER' || user.role === 'ADMIN'),
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

      {/* Hoca iş yükü (ADMIN) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5" />
              <span>Hoca iş yükü</span>
            </CardTitle>
            <CardDescription>
              Kim kaç ödev vermiş, kaç teslime 24 saat içinde geri bildirim yapılmış
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workloadLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : teacherWorkload.length === 0 ? (
              <p className="text-sm text-gray-500">Veri yok.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Hoca</th>
                      <th className="text-right py-2 font-medium">Ödev</th>
                      <th className="text-right py-2 font-medium">Teslim</th>
                      <th className="text-right py-2 font-medium">Değerlendirilen</th>
                      <th className="text-right py-2 font-medium">24h içinde</th>
                      <th className="text-left py-2 font-medium">Son değerlendirme</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherWorkload.map((row) => (
                      <tr key={row.teacherId} className="border-b hover:bg-gray-50">
                        <td className="py-2 font-medium">{row.teacherName}</td>
                        <td className="py-2 text-right">{row.assignmentCount}</td>
                        <td className="py-2 text-right">{row.submissionCount}</td>
                        <td className="py-2 text-right">{row.evaluatedCount}</td>
                        <td className="py-2 text-right">{row.evaluatedWithin24h}</td>
                        <td className="py-2 text-gray-600">
                          {row.lastEvaluationAt ? formatDate(row.lastEvaluationAt) : '—'}
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

      {/* Devamsızlık raporu (yoklama) */}
      {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ClipboardList className="h-5 w-5" />
              <span>Devamsızlık raporu (yoklama)</span>
            </CardTitle>
            <CardDescription>
              Toplam yoklama oturumu ve katılım; devamsızlık yüzdesi
            </CardDescription>
          </CardHeader>
          <CardContent>
            {absenceLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : absenceReport.length === 0 ? (
              <p className="text-sm text-gray-500">Henüz yoklama verisi yok.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Öğrenci</th>
                      <th className="text-left py-2 font-medium">Sınıf / Seviye</th>
                      <th className="text-right py-2 font-medium">Katılım</th>
                      <th className="text-right py-2 font-medium">Devamsızlık</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absenceReport.map((row) => (
                      <tr key={row.studentId} className="border-b hover:bg-gray-50">
                        <td className="py-2 font-medium">{row.studentName}</td>
                        <td className="py-2">{row.className} · {row.levelName}</td>
                        <td className="py-2 text-right">
                          {row.attendedSessions} / {row.totalSessions} (%{row.attendanceRate.toFixed(1)})
                        </td>
                        <td className="py-2 text-right">
                          <Badge variant={row.absenceRate > 30 ? 'destructive' : row.absenceRate > 15 ? 'secondary' : 'outline'}>
                            %{row.absenceRate.toFixed(1)}
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

      {/* Akran değerlendirme – En adil puan verenler */}
      {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>En adil puan verenler (Akran değerlendirme)</span>
            </CardTitle>
            <CardDescription>
              Hoca puanı ile akran puanı farkı en düşük olan öğrenciler; kaliteli akran değerlendirmesi teşviki.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fairnessLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : fairnessLeaderboard.length === 0 ? (
              <p className="text-sm text-gray-500">Henüz yeterli veri yok (hoca puanı olan teslimlere verilen akran puanları gerekir).</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">#</th>
                      <th className="text-left py-2 font-medium">Öğrenci</th>
                      <th className="text-left py-2 font-medium">Seviye</th>
                      <th className="text-right py-2 font-medium">Değerlendirme sayısı</th>
                      <th className="text-right py-2 font-medium">Ort. sapma</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fairnessLeaderboard.map((row, index) => (
                      <tr key={row.studentId} className="border-b hover:bg-gray-50">
                        <td className="py-2 font-medium">{index + 1}</td>
                        <td className="py-2">{row.studentName}</td>
                        <td className="py-2">{row.levelName}</td>
                        <td className="py-2 text-right">{row.reviewCount}</td>
                        <td className="py-2 text-right">
                          <Badge variant="outline">{row.averageDeviation.toFixed(2)}</Badge>
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

      {/* Sınıf rekabeti – En başarılı sınıflar */}
      {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Dinamik Sınıf Rekabeti (En Başarılı Sınıflar)</span>
            </CardTitle>
            <CardDescription>
              Ödev tamamlama ve yoklama oranına göre sınıf puanı. Kantin/portal ekranında yayınlanabilir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {classLeaderboardLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : classLeaderboard.length === 0 ? (
              <p className="text-sm text-gray-500">Henüz veri yok.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">#</th>
                      <th className="text-left py-2 font-medium">Sınıf</th>
                      <th className="text-left py-2 font-medium">Seviye</th>
                      <th className="text-right py-2 font-medium">Öğrenci</th>
                      <th className="text-right py-2 font-medium">Tamamlama %</th>
                      <th className="text-right py-2 font-medium">Yoklama %</th>
                      <th className="text-right py-2 font-medium">Puan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classLeaderboard.map((row, index) => (
                      <tr key={row.classId} className="border-b hover:bg-gray-50">
                        <td className="py-2 font-medium">{index + 1}</td>
                        <td className="py-2">{row.className}</td>
                        <td className="py-2">{row.levelName}</td>
                        <td className="py-2 text-right">{row.studentCount}</td>
                        <td className="py-2 text-right">{row.completionRate.toFixed(1)}</td>
                        <td className="py-2 text-right">{row.attendanceRate.toFixed(1)}</td>
                        <td className="py-2 text-right">
                          <Badge variant={index < 3 ? 'default' : 'secondary'}>{row.score}</Badge>
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
