import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { teacherApi, type TeacherStudentDetail } from '@/api/teacher.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Mail, Calendar, FileText, BookOpen } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';

export const StudentDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: student, isLoading, error } = useQuery({
    queryKey: ['teacher', 'student', id],
    queryFn: () => teacherApi.getStudentById(id ?? ''),
    enabled: !!id && !!localStorage.getItem('token'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="space-y-4">
        <Link to="/students">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Öğrencilere dön
          </Button>
        </Link>
        <p className="text-red-600">Öğrenci bulunamadı veya bir hata oluştu.</p>
      </div>
    );
  }

  const submissions = (student as TeacherStudentDetail).submissions ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/students">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            {student.name}
          </CardTitle>
          <CardDescription>Öğrenci bilgileri</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-gray-500" />
            <span>{student.email}</span>
          </div>
          {student.class ? (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">
                {student.class.level.name} - {student.class.name}
              </Badge>
              <Link to={`/students/${id}/portfolio`}>
                <Button variant="outline" size="sm" className="gap-1">
                  <BookOpen className="h-4 w-4" />
                  Öğrenim yolculuğu
                </Button>
              </Link>
            </div>
          ) : (
            <Badge variant="outline">Sınıf atanmadı</Badge>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Katılım: {formatDate(student.enrollmentDate)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Son teslimler
          </CardTitle>
          <CardDescription>
            {submissions.length > 0
              ? `Son ${submissions.length} teslim`
              : 'Henüz teslim yok'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-gray-500 text-sm">Bu öğrencinin henüz teslim ettiği ödev yok.</p>
          ) : (
            <ul className="space-y-2">
              {submissions.map((sub) => (
                <li key={sub.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <Link
                      to={`/assignments/${sub.assignment.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {sub.assignment.title}
                    </Link>
                    <p className="text-xs text-gray-500">
                      Teslim: {formatDate(sub.submittedAt)}
                    </p>
                  </div>
                  {sub.evaluation ? (
                    <Badge variant="secondary">
                      {sub.evaluation.score != null ? `${sub.evaluation.score}/100` : sub.evaluation.accepted ? 'Kabul' : 'Değerlendirildi'}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Bekliyor</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
