import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import TopBar from '@/components/layout/TopBar';
import AuthGuard from '../../components/AuthGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen w-full bg-white">
        {/* Sidebar solo visible en Desktop */}
        <Sidebar />

        {/* Área principal de contenido */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Top Bar - Hidden on mobile */}
          <div className="hidden md:block">
            <TopBar />
          </div>
          
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            {children}
          </main>
        </div>

        {/* Menú inferior solo visible en Móvil */}
        <MobileNav />
      </div>
    </AuthGuard>
  );
}