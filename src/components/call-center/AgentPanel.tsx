/**
 * AGENT PANEL - Call Center Agent Interface
 * Panel principal para agentes recibiendo/haciendo llamadas
 */

'use client';

import React, { useState } from 'react';
import { useCallCenter } from '@/hooks/call-center/useCallCenter';

export function AgentPanel() {
    const {
        agentProfile,
        agentStatus,
        updateAgentStatus,
        currentCall,
        isCallActive,
        startCall,
        endCall,
        transferCall,
        currentContact,
        contactHistory,
        updateContact,
        loading,
        error,
        success,
    } = useCallCenter();

    const [phoneInput, setPhoneInput] = useState('');
    const [transferInput, setTransferInput] = useState('');
    const [noteText, setNoteText] = useState('');
    const [showTransferModal, setShowTransferModal] = useState(false);

    const handleStartCall = async () => {
        if (phoneInput.trim()) {
            await startCall(phoneInput.trim());
            setPhoneInput('');
        }
    };

    const handleEndCall = async () => {
        await endCall(noteText);
        setNoteText(''); // Clear notes after ending call
    };

    const handleTransfer = async () => {
        if (transferInput.trim()) {
            await transferCall(transferInput.trim());
            setTransferInput('');
            setShowTransferModal(false);
        }
    };

    return (
        <div className="h-full bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            🎧 Panel del Agente
                        </h1>
                        <p className="text-sm text-gray-500">
                            Extensión: {agentProfile?.extension || 'N/A'}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className={`inline-block px-4 py-2 rounded-full font-semibold ${
                            agentStatus === 'available' ? 'bg-green-100 text-green-700' :
                            agentStatus === 'busy' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                            {agentStatus.toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* Status toggle */}
                <div className="mt-4 flex gap-2">
                    <button
                        onClick={() => updateAgentStatus('available')}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                            agentStatus === 'available'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } disabled:opacity-50`}
                    >
                        ✓ Disponible
                    </button>
                    <button
                        onClick={() => updateAgentStatus('break')}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                            agentStatus === 'break'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } disabled:opacity-50`}
                    >
                        ⏸ Descanso
                    </button>
                    <button
                        onClick={() => updateAgentStatus('offline')}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                            agentStatus === 'offline'
                                ? 'bg-gray-700 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } disabled:opacity-50`}
                    >
                        ✕ Desconectado
                    </button>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mx-4 mt-4">
                    ❌ {error}
                </div>
            )}
            {success && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 mx-4 mt-2">
                    ✅ {success}
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 overflow-auto p-4">
                {isCallActive && currentCall ? (
                    // ACTIVE CALL VIEW
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">
                            📞 Llamada en Curso
                        </h2>

                        {/* Call info */}
                        <div className="bg-blue-50 rounded-lg p-4 mb-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Número llamante</p>
                                    <p className="text-lg font-mono font-bold text-blue-600">
                                        {currentCall.caller_number}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Duración</p>
                                    <p className="text-lg font-bold text-blue-600">
                                        {currentCall.duration_seconds}s
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact info */}
                        {currentContact && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <h3 className="font-semibold text-gray-900 mb-2">
                                    📇 Información de Contacto
                                </h3>
                                <p><strong>Nombre:</strong> {currentContact.first_name} {currentContact.last_name}</p>
                                <p><strong>Empresa:</strong> {currentContact.company_name || 'N/A'}</p>
                                <p><strong>Tipo:</strong> {currentContact.contact_type}</p>
                                <p><strong>Total llamadas:</strong> {currentContact.total_call_count}</p>
                            </div>
                        )}

                        {/* Call actions */}
                        <div className="space-y-2 mb-4">
                            <button
                                onClick={() => setShowTransferModal(true)}
                                disabled={loading}
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 rounded-lg disabled:opacity-50"
                            >
                                ↪️ Transferir Llamada
                            </button>
                            <button
                                onClick={handleEndCall}
                                disabled={loading}
                                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg disabled:opacity-50"
                            >
                                ❌ Finalizar Llamada
                            </button>
                        </div>

                        {/* Notes */}
                        <div className="mt-4">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                📝 Notas de la Llamada
                            </label>
                            <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Añade notas sobre la llamada..."
                                className="w-full h-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                ) : (
                    // IDLE VIEW - Make new call
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">
                            ☎️ Realizar Llamada
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Número a llamar
                                </label>
                                <input
                                    type="tel"
                                    value={phoneInput}
                                    onChange={(e) => setPhoneInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleStartCall()}
                                    placeholder="Ej: 3001234567"
                                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    disabled={loading || agentStatus === 'offline'}
                                />
                            </div>

                            <button
                                onClick={handleStartCall}
                                disabled={loading || !phoneInput.trim() || agentStatus === 'offline'}
                                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg disabled:opacity-50 transition"
                            >
                                {loading ? '⏳ Iniciando...' : '☎️ Llamar'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Call history */}
                {(currentContact?.id || contactHistory.length > 0) && (
                    <div className="bg-white rounded-lg shadow p-4">
                        <h3 className="font-bold text-gray-900 mb-3">📋 Historial de Llamadas</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {contactHistory.map((call) => (
                                <div key={call.id} className="text-sm border-l-4 border-gray-300 pl-3 py-2">
                                    <p className="text-gray-600">
                                        {new Date(call.created_at).toLocaleString()}
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                        {call.duration_seconds}s - {call.call_status}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Transfer modal */}
            {showTransferModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            ↪️ Transferir Llamada
                        </h2>

                        <input
                            type="tel"
                            value={transferInput}
                            onChange={(e) => setTransferInput(e.target.value)}
                            placeholder="Número a transferir"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                            autoFocus
                        />

                        <div className="flex gap-2">
                            <button
                                onClick={handleTransfer}
                                disabled={loading || !transferInput.trim()}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg disabled:opacity-50"
                            >
                                Transferir
                            </button>
                            <button
                                onClick={() => setShowTransferModal(false)}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 rounded-lg"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AgentPanel;
