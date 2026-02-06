import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Eye, Mail, Loader2 } from 'lucide-react';
import { useTeacherStudents } from '@/hooks/useAssignments';

export const StudentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');

  const { data: students = [], isLoading, error } = useTeacherStudents();

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());
      const levelName = student.class?.level?.name ?? '';
      const className = student.class?.name ?? '';
      const matchesLevel = selectedLevel === 'all' || levelName === selectedLevel;
      const matchesClass = selectedClass === 'all' || className === selectedClass;
      return matchesSearch && matchesLevel && matchesClass;
    });
  }, [students, searchTerm, selectedLevel, selectedClass]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Öğrenci listesi yüklenirken bir hata oluştu.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Öğrenciler</h1>
          <p className="text-gray-600">Tüm öğrencileri görüntüleyin ve yönetin</p>
        </div>
      </div>

      {/* Filtreler */}
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
            <div className="flex-1">
              <Label htmlFor="search">Arama</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  name="search"
                  placeholder="Öğrenci ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  autoComplete="off"
                />
              </div>
            </div>
            
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
                  <SelectItem value="A">A Sınıfı</SelectItem>
                  <SelectItem value="B">B Sınıfı</SelectItem>
                  <SelectItem value="C">C Sınıfı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Öğrenci Listesi */}
          <div className="space-y-4">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Öğrenci bulunamadı</p>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <Card key={student.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{student.name}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span>{student.email}</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            {student.class ? (
                              <Badge variant="secondary">
                                {student.class.level.name} - {student.class.name} Sınıfı
                              </Badge>
                            ) : (
                              <Badge variant="outline">Sınıf atanmadı</Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              Katılım: {new Date(student.enrollmentDate).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <Link to={`/students/${student.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Detay
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
