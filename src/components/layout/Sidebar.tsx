"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Box, Calendar, FileText, UserCircle, Users, BarChart3, ShoppingBag, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function Sidebar() {
  const [userRole, setUserRole] = useState('empleado');
  const [showShop, setShowShop] = useState(false); // Módulo extra desactivado por defecto
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (data) setUserRole(data.role);
      }
    };
    fetchProfile();
  }, []);

  const menu = [
    { name: 'Mis Turnos', icon: Calendar, path: '/shifts', roles: ['empleado', 'supervisor', 'gerente'] },
    { name: 'Reportar/Solicitar', icon: FileText, path: '/requests', roles: ['empleado', 'supervisor', 'gerente'] },
    { name: 'Mi Información', icon: UserCircle, path: '/profile', roles: ['empleado', 'supervisor', 'gerente'] },
    // Vistas de Gestión
    { name: 'Vista RRHH', icon: Users, path: '/hr-management', roles: ['supervisor', 'gerente'] },
    { name: 'Gerencia', icon: BarChart3, path: '/admin', roles: ['gerente'] },
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
    <aside className="w-64 bg-[#1a202c] h-screen flex flex-col p-4">
      <div className="flex items-center gap-3 mb-10 px-2">
        <Box className="text-[#FF8C00] w-8 h-8" />
        <span className="text-white font-black tracking-tighter">SMART FOX SOLUTIONS</span>
      </div>

      <nav className="flex-1 space-y-2">
        {menu.filter(item => item.roles.includes(userRole)).map((item) => (
          <Link key={item.path} href={item.path} className="flex items-center gap-3 p-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl transition-all font-bold text-sm">
            <item.icon className="w-5 h-5" /> {item.name}
          </Link>
        ))}

        {/* MÓDULO EXTRA: Solo visible si está activo */}
        {showShop && (
          <div className="pt-4 mt-4 border-t border-gray-800">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-3 mb-2">Módulos Extra</p>
            <Link href="/pos" className="flex items-center gap-3 p-3 text-gray-400 hover:bg-gray-800 rounded-xl">
              <ShoppingBag className="w-5 h-5" /> Tienda / POS
            </Link>
          </div>
        )}
      </nav>

      <div className="pt-4 mt-4 border-t border-gray-800">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl transition-all font-bold text-sm"
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-5 h-5" /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}