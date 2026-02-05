'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ManagerDashboard from '@/components/dashboard/ManagerDashboard';

export default function AdminPage() {
  const [userRole, setUserRole] = useState<string>('gerente');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.error('Auth error:', authError);
          setLoading(false);
          return;
        }
        
        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (!profileError && profile?.role) {
            setUserRole(profile.role);
          } else if (profileError) {
            console.error('Error fetching profile:', profileError);
          }
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserRole();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return <ManagerDashboard userRole={userRole} />;
}
