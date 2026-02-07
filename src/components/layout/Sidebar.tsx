"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, FileText, UserCircle, Users, BarChart3, LayoutDashboard, LogOut, CheckCircle, PhoneCall } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Sidebar() {
  const [userRole, setUserRole] = useState('empleado');

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
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during logout:', error);
        return;
      }
      // Clear any client-side storage
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const menu = [
    { name: 'Panel Principal', icon: LayoutDashboard, path: '/dashboard', roles: ['empleado', 'supervisor', 'gerente'] },
    { name: 'Mis Turnos', icon: Calendar, path: '/shifts', roles: ['empleado', 'supervisor', 'gerente'] },
    { name: 'Centro de Llamadas', icon: PhoneCall, path: '/call-center', roles: ['empleado', 'supervisor', 'gerente'] },
    { name: 'Reportar/Solicitar', icon: FileText, path: '/requests', roles: ['empleado', 'supervisor', 'gerente'] },
    { name: 'Mi Información', icon: UserCircle, path: '/profile', roles: ['empleado', 'supervisor', 'gerente'] },
    { name: 'Aprobar Solicitudes', icon: CheckCircle, path: '/approvals', roles: ['supervisor', 'gerente'] },
    { name: 'Gestión RRHH', icon: Users, path: '/hr-management', roles: ['supervisor', 'gerente'] },
    { name: 'Dashboard Gerencial', icon: BarChart3, path: '/admin', roles: ['gerente'] },
  ];

  return (
    <aside className="w-64 bg-[#1a202c] h-screen flex flex-col p-4 border-r border-gray-800 sticky top-0">
      <div className="flex items-center justify-center mb-8 px-2 pt-2">
        <Image 
          src="/logo.png" 
          alt="SmartFox ERP" 
          width={180} 
          height={90}
          className="object-contain"
          priority
        />
      </div>

      <nav className="flex-1 space-y-1">
        {menu.filter(item => item.roles.includes(userRole)).map((item) => (
          <Link key={item.path} href={item.path} className="flex items-center gap-3 p-3 text-gray-300 bg-transparent hover:bg-gray-800 hover:text-white rounded-xl transition-all font-semibold text-sm group">
            <item.icon className="w-5 h-5 text-gray-400 group-hover:text-[#FF8C00] transition-colors" /> 
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="pt-4 border-t border-gray-800 bg-[#1a202c]">
        <button onClick={handleLogout} className="flex items-center gap-3 p-3 w-full text-gray-300 bg-transparent hover:bg-red-900/30 hover:text-red-400 rounded-xl transition-all font-bold text-sm group">
          <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-400 group-hover:scale-110 transition-all" /> 
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
