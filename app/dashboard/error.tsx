'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <h2 className="text-lg font-semibold text-gray-900">Bir şeyler yanlış gitti</h2>
      <p className="text-sm text-gray-500 mt-1">Sayfayı yenilemeyi veya ana sayfaya dönmeyi deneyin.</p>
      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={reset}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Tekrar dene
        </button>
        <Link
          href="/dashboard"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}
