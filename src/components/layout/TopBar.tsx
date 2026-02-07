"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, Search, User, PhoneCall, X } from 'lucide-react';
import Link from 'next/link';
import { useEmployeeModal } from '@/context/EmployeeModalContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'warning' | 'success';
}

interface SearchResult {
  id: string;
  type: 'employee' | 'request' | 'shift';
  title: string;
  description: string;
  link: string;
}

export default function TopBar() {
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const { openModal } = useEmployeeModal();

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
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener notificaciones del sistema (requests pendientes, etc)
      const { data: requests } = await supabase
        .from('requests')
        .select('id, title, created_at, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (requests) {
        const newNotifications: Notification[] = requests.map(req => ({
          id: req.id,
          title: 'Nueva solicitud',
          message: req.title,
          timestamp: new Date(req.created_at).toLocaleString('es-CO'),
          read: false,
          type: req.status === 'approved' ? 'success' : 'info'
        }));
        setNotifications(newNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      // Búsqueda en empleados
      const { data: employees } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .ilike('full_name', `%${query}%`)
        .limit(5);

      const results: SearchResult[] = employees?.map(emp => ({
        id: emp.id,
        type: 'employee',
        title: emp.full_name || 'Sin nombre',
        description: emp.role,
        link: '/hr-management'
      })) || [];

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const getRoleLabel = (role: string) => {
    const roles: { [key: string]: string } = {
      'empleado': 'Empleado',
      'supervisor': 'Supervisor',
      'gerente': 'Gerente'
    };
    return roles[role] || role;
  };

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markNotificationAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 bg-gray-50/50 backdrop-blur-sm border-b border-gray-200/40 flex items-center justify-between px-6 sticky top-0 z-40">
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
        <div className="relative" ref={searchRef}>
          <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2 gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar empleados..."
              className="bg-transparent border-none outline-none text-sm text-gray-700 w-48"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowSearch(true)}
            />
          </div>
          
          {/* Search Dropdown */}
          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-2">
                {searchResults.map(result => (
                  <div
                    key={result.id}
                    onClick={() => {
                      if (result.type === 'employee') {
                        openModal(result.id, result.title, userRole);
                        setShowSearch(false);
                      }
                    }}
                    className="block p-3 hover:bg-gray-50 rounded-lg transition cursor-pointer"
                  >
                    <div className="font-semibold text-sm text-gray-900">{result.title}</div>
                    <div className="text-xs text-gray-500">{result.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Notificaciones</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer flex justify-between items-start gap-2 ${
                        !notif.read ? 'bg-orange-50' : ''
                      }`}
                      onClick={() => markNotificationAsRead(notif.id)}
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900">{notif.title}</div>
                        <div className="text-xs text-gray-600 mt-1">{notif.message}</div>
                        <div className="text-xs text-gray-400 mt-2">{notif.timestamp}</div>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-1 flex-shrink-0"></div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No hay notificaciones
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Call Center */}
        <Link
          href="/call-center"
          className="hidden md:inline-flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded-lg font-semibold text-sm transition"
        >
          <PhoneCall className="w-4 h-4" />
          Centro de Llamadas
        </Link>

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
