import { useTeacherAssignments } from '@/hooks/useAssignments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, isOverdue } from '@/utils/formatDate';
import { Calendar, Clock, FileText, Users, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const TeacherDashboard = () => {
  const { data: assignments, isLoading, error } = useTeacherAssignments();

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

  const totalAssignments = assignments?.length || 0;
  const draftAssignments = assignments?.filter(a => a.isDraft).length || 0;
  const publishedAssignments = totalAssignments - draftAssignments;
  const totalSubmissions = assignments?.reduce((sum, a) => sum + (a._count?.submissions || 0), 0) || 0;

  const getStatusBadge = (assignment: any) => {
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
          <h1 className="text-2xl font-bold text-gray-900">Öğretmen Paneli</h1>
          <p className="text-gray-600">Ödevlerinizi yönetin ve değerlendirin</p>
        </div>
        <Link to="/assignments/create">
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Yeni Ödev</span>
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Ödev</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Tüm ödevleriniz
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
              Öğrenci teslimleri
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Son Ödevler</h2>
        {assignments?.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Henüz ödev oluşturmadınız</p>
              <Link to="/assignments/create">
                <Button>İlk Ödevi Oluştur</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments?.slice(0, 6).map((assignment) => (
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
                    <Link to={`/assignments/${assignment.id}`}>
                      <Button variant="outline" className="w-full">Ödevi Görüntüle</Button>
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
