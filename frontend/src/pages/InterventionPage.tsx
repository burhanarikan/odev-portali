import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { interventionApi, type AtRiskStudent } from '@/api/intervention.api';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/utils/formatDate';
import { Loader2, AlertTriangle, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export const InterventionPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [logStudentId, setLogStudentId] = useState('');
  const [logReason, setLogReason] = useState('');
  const [logNote, setLogNote] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AtRiskStudent | null>(null);

  const { data: atRisk = [], isLoading } = useQuery({
    queryKey: ['intervention', 'at-risk'],
    queryFn: interventionApi.getAtRiskStudents,
  });

  const addLogMutation = useMutation({
    mutationFn: interventionApi.addLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intervention'] });
      setDialogOpen(false);
      setLogStudentId('');
      setLogReason('');
      setLogNote('');
      setSelectedStudent(null);
      toast({ title: 'Müdahale kaydı eklendi.' });
    },
    onError: (e: { response?: { data?: { error?: string } } }) => {
      toast({ title: 'Hata', description: e.response?.data?.error ?? 'Eklenemedi', variant: 'destructive' });
    },
  });

  const openLogDialog = (student: AtRiskStudent) => {
    setSelectedStudent(student);
    setLogStudentId(student.studentId);
    setLogReason(student.reasons.join('; '));
    setLogNote('');
    setDialogOpen(true);
  };

  const handleAddLog = () => {
    if (!logStudentId || !logReason.trim()) {
      toast({ title: 'Öğrenci ve gerekçe gerekli', variant: 'destructive' });
      return;
    }
    addLogMutation.mutate({
      studentId: logStudentId,
      reason: logReason.trim(),
      note: logNote.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hoca Müdahale Takvimi</h1>
        <p className="text-gray-600">Kırmızı alarm: 2 gün devamsızlık veya 2 kaçan ödev. Görüşme notu ekleyin.</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {!isLoading && atRisk.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Şu an risk altında listelenecek öğrenci yok.
          </CardContent>
        </Card>
      )}

      {!isLoading && atRisk.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Kırmızı Alarm Listesi ({atRisk.length})
            </CardTitle>
            <CardDescription>Görüşüldü notu düşmeyen öğrenciler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Öğrenci</th>
                    <th className="text-left py-2 font-medium">Sınıf / Seviye</th>
                    <th className="text-left py-2 font-medium">Gerekçe</th>
                    <th className="text-left py-2 font-medium">Son müdahale</th>
                    <th className="text-left py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {atRisk.map((s) => (
                    <tr key={s.studentId} className="border-b hover:bg-gray-50">
                      <td className="py-2">
                        <p className="font-medium">{s.studentName}</p>
                        <p className="text-xs text-gray-500">{s.email}</p>
                      </td>
                      <td className="py-2">{s.className} · {s.levelName}</td>
                      <td className="py-2">
                        <ul className="list-disc list-inside">
                          {s.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-2 text-gray-600">
                        {s.lastIntervention ? formatDate(s.lastIntervention) : '—'}
                      </td>
                      <td className="py-2">
                        <Button size="sm" variant="outline" onClick={() => openLogDialog(s)}>
                          <Phone className="h-4 w-4 mr-1" />
                          Görüşüldü notu
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Müdahale kaydı</DialogTitle>
            <DialogDescription>
              {selectedStudent && `${selectedStudent.studentName} için görüşme notu`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Gerekçe</Label>
              <Textarea value={logReason} onChange={(e) => setLogReason(e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Not (örn: Görüşüldü, hastalık nedeniyle gelemiyor)</Label>
              <Textarea value={logNote} onChange={(e) => setLogNote(e.target.value)} rows={3} placeholder="Görüşme özeti..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={handleAddLog} disabled={addLogMutation.isPending}>
              {addLogMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
