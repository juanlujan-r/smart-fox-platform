import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-[#f3f4f6]">
      {/* Sidebar solo visible en Desktop */}
      <Sidebar />
      
      {/* Área principal de contenido */}
      <main className="flex-1 overflow-y-auto h-full w-full pb-20 md:pb-0 relative">
        {children}
      </main>
      
      {/* Menú inferior solo visible en Móvil */}
      <MobileNav />
    </div>
  );
}