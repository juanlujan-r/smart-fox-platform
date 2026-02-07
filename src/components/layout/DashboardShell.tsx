"use client";

import dynamic from 'next/dynamic';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import TopBar from '@/components/layout/TopBar';
import AuthGuard from '@/components/AuthGuard';
import { EmployeeModalProvider } from '@/context/EmployeeModalContext';

const EmployeeModalRenderer = dynamic(
  () => import('@/components/hr/EmployeeModalRenderer'),
  {
    ssr: false,
    loading: () => null,
  }
);

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  return (
    <EmployeeModalProvider>
      <AuthGuard>
        <div className="flex h-screen w-full bg-gray-50">
          <Sidebar />

          <div className="flex-1 flex flex-col h-screen overflow-hidden">
            <div className="hidden md:block">
              <TopBar />
            </div>

            <main className="flex-1 overflow-y-auto bg-gray-50">
              {children}
            </main>
          </div>

          <MobileNav />
        </div>

        <EmployeeModalRenderer />
      </AuthGuard>
    </EmployeeModalProvider>
  );
}
