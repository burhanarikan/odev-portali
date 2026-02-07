import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardStudentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const role = (session.user as { role?: string }).role;
  if (role !== 'STUDENT') redirect('/dashboard/teacher');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Öğrenci Paneli</h1>
      <p className="text-gray-600">
        Ödevlerinizi görün, teslim edin ve değerlendirmelerinizi takip edin.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/attendance/join"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:bg-gray-50"
        >
          <h2 className="font-semibold text-gray-900">Derse Katıl</h2>
          <p className="text-sm text-gray-500">Konum doğrulamalı yoklama kodunu girin</p>
        </Link>
        <Link
          href="/dashboard/portfolio"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:bg-gray-50"
        >
          <h2 className="font-semibold text-gray-900">Öğrenim Yolculuğum</h2>
          <p className="text-sm text-gray-500">Portfolyo ve ilerleme</p>
        </Link>
        <Link
          href="/dashboard/evaluations"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:bg-gray-50"
        >
          <h2 className="font-semibold text-gray-900">Değerlendirmelerim</h2>
          <p className="text-sm text-gray-500">Hoca geri bildirimleri</p>
        </Link>
        <Link
          href="/dashboard/announcements"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:bg-gray-50"
        >
          <h2 className="font-semibold text-gray-900">Duyurular</h2>
          <p className="text-sm text-gray-500">Kurs duyuruları</p>
        </Link>
      </div>
    </div>
  );
}
