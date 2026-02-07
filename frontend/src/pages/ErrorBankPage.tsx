import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { errorBankApi } from '@/api/errorBank.api';
import { formatDate } from '@/utils/formatDate';
import { Loader2, AlertTriangle, BookOpen } from 'lucide-react';

export const ErrorBankPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['error-bank', 'my'],
    queryFn: errorBankApi.getMyErrors,
  });
  const { data: reviewList } = useQuery({
    queryKey: ['error-bank', 'review-list'],
    queryFn: errorBankApi.getReviewList,
  });

  if (isLoading || (!data && !error)) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    const message = (error as Error)?.message || 'Hata bankası yüklenemedi.';
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hata Bankası</h1>
          <p className="text-gray-600">Dikkat etmeniz gereken hatalar</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600">{message}</p>
            <p className="text-sm text-gray-500 mt-1">Sayfayı yenileyip tekrar deneyin.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { entries, uniqueErrors } = data!;
  const reviewItems = reviewList?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hata Bankası</h1>
        <p className="text-gray-600">Dikkat etmeniz gereken hatalar ve kur sonu tekrar listesi</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Dikkat Etmem Gerekenler
          </CardTitle>
          <CardDescription>Hocaların sizin için işaretlediği hatalar (tekrarlananlar gruplu)</CardDescription>
        </CardHeader>
        <CardContent>
          {uniqueErrors.length === 0 ? (
            <p className="text-gray-500">Henüz kayıtlı hata yok. Ödevlerinizde düzeltilen noktalar burada listelenir.</p>
          ) : (
            <ul className="space-y-2">
              {uniqueErrors.map((u, i) => (
                <li key={i} className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <span className="font-medium text-amber-900">{u.text}</span>
                  {u.count > 1 && (
                    <span className="text-xs text-amber-700">({u.count} kez)</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Kur Sonu Tekrar Listesi
          </CardTitle>
          <CardDescription>Bu hataları tekrar çalışmanız önerilir</CardDescription>
        </CardHeader>
        <CardContent>
          {reviewItems.length === 0 ? (
            <p className="text-gray-500">Tekrar listesi, hata bankanız doldukça burada oluşur.</p>
          ) : (
            <ol className="list-decimal list-inside space-y-2">
              {reviewItems.map((item, i) => (
                <li key={i} className="text-gray-700">{item.text}</li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Son eklenen hatalar</CardTitle>
            <CardDescription>Tarih ve hoca bilgisiyle</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {entries.slice(0, 20).map((e) => (
                <li key={e.id} className="flex justify-between gap-4">
                  <span>{e.errorText}</span>
                  <span className="text-gray-500 shrink-0">{formatDate(e.createdAt)} · {e.teacherName ?? '—'}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
