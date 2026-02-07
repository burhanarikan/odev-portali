'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function RootError({
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h2 className="text-lg font-semibold text-gray-900">Bir hata oluştu</h2>
      <p className="text-sm text-gray-500 mt-1">Lütfen sayfayı yenileyin veya giriş sayfasına gidin.</p>
      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={reset}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Tekrar dene
        </button>
        <Link
          href="/login"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Giriş sayfası
        </Link>
      </div>
    </div>
  );
}
