import { useTeacherAssignments, useTeacherSubmissions } from '@/hooks/useAssignments';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, isOverdue } from '@/utils/formatDate';
import { Calendar, Clock, FileText, Users, Plus, User, Mic, Upload, Layers, Inbox, ClipboardCheck, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLoading } from '@/components/feedback/PageLoading';
import { PageError } from '@/components/feedback/PageError';

export const TeacherDashboard = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const { data: assignments, isLoading, error } = useTeacherAssignments();
  const { data: submissions = [] } = useTeacherSubmissions();
  const pendingGrading = submissions.filter((s) => !s.evaluation).slice(0, 5);

  if (isLoading) return <PageLoading message="Ödevler yükleniyor…" />;
  if (error) return <PageError message="Ödevler yüklenirken bir hata oluştu." onRetry={() => window.location.reload()} />;

  const totalAssignments = assignments?.length || 0;
  const draftAssignments = assignments?.filter(a => a.isDraft).length || 0;
  const publishedAssignments = totalAssignments - draftAssignments;
  const totalSubmissions = assignments?.reduce((sum, a) => sum + (a._count?.submissions || 0), 0) || 0;

  const getStatusBadge = (assignment: import('@/types').Assignment) => {
    if (assignment.isDraft) {
      return <Badge variant="outline">Taslak</Badge>;
    }
    
    if (isOverdue(assignment.dueDate)) {
      return <Badge variant="destructive">Süresi Geçmiş</Badge>;
    }
    
    return <Badge className="bg-green-100 text-green-800">Yayında</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'Yönetim – Tüm Ödevler' : 'Öğretmen Paneli'}
          </h1>
          <p className="text-gray-600">
            {isAdmin ? 'Hangi hoca ne ödev vermiş; ödev ve teslim takibi' : 'Ödevlerinizi yönetin ve değerlendirin'}
          </p>
        </div>
        {!isAdmin && (
          <Link to="/assignments/create">
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Yeni Ödev</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Zero-Click: Yapmanız gerekenler */}
      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-800 flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                Kontrol edilmeyi bekleyen ödevler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingGrading.length > 0 ? (
                <>
                  <p className="text-lg font-bold text-gray-900">{pendingGrading.length} teslim değerlendirme bekliyor</p>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {pendingGrading.map((s) => (
                      <li key={s.id}>
                        <Link to={`/assignments/${s.assignmentId}`} className="text-blue-600 hover:underline">
                          {s.assignment.title} · {s.student?.user?.name ?? '—'}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" size="sm" className="border-amber-300 text-amber-800">
                    <Link to="/submissions">Tümünü gör <ChevronRight className="h-4 w-4 ml-1" /></Link>
                  </Button>
                </>
              ) : (
                <p className="text-gray-600">Bekleyen teslim yok.</p>
              )}
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Yoklama
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700">Sınıf için yoklama başlatın veya canlı katılımı takip edin.</p>
              <Button asChild variant="outline" size="sm" className="border-blue-300 text-blue-800">
                <Link to="/attendance">Yoklama sayfası</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isAdmin ? 'Sistemdeki Ödev' : 'Toplam Ödev'}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? 'Tüm ödevler' : 'Tüm ödevleriniz'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yayında</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Aktif ödevler
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taslak</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Taslak ödevler
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Teslim</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? 'Toplam teslim' : 'Öğrenci teslimleri'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">{isAdmin ? 'Tüm Ödevler (hoca bilgisiyle)' : 'Son Ödevler'}</h2>
            {assignments?.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">{isAdmin ? 'Henüz ödev yok' : 'Henüz ödev oluşturmadınız'}</p>
              {!isAdmin && (
                <Link to="/assignments/create">
                  <Button>İlk Ödevi Oluştur</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments?.slice(0, isAdmin ? 50 : 6).map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{assignment.title}</CardTitle>
                    {getStatusBadge(assignment)}
                  </div>
                  <CardDescription className="space-y-0.5">
                    <span>{assignment.level?.name} – {assignment.weekNumber}. Hafta</span>
                    <span className="flex items-center gap-1.5 mt-1 text-gray-500 flex-wrap">
                      {(assignment as { homework?: { type?: string } }).homework?.type === 'AUDIO' && <span title="Ses"><Mic className="h-3.5 w-3.5" /></span>}
                      {(assignment as { homework?: { type?: string } }).homework?.type === 'FILE' && <span title="Dosya"><Upload className="h-3.5 w-3.5" /></span>}
                      {(assignment as { homework?: { type?: string } }).homework?.type === 'TEXT' && <span title="Metin"><FileText className="h-3.5 w-3.5" /></span>}
                      {(assignment as { homework?: { type?: string } }).homework?.type === 'MIXED' && <span title="Karışık"><Layers className="h-3.5 w-3.5" /></span>}
                      {isAdmin && assignment.teacher?.user && (
                        <>
                          <span className="text-gray-400">·</span>
                          <User className="h-3.5 w-3.5" />
                          <span>{assignment.teacher.user.name}</span>
                        </>
                      )}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Son teslim: {formatDate(assignment.dueDate)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      {assignment._count?.submissions || 0} teslim
                    </div>
                    {assignment.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {assignment.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/assignments/${assignment.id}`}>Ödevi Görüntüle</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
