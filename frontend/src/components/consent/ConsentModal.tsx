import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useConsent } from '@/hooks/useConsent';
import { Loader2, ShieldCheck } from 'lucide-react';

const KVKK_AND_RULES_TEXT = `
Kurumumuz, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında kişisel verilerinizi işlemektedir.
Ödev portalında toplanan verileriniz (ad, e-posta, ödev içerikleri, yoklama kayıtları) yalnızca eğitim hizmetinin sunulması ve geliştirilmesi amacıyla kullanılır.

Kurum kuralları:
• Ödevlerin belirtilen süre içinde teslim edilmesi gerekmektedir.
• Derslere düzenli katılım ve yoklama kurallarına uyulması beklenir.
• Öğretmenlerin verdiği geri bildirimlere uygun hareket edilmesi gerekir.

Bu metni okuyup kabul ettiğinizi onaylayarak devam edebilirsiniz. Ödev teslim edebilmek için bu onay zorunludur.
`.trim();

interface ConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConsentModal({ open, onOpenChange }: ConsentModalProps) {
  const { accept, isAccepting } = useConsent();

  const handleAccept = async () => {
    await accept();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            KVKK ve Kurum Kuralları
          </DialogTitle>
          <DialogDescription>
            Ödev teslimi ve portal kullanımı için aşağıdaki metni okuyup kabul etmeniz gerekmektedir.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
          {KVKK_AND_RULES_TEXT}
        </div>
        <DialogFooter>
          <Button onClick={handleAccept} disabled={isAccepting} className="gap-2">
            {isAccepting && <Loader2 className="h-4 w-4 animate-spin" />}
            Kabul ediyorum, devam et
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
