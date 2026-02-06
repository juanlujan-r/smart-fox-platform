"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Box, Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.push('/dashboard');
    };
    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      // Auto-complete email with @smartfox.com if not present
      const fullEmail = email.includes('@') ? email : `${email}@smartfox.com`;
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: fullEmail,
        password,
      });

      if (authError) throw authError;

      if (data.session) {

        router.refresh(); 
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message === 'Invalid login credentials' 
        ? 'Correo o contraseña incorrectos' 
        : 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a202c] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8 space-y-8 animate-in fade-in zoom-in duration-300">
        
        {/* Branding Smart Fox */}
        <div className="flex flex-col items-center gap-2">
          <div className="bg-[#FF8C00] p-4 rounded-2xl shadow-lg shadow-orange-200">
            <Box className="text-white w-10 h-10" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Smart Fox</h1>
            <p className="text-[#FF8C00] text-[10px] tracking-[0.3em] font-bold uppercase -mt-1">Solutions</p>
          </div>
        </div>

        <div className="space-y-2 text-center">
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">Iniciar Sesión</h2>
          <p className="text-sm text-gray-500 font-medium">Accede a tu panel de administración</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl animate-shake">
            <p className="text-sm text-red-700 font-bold">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Usuario (Correo Corporativo)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:bg-white transition-all text-gray-800"
                placeholder="usuario@smartfox.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:bg-white transition-all text-gray-800"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF8C00] hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verificando...</span>
              </>
            ) : (
              'Entrar al Sistema'
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-gray-400 font-medium uppercase tracking-widest">
          © {new Date().getFullYear()} Smart Fox Solutions S.A.S
        </p>
      </div>
    </div>
  );
}
