/**
 * CALL CENTER PAGE
 * Página principal del call center
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import RoleGuard from '@/components/RoleGuard';
import { AgentPanel } from '@/components/call-center/AgentPanel';
import { CallCenterDashboard } from '@/components/call-center/CallCenterDashboard';
import { CRMContactManager } from '@/components/call-center/CRMContactManager';
import { IVRScriptManager } from '@/components/call-center/IVRScriptManager';

type TabType = 'agent' | 'dashboard' | 'crm' | 'ivr';

export default function CallCenterPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('agent');
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUserRole();
    }, []);

    const checkUserRole = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            setUserRole(profile?.role || null);
        } catch (error) {
            console.error('Error checking user role:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <RoleGuard allowedRoles={['supervisor', 'gerente']}>
            <div className="min-h-screen bg-gray-50">
                {/* Top Navigation */}
                <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
                    <div className="container mx-auto px-6 py-4">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-2xl font-bold text-gray-900">☎️ Call Center</h1>
                            <div className="text-sm text-gray-600">
                                Rol: <span className="font-semibold">{userRole}</span>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setActiveTab('agent')}
                                className={`px-4 py-2 rounded-lg font-medium transition ${
                                    activeTab === 'agent'
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                🎧 Panel de Agente
                            </button>

                            {(userRole === 'supervisor' || userRole === 'gerente') && (
                                <>
                                    <button
                                        onClick={() => setActiveTab('dashboard')}
                                        className={`px-4 py-2 rounded-lg font-medium transition ${
                                            activeTab === 'dashboard'
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        📊 Dashboard
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('crm')}
                                        className={`px-4 py-2 rounded-lg font-medium transition ${
                                            activeTab === 'crm'
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        📇 CRM
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('ivr')}
                                        className={`px-4 py-2 rounded-lg font-medium transition ${
                                            activeTab === 'ivr'
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        🎙️ IVR
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Content */}
                <div className="min-h-[calc(100vh-120px)]">
                    {activeTab === 'agent' && <AgentPanel />}
                    {activeTab === 'dashboard' && <CallCenterDashboard />}
                    {activeTab === 'crm' && <CRMContactManager />}
                    {activeTab === 'ivr' && <IVRScriptManager />}
                </div>
            </div>
        </RoleGuard>
    );
}
