"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Store, Package, Users, LogOut, Box } from 'lucide-react';

const menuItems = [
  { name: 'Tablero', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Punto de Venta', icon: Store, href: '/pos' },
  { name: 'Inventario', icon: Package, href: '/inventory' },
  { name: 'RRHH', icon: Users, href: '/hr' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 bg-[#1a202c] text-white flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-gray-700/50 flex items-center gap-3">
        <div className="bg-[#FF8C00] p-2 rounded-xl shadow-lg shadow-orange-900/20">
          <Box className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-white font-black text-xl tracking-tighter leading-none">SMART FOX</h1>
          <p className="text-gray-400 text-[10px] tracking-[0.2em] font-bold uppercase">Solutions</p>
        </div>
      </div>

      <nav className="flex-1 mt-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                isActive 
                  ? 'bg-gray-800 text-[#FF8C00] border-l-4 border-[#FF8C00]' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-[#FF8C00]' : ''}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button className="flex items-center text-gray-400 hover:text-white transition-colors w-full">
          <LogOut className="w-5 h-5 mr-3" />
          <span className="text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}