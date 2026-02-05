"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Box, Calendar, FileText, UserCircle, Users, BarChart3, LayoutDashboard, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function Sidebar() {
  const [userRole, setUserRole] = useState('empleado');
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const menu = [
    { name: 'Panel Principal', icon: LayoutDashboard, path: '/dashboard', roles: ['empleado', 'supervisor', 'gerente'] },
    { name: 'Mis Turnos', icon: Calendar, path: '/shifts', roles: ['empleado', 'supervisor', 'gerente'] },
    { name: 'Reportar/Solicitar', icon: FileText, path: '/requests', roles: ['empleado', 'supervisor', 'gerente'] },
    { name: 'Mi Información', icon: UserCircle, path: '/profile', roles: ['empleado', 'supervisor', 'gerente'] },
    { name: 'Gestión RRHH', icon: Users, path: '/hr-management', roles: ['supervisor', 'gerente'] },
    { name: 'Dashboard Gerencial', icon: BarChart3, path: '/admin', roles: ['gerente'] },
  ];

  return (
    <aside className="w-64 bg-[#1a202c] h-screen flex flex-col p-4 border-r border-gray-800 sticky top-0">
      <div className="flex items-center gap-3 mb-10 px-2 pt-2">
        <div className="bg-[#FF8C00] p-1.5 rounded-lg">
          <Box className="text-white w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-white font-black leading-none text-lg">SMART FOX</span>
          <span className="text-[#FF8C00] text-[9px] font-bold tracking-[0.2em]">ERP SOLUTIONS</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {menu.filter(item => item.roles.includes(userRole)).map((item) => (
          <Link key={item.path} href={item.path} className="flex items-center gap-3 p-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl transition-all font-semibold text-sm group">
            <item.icon className="w-5 h-5 group-hover:text-[#FF8C00] transition-colors" /> 
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="pt-4 border-t border-gray-800">
        <button onClick={handleLogout} className="flex items-center gap-3 p-3 w-full text-red-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all font-bold text-sm group">
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}