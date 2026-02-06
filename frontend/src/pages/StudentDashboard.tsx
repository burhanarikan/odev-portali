import { useStudentAssignments } from '@/hooks/useAssignments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, isOverdue, isStarted } from '@/utils/formatDate';
import { Calendar, Clock, FileText, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const StudentDashboard = () => {
  const { data: assignments, isLoading, error } = useStudentAssignments();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Ödevler yüklenirken bir hata oluştu.
      </div>
    );
  }

  const getStatusBadge = (assignment: any) => {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Öğrenci Paneli</h1>
        <p className="text-gray-600">Ödevlerinizi görüntüleyin ve teslim edin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Ödevler</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments?.active?.length || 0}</div>
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
            <div className="text-2xl font-bold">{assignments?.past?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Teslim edilen ödevler
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Aktif Ödevler</h2>
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
                    <Link to={`/assignments/${assignment.id}`}>
                      <Button className="w-full">Ödevi Görüntüle</Button>
                    </Link>
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
