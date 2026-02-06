'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export type UserRole = 'empleado' | 'supervisor' | 'gerente';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
}

/**
 * RoleGuard Component
 * Restricts access to pages based on user role
 * 
 * Usage:
 * <RoleGuard allowedRoles={['gerente']}>
 *   <AdminPage />
 * </RoleGuard>
 */
export default function RoleGuard({ 
  children, 
  allowedRoles,
  fallbackPath = '/dashboard'
}: RoleGuardProps) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkRole = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          router.push('/login');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          console.error('Error fetching profile:', profileError);
          router.push('/login');
          return;
        }

        const userRole = profile.role as UserRole;

        if (allowedRoles.includes(userRole)) {
          setHasAccess(true);
        } else {
          // Log unauthorized access attempt
          console.warn(`Unauthorized access attempt: User ${user.email} (${userRole}) tried to access ${pathname}`);
          
          // Redirect to dashboard or fallback path
          router.push(fallbackPath);
        }
      } catch (error) {
        console.error('Role check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [allowedRoles, router, pathname, fallbackPath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
