import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useSubmitAssignment } from '@/hooks/useAssignments';
import { useConsent } from '@/hooks/useConsent';
import { useConsentStore } from '@/store/consentStore';
import { useToast } from '@/components/ui/use-toast';
import { uploadApi } from '@/api/upload.api';
import { Upload, X, FileText, Mic, Square, Loader2, ShieldAlert, RotateCcw, Play } from 'lucide-react';
import { AudioPlayer } from '@/components/ui/audio-player';
import { AudioLevelVisualizer } from '@/components/student/AudioLevelVisualizer';

const submissionSchema = z.object({
  contentText: z.string().optional(),
  attachments: z.array(z.string()).default([]),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

/** Kayıt sonrası: dinle, yeniden kaydet veya bu kaydı kullan. Object URL revoke ile sızıntı önlenir. */
function RecordedPreview({
  blob,
  onRetake,
  onUse,
  uploading,
}: {
  blob: Blob;
  onRetake: () => void;
  onUse: () => void;
  uploading: boolean;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Play className="h-4 w-4" />
        Önce dinle, beğenmezsen yeniden kaydet
      </p>
      {objectUrl && (
        <audio
          controls
          src={objectUrl}
          className="w-full max-w-full h-10"
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onRetake} className="gap-1">
          <RotateCcw className="h-4 w-4" />
          Yeniden kaydet
        </Button>
        <Button type="button" variant="secondary" size="sm" disabled={uploading} onClick={onUse}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Bu kaydı kullan'}
        </Button>
      </div>
    </div>
  );
}

interface SubmissionFormProps {
  assignmentId: string;
}

export const SubmissionForm = ({ assignmentId }: SubmissionFormProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const submitMutation = useSubmitAssignment();
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { accepted: consentAccepted } = useConsent();
  const setConsentModalOpen = useConsentStore((s) => s.setConsentModalOpen);

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const { url } = await uploadApi.uploadFile(file);
        urls.push(url);
      }
      setUploadedFiles((prev) => [...prev, ...files]);
      setFileUrls((prev) => [...prev, ...urls]);
    } catch (e) {
      toast({
        title: 'Yükleme hatası',
        description: (e as Error).message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setFileUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      toast({
        title: 'Mikrofon erişimi',
        description: 'Ses kaydı için mikrofon izni gerekli.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setRecording(false);
    }
  };

  const uploadRecordedAudio = async (): Promise<string | null> => {
    if (!recordedBlob) return null;
    setUploading(true);
    try {
      const file = new File([recordedBlob], 'ses-kaydi.webm', { type: 'audio/webm' });
      const { url } = await uploadApi.uploadFile(file);
      setAudioUrl(url);
      setRecordedBlob(null);
      return url;
    } catch (e) {
      toast({
        title: 'Ses yükleme hatası',
        description: (e as Error).message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: SubmissionFormData) => {
    try {
      let finalAudioUrl: string | null | undefined = audioUrl;
      if (recordedBlob && !finalAudioUrl) {
        finalAudioUrl = await uploadRecordedAudio();
      }
      const firstFileUrl = fileUrls[0] || undefined;
      await submitMutation.mutateAsync({
        assignmentId,
        contentText: data.contentText,
        attachments: fileUrls.length ? fileUrls : (data.attachments || []),
        audioUrl: finalAudioUrl ?? undefined,
        fileUrl: firstFileUrl ?? undefined,
      });

      toast({
        title: 'Başarılı',
        description: 'Ödeviniz başarıyla teslim edildi.',
      });

      form.reset();
      setUploadedFiles([]);
      setFileUrls([]);
      setAudioUrl(null);
      setRecordedBlob(null);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { error?: string } }; message?: string };
      const message = err.response?.data?.error || err.message || 'Ödev teslim edilirken bir hata oluştu.';
      toast({
        title: 'Hata',
        description: message,
        variant: 'destructive',
      });
      if (err.response?.status === 403) setConsentModalOpen(true);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {!consentAccepted && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Ödev teslim edebilmek için KVKK ve kurum kurallarını kabul etmeniz gerekiyor.</p>
            <Button type="button" variant="outline" size="sm" className="mt-2 border-amber-400 text-amber-800" onClick={() => setConsentModalOpen(true)}>
              KVKK ve kuralları kabul et
            </Button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="contentText">Ödev Metni</Label>
        <Textarea
          id="contentText"
          placeholder="Ödevinizi buraya yazın..."
          className="min-h-[120px]"
          autoComplete="off"
          {...form.register('contentText')}
        />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium leading-none">Dosya Ekle (PDF / Resim)</span>
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
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
                  disabled={uploading}
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">
                PDF, DOC, resim (yükleme Blob depolamaya gider)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium leading-none">Yüklenen Dosyalar</span>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{file.name}</span>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <span className="text-sm font-medium leading-none">Ses Kaydı (tarayıcı)</span>
        <Card className="border-dashed">
          <CardContent className="p-4 space-y-3">
            {!recording && !recordedBlob && !audioUrl && (
              <Button type="button" variant="outline" onClick={startRecording} className="gap-2">
                <Mic className="h-4 w-4" />
                Kayda Başla
              </Button>
            )}
            {recording && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-red-500 animate-pulse" aria-hidden />
                  Kaydediliyor… Sesinizin gittiğini aşağıdaki çubuklardan takip edebilirsiniz.
                </p>
                <div className="flex justify-center bg-gray-100 rounded-lg py-2">
                  {streamRef.current && (
                    <AudioLevelVisualizer stream={streamRef.current} className="rounded" />
                  )}
                </div>
                <Button type="button" variant="destructive" onClick={stopRecording} className="gap-2 w-full sm:w-auto">
                  <Square className="h-4 w-4" />
                  Kaydı Durdur
                </Button>
              </div>
            )}
            {recordedBlob && !audioUrl && (
              <RecordedPreview
                blob={recordedBlob}
                onRetake={() => setRecordedBlob(null)}
                onUse={uploadRecordedAudio}
                uploading={uploading}
              />
            )}
            {audioUrl && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-green-600 font-medium">Ses eklendi.</span>
                <AudioPlayer src={audioUrl} showSpeed={true} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAudioUrl(null);
                    setRecordedBlob(null);
                  }}
                  className="text-gray-600"
                >
                  Kaldır
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!consentAccepted || submitMutation.isPending || uploading}
      >
        {submitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Ödevi Teslim Et
      </Button>
    </form>
  );
};
