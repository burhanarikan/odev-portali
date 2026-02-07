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
      <a
        href="#main-content"
        className="absolute left-4 top-4 -translate-y-16 focus:translate-y-0 z-50 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium opacity-0 focus:opacity-100 transition-all duration-200 outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        İçeriğe atla
      </a>
      <Header />
      <Sidebar />
      <main id="main-content" className="flex-1 min-w-0 p-6 lg:p-8" tabIndex={-1}>
        <div className="max-w-7xl mx-auto">
          {children ?? <Outlet />}
        </div>
      </main>
      {isStudent && (
        <ConsentModal open={consentModalOpen} onOpenChange={setConsentModalOpen} />
      )}
    </div>
  );
};

/** Aynı bileşen; AppShell olarak da kullanılabilir */
export const AppShell = Layout;
