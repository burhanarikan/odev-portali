import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface PageErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function PageError({
  message = 'Bir hata oluştu. Sayfayı yenileyip tekrar deneyin.',
  onRetry,
}: PageErrorProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600 font-medium text-center">{message}</p>
        <p className="text-sm text-gray-500 mt-1 text-center">
          Sayfayı yenileyebilir veya ana sayfaya dönebilirsiniz.
        </p>
        {onRetry && (
          <Button variant="outline" className="mt-4" onClick={onRetry}>
            Tekrar dene
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
