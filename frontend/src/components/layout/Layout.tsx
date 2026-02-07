import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ConsentModal } from '@/components/consent/ConsentModal';
import { useConsentStore } from '@/store/consentStore';
import { useAuthStore } from '@/store/authStore';

type LayoutProps = {
  children?: React.ReactNode;
};

/**
 * Tek AppShell: Sidebar + Header ile tüm dashboard sayfaları bu layout içinde.
 * Dil Eğitim Merkezi portalı — ölçeklenebilir yapı.
 */
export const Layout = ({ children }: LayoutProps) => {
  const { consentModalOpen, setConsentModalOpen } = useConsentStore();
  const { user } = useAuthStore();
  const isStudent = user?.role === 'STUDENT';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children ?? <Outlet />}
        </main>
      </div>
      {isStudent && (
        <ConsentModal open={consentModalOpen} onOpenChange={setConsentModalOpen} />
      )}
    </div>
  );
};

/** Aynı bileşen; AppShell olarak da kullanılabilir */
export const AppShell = Layout;
