import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = 'Yükleniyor…' }: PageLoadingProps) {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56 rounded-md" />
      <Skeleton className="h-4 w-72 rounded-md" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
