import { useStudentAssignments } from '@/hooks/useAssignments';
import { useConsent } from '@/hooks/useConsent';
import { useConsentStore } from '@/store/consentStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, isOverdue, isStarted, timeUntil } from '@/utils/formatDate';
import { Calendar, Clock, FileText, CheckCircle, ClipboardList, LogIn, ChevronRight, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLoading } from '@/components/feedback/PageLoading';
import { PageError } from '@/components/feedback/PageError';

/** Dairesel ilerleme (0-100) */
function CircularProgress({ value, size = 48, strokeWidth = 4 }: { value: number; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;
  return (
    <svg width={size} height={size} className="flex-shrink-0" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-[stroke-dashoffset] duration-500"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export const StudentDashboard = () => {
  const { data: assignments, isLoading, error } = useStudentAssignments();
  const { accepted: consentAccepted } = useConsent();
  const setConsentModalOpen = useConsentStore((s) => s.setConsentModalOpen);

  if (isLoading) return <PageLoading message="Ödevler yükleniyor…" />;
  if (error) {
    const message = (error as Error)?.message || 'Ödevler yüklenirken bir hata oluştu.';
    return <PageError message={message} onRetry={() => window.location.reload()} />;
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

  const nextAssignment = assignments?.active
    ?.filter((a) => !a.submissions?.length)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Öğrenci Paneli</h1>
        <p className="text-gray-600">Ödevlerinizi görüntüleyin ve teslim edin</p>
      </div>

      {!consentAccepted && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Ödev teslim edebilmek için KVKK ve kurum kurallarını kabul etmeniz gerekiyor.
              </p>
            </div>
            <Button onClick={() => setConsentModalOpen(true)} variant="outline" size="sm" className="border-amber-400 text-amber-800">
              Kabul et
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Zero-Click: Şimdi ne yapmalıyım? */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nextAssignment ? (
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Sıradaki ödev
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xl font-bold text-gray-900">{nextAssignment.title}</p>
              <p className="text-sm text-gray-600">
                Son teslim: {formatDate(nextAssignment.dueDate)} · {timeUntil(nextAssignment.dueDate)} kaldı
              </p>
              <Button asChild className="w-full md:w-auto">
                <Link to={`/assignments/${nextAssignment.id}`}>
                  Ödeve git <ChevronRight className="h-4 w-4 ml-1 inline" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-green-200 bg-green-50/50">
            <CardContent className="py-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <p className="font-medium text-green-800">Tüm aktif ödevler tamamlandı</p>
              <p className="text-sm text-green-700 mt-1">Yeni ödev atandığında burada görünecek.</p>
            </CardContent>
          </Card>
        )}
        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-800 flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Bugünkü ders / Yoklama
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-700">Hoca tahtada paylaştığı yoklama kodunu girin ve derse katılın.</p>
            <Button asChild variant="outline" className="w-full md:w-auto border-amber-300 text-amber-800 hover:bg-amber-100">
              <Link to="/attendance/join">Derse katıl</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Ödev durumum özeti + dairesel ilerleme */}
      <Card className="border-blue-100 bg-blue-50/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Ödev durumum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-6">
            {totalDue > 0 && (
              <div className="flex items-center gap-3">
                <CircularProgress value={(totalSubmitted / totalDue) * 100} size={56} strokeWidth={5} />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalSubmitted} / {totalDue}</p>
                  <p className="text-xs text-gray-600">tamamlanan ödev</p>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-4 items-baseline">
              <span className="text-xl font-bold text-gray-900">{totalSubmitted} tamamlandı</span>
              <span className="text-gray-600">/ toplam {totalDue} verilen ödev</span>
              {totalDue > 0 && (
                <Badge variant={totalSubmitted >= totalDue ? 'default' : totalSubmitted / totalDue >= 0.5 ? 'secondary' : 'destructive'}>
                  %{Math.round((totalSubmitted / totalDue) * 100)} tamamlama
                </Badge>
              )}
              {pendingCount > 0 && (
                <span className="text-amber-700 text-sm font-medium">
                  · {pendingCount} yapılmadı
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Tamamlandı / yapılmadı durumu · Kur sonu özeti
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
