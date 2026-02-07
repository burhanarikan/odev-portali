import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardTeacherPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const role = (session.user as { role?: string }).role;
  if (role !== 'TEACHER' && role !== 'ADMIN') redirect('/dashboard/student');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Öğretmen Paneli</h1>
      <p className="text-gray-600">
        Ödevlerinizi yönetin, yoklama alın ve teslimleri değerlendirin.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/assignments/create"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:bg-gray-50"
        >
          <h2 className="font-semibold text-gray-900">Ödev Oluştur</h2>
          <p className="text-sm text-gray-500">Yeni ödev taslağı veya atama oluşturun</p>
        </Link>
        <Link
          href="/dashboard/attendance"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:bg-gray-50"
        >
          <h2 className="font-semibold text-gray-900">Yoklama</h2>
          <p className="text-sm text-gray-500">Konum doğrulamalı QR/kod yoklama başlatın</p>
        </Link>
        <Link
          href="/dashboard/submissions"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:bg-gray-50"
        >
          <h2 className="font-semibold text-gray-900">Teslimler</h2>
          <p className="text-sm text-gray-500">Öğrenci teslimlerini inceleyin</p>
        </Link>
        <Link
          href="/dashboard/students"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:bg-gray-50"
        >
          <h2 className="font-semibold text-gray-900">Öğrenciler</h2>
          <p className="text-sm text-gray-500">Öğrenci listesi ve detayları</p>
        </Link>
      </div>
    </div>
  );
}
