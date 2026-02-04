"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Store, Package, Users, LogOut } from 'lucide-react';

const menuItems = [
  { name: 'Tablero', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Punto de Venta', icon: Store, href: '/pos' },
  { name: 'Inventario', icon: Package, href: '/inventory' },
  { name: 'RRHH', icon: Users, href: '/hr' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 bg-[#1f2937] text-white flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl w-fit">
           <img src="https://cdn-icons-png.flaticon.com/512/809/809052.png" alt="Logo" className="w-8 h-8" />
        </div>
        <span className="block mt-3 font-bold text-lg tracking-wide">Smart Fox</span>
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