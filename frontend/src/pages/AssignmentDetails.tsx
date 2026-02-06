import { useParams, Link } from 'react-router-dom';
import { useStudentAssignment, useTeacherAssignment } from '@/hooks/useAssignments';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatRelativeTime } from '@/utils/formatDate';
import { Calendar, Clock, User, FileText, Download, AlertCircle, ArrowLeft } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { SubmissionForm } from '@/components/student/SubmissionForm';

export const AssignmentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const isStudent = user?.role === 'STUDENT';

  const studentResult = useStudentAssignment(id ?? '');
  const teacherResult = useTeacherAssignment(id ?? '');

  const assignment = isStudent ? studentResult.data : teacherResult.data;
  const isLoading = isStudent ? studentResult.isLoading : teacherResult.isLoading;
  const error = isStudent ? studentResult.error : teacherResult.error;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="text-center text-red-600">
        Ödev yüklenirken bir hata oluştu.
      </div>
    );
  }

  const hasSubmitted = assignment.submissions && assignment.submissions.length > 0;
  const submission = assignment.submissions?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
          <p className="text-gray-600">
            {assignment.level?.name} - {assignment.weekNumber}. Hafta
          </p>
        </div>
        {assignment.isDraft && (
          <Badge variant="outline">Taslak</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ödev Açıklaması</CardTitle>
            </CardHeader>
            <CardContent>
              {assignment.description ? (
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700">
                    {assignment.description}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 italic">Açıklama bulunmuyor</p>
              )}
            </CardContent>
          </Card>

          {assignment.attachments && assignment.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ekli Dosyalar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {assignment.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{attachment}</span>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {isStudent && (
            <Card>
              <CardHeader>
                <CardTitle>Ödev Teslimi</CardTitle>
                <CardDescription>
                  {hasSubmitted 
                    ? `Ödevi ${formatRelativeTime(submission!.submittedAt)} teslim ettiniz`
                    : 'Ödevinizi teslim etmek için aşağıdaki formu kullanın'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasSubmitted ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-green-800">
                        <FileText className="h-5 w-5" />
                        <span className="font-medium">Teslim Edildi</span>
                      </div>
                      <p className="text-green-700 text-sm mt-1">
                        Teslim tarihi: {formatDate(submission!.submittedAt)}
                      </p>
                      {submission!.isLate && (
                        <div className="flex items-center space-x-2 text-yellow-700 text-sm mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <span>Gecikmiş teslim</span>
                        </div>
                      )}
                    </div>
                    
                    {submission!.contentText && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Teslim Edilen Metin:</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {submission!.contentText}
                          </p>
                        </div>
                      </div>
                    )}

                    {submission!.evaluation && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-2">Değerlendirme</h4>
                        {submission!.evaluation.score && (
                          <p className="text-blue-700">
                            Puan: {submission!.evaluation.score}/100
                          </p>
                        )}
                        {submission!.evaluation.feedback && (
                          <p className="text-blue-700 mt-2">
                            Geri bildirim: {submission!.evaluation.feedback}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <SubmissionForm assignmentId={assignment.id} />
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ödev Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Öğretmen:</span>
                <span className="text-sm font-medium">
                  {assignment.teacher?.user?.name}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Başlangıç:</span>
                <span className="text-sm font-medium">
                  {formatDate(assignment.startDate)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Son teslim:</span>
                <span className="text-sm font-medium">
                  {formatDate(assignment.dueDate)}
                </span>
              </div>
            </CardContent>
          </Card>

          {!isStudent && assignment.submissions && assignment.submissions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Teslimler</CardTitle>
                <CardDescription>
                  {assignment.submissions.length} öğrenci teslim etti
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {assignment.submissions.map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{submission.student?.user?.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {submission.isLate && (
                          <Badge variant="destructive" className="text-xs">Gecikmiş</Badge>
                        )}
                        {submission.evaluation && (
                          <Badge variant="secondary" className="text-xs">Değerlendirildi</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
