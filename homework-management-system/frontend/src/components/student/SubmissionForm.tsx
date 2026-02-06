import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useSubmitAssignment } from '@/hooks/useAssignments';
import { useToast } from '@/components/ui/use-toast';
import { Upload, X, FileText } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const submissionSchema = z.object({
  contentText: z.string().optional(),
  attachments: z.array(z.string()).default([]),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

interface SubmissionFormProps {
  assignmentId: string;
}

export const SubmissionForm = ({ assignmentId }: SubmissionFormProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const submitMutation = useSubmitAssignment();
  const { toast } = useToast();

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: SubmissionFormData) => {
    try {
      const attachments = uploadedFiles.map(file => file.name);
      
      await submitMutation.mutateAsync({
        assignmentId,
        contentText: data.contentText,
        attachments,
      });

      toast({
        title: "Başarılı",
        description: "Ödeviniz başarıyla teslim edildi.",
      });

      form.reset();
      setUploadedFiles([]);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ödev teslim edilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="contentText">Ödev Metni</Label>
        <Textarea
          id="contentText"
          placeholder="Ödevinizi buraya yazın..."
          className="min-h-[120px]"
          {...form.register('contentText')}
        />
      </div>

      <div className="space-y-2">
        <Label>Dosya Ekle</Label>
        <Card className="border-dashed">
          <CardContent className="p-6">
            <div className="text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-sm text-blue-600 hover:text-blue-500">
                  Dosya seçin veya sürükleyin
                </span>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">
                PDF, DOC, DOCX, TXT, JPG, PNG, ZIP (max 10MB)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <Label>Yüklenen Dosyalar</Label>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full"
        disabled={submitMutation.isPending}
      >
        {submitMutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Ödevi Teslim Et
      </Button>
    </form>
  );
};
