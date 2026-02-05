"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, Search, User } from 'lucide-react';

export default function TopBar() {
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setUserName(data.full_name || user.email?.split('@')[0] || 'Usuario');
          setUserRole(data.role || 'empleado');
        }
      }
    };
    fetchUserInfo();
  }, []);

  const getRoleLabel = (role: string) => {
    const roles: { [key: string]: string } = {
      'empleado': 'Empleado',
      'supervisor': 'Supervisor',
      'gerente': 'Gerente'
    };
    return roles[role] || role;
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Company Info */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-900">SmartFox ERP Solutions</span>
          <span className="text-xs text-gray-500">Sistema de Gestión Empresarial</span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2 gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent border-none outline-none text-sm text-gray-700 w-48"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-900">{userName}</span>
            <span className="text-xs text-gray-500">{getRoleLabel(userRole)}</span>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}
