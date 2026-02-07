import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';
import { useTeacherStudents } from '@/hooks/useAssignments';
import { StudentsTable } from '@/components/students/StudentsTable';
import { PageLoading } from '@/components/feedback/PageLoading';
import { PageError } from '@/components/feedback/PageError';

export const StudentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');

  const { data: students = [], isLoading, error } = useTeacherStudents();

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const levelName = student.class?.level?.name ?? '';
      const className = student.class?.name ?? '';
      const matchesLevel = selectedLevel === 'all' || levelName === selectedLevel;
      const matchesClass = selectedClass === 'all' || className === selectedClass;
      return matchesLevel && matchesClass;
    });
  }, [students, selectedLevel, selectedClass]);

  if (isLoading) return <PageLoading message="Öğrenci listesi yükleniyor…" />;
  if (error) return <PageError message="Öğrenci listesi yüklenirken bir hata oluştu." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Öğrenciler</h1>
          <p className="text-gray-600">Tüm öğrencileri görüntüleyin ve yönetin</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Öğrenci Listesi</span>
          </CardTitle>
          <CardDescription>
            Toplam {filteredStudents.length} öğrenci
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="w-full sm:w-48">
              <Label htmlFor="level">Seviye</Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger id="level">
                  <SelectValue placeholder="Seviye seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Seviyeler</SelectItem>
                  <SelectItem value="A1">A1</SelectItem>
                  <SelectItem value="A2">A2</SelectItem>
                  <SelectItem value="B1">B1</SelectItem>
                  <SelectItem value="B2">B2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-32">
              <Label htmlFor="filter-class">Sınıf</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="filter-class">
                  <SelectValue placeholder="Sınıf seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Sınıflar</SelectItem>
                  <SelectItem value="101">101</SelectItem>
                  <SelectItem value="102">102</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <StudentsTable
            data={filteredStudents}
            globalFilter={searchTerm}
            onGlobalFilterChange={setSearchTerm}
          />
        </CardContent>
      </Card>
    </div>
  );
};
