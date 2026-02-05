"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Store, Package, Users, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: 'Inicio', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Venta', icon: Store, href: '/pos' },
    { name: 'Stock', icon: Package, href: '/inventory' },
    { name: 'Equipo', icon: Users, href: '/hr' },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error during logout:', error.message);
      return;
    }
    router.push('/login');
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
      <div className="flex justify-around items-center h-16">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-[#FF8C00]' : 'text-gray-400'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-bold">{item.name}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-400 hover:text-[#FF8C00]"
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-[10px] font-bold">Salir</span>
        </button>
      </div>
    </nav>
  );
}