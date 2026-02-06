import { useStudentAssignments } from '@/hooks/useAssignments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, isOverdue, isStarted } from '@/utils/formatDate';
import { Calendar, Clock, FileText, CheckCircle, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const StudentDashboard = () => {
  const { data: assignments, isLoading, error } = useStudentAssignments();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
        <p className="text-sm text-gray-500">Ödevler yükleniyor…</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-red-600 font-medium">Ödevler yüklenirken bir hata oluştu.</p>
          <p className="text-sm text-gray-500 mt-1">Sayfayı yenileyip tekrar deneyin.</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (assignment: import('@/types').Assignment) => {
    const hasSubmission = assignment.submissions && assignment.submissions.length > 0;
    
    if (hasSubmission) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Teslim Edildi</Badge>;
    }
    
    if (!isStarted(assignment.startDate)) {
      return <Badge variant="outline">Başlamadı</Badge>;
    }
    
    if (isOverdue(assignment.dueDate)) {
      return <Badge variant="destructive">Gecikmiş</Badge>;
    }
    
    return <Badge className="bg-blue-100 text-blue-800">Aktif</Badge>;
  };

  const activeCount = assignments?.active?.length || 0;
  const pastCount = assignments?.past?.length || 0;
  const submittedCount = assignments?.active?.filter((a) => a.submissions && a.submissions.length > 0).length || 0;
  const pastSubmittedCount = assignments?.past?.filter((a) => a.submissions && a.submissions.length > 0).length || 0;
  const totalDue = activeCount + pastCount;
  const totalSubmitted = submittedCount + pastSubmittedCount;
  const pendingCount = activeCount - submittedCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Öğrenci Paneli</h1>
        <p className="text-gray-600">Ödevlerinizi görüntüleyin ve teslim edin</p>
      </div>

      {/* Ödev durumum özeti */}
      <Card className="border-blue-100 bg-blue-50/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Ödev durumum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-baseline">
            <span className="text-2xl font-bold text-gray-900">{totalSubmitted} teslim</span>
            <span className="text-gray-600">/ toplam {totalDue} ödev</span>
            {pendingCount > 0 && (
              <span className="text-amber-700 text-sm font-medium">
                · {pendingCount} ödev bekliyor
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Kur sonunda özet: Kaç ödev verildi, kaçını teslim ettiniz
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Ödevler</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">
              Teslim edilmesi gereken ödevler
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gelecek Ödevler</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments?.upcoming?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Yaklaşan ödevler
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pastCount}</div>
            <p className="text-xs text-muted-foreground">
              Teslim edilen ödevler
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aktif Ödevler</h2>
          {assignments?.active?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aktif ödev bulunmuyor</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments?.active?.map((assignment) => (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      {getStatusBadge(assignment)}
                    </div>
                    <CardDescription>
                      {assignment.level?.name} - {assignment.weekNumber}. Hafta
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        Son teslim: {formatDate(assignment.dueDate)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        Başlangıç: {formatDate(assignment.startDate)}
                      </div>
                      {assignment.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {assignment.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-4">
                      <Button className="w-full" asChild>
                        <Link to={`/assignments/${assignment.id}`}>Ödevi Görüntüle</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {(assignments?.upcoming?.length ?? 0) > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Gelecek Ödevler</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments?.upcoming?.map((assignment) => (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow opacity-90">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      {getStatusBadge(assignment)}
                    </div>
                    <CardDescription>
                      {assignment.level?.name} - {assignment.weekNumber}. Hafta
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Son teslim: {formatDate(assignment.dueDate)}
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" className="w-full" asChild>
                        <Link to={`/assignments/${assignment.id}`}>Önizle</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {(assignments?.past?.length ?? 0) > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Geçmiş / Tamamlanan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments?.past?.map((assignment) => (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      {getStatusBadge(assignment)}
                    </div>
                    <CardDescription>
                      {assignment.level?.name} - {assignment.weekNumber}. Hafta
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Bitiş: {formatDate(assignment.dueDate)}
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" className="w-full" asChild>
                        <Link to={`/assignments/${assignment.id}`}>Detay</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
