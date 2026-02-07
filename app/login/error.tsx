'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function LoginError({
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
    <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
      <h2 className="text-lg font-semibold text-red-800">Giriş sayfası yüklenemedi</h2>
      <p className="text-sm text-red-600 mt-1">Lütfen tekrar deneyin.</p>
      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={reset}
          className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Tekrar dene
        </button>
        <Link href="/" className="rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
          Ana sayfa
        </Link>
      </div>
    </div>
  );
}
