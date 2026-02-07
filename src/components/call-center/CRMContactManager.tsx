/**
 * CRM CONTACT MANAGER
 * Gestión de contactos, historial de llamadas y notas
 */

'use client';

import React, { useState, useEffect } from 'react';
import * as supabaseService from '@/lib/call-center/supabase';
import { CRMContact } from '@/lib/call-center/supabase';

export function CRMContactManager() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<CRMContact[]>([]);
    const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [callHistory, setCallHistory] = useState<any[]>([]);
    const [filteredCallHistory, setFilteredCallHistory] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [dateStart, setDateStart] = useState<string>('');
    const [dateEnd, setDateEnd] = useState<string>('');
    const [callSearchQuery, setCallSearchQuery] = useState<string>('');

    // Form fields
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<Partial<CRMContact>>({});

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.trim()) {
            try {
                setLoading(true);
                setError(null);
                const results = await supabaseService.searchContacts(query);
                setSearchResults(results);
            } catch (err) {
                setError('Error en la búsqueda');
                console.error(err);
            } finally {
                setLoading(false);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleSelectContact = async (contact: CRMContact) => {
        setSelectedContact(contact);
        setFormData(contact);
        setEditMode(false);
        setStatusFilter('');
        setTypeFilter('');
        setDateStart('');
        setDateEnd('');
        setCallSearchQuery('');

        // Load call history for this contact
        try {
            const history = await supabaseService.getContactCallHistory(contact.id);
            setCallHistory(history);
        } catch (err) {
            console.error('Error loading call history:', err);
        }
    };

    useEffect(() => {
        let filtered = callHistory;

        // Filter by status
        if (statusFilter) {
            filtered = filtered.filter(c => c.call_status === statusFilter);
        }

        // Filter by type
        if (typeFilter) {
            filtered = filtered.filter(c => c.call_direction === typeFilter);
        }

        // Filter by date range
        if (dateStart) {
            const startDate = new Date(dateStart);
            startDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(c => new Date(c.created_at) >= startDate);
        }

        if (dateEnd) {
            const endDate = new Date(dateEnd);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(c => new Date(c.created_at) <= endDate);
        }

        // Text search in notes/number/status
        if (callSearchQuery.trim()) {
            const query = callSearchQuery.toLowerCase();
            filtered = filtered.filter(c => {
                const haystack = `${c.caller_number || ''} ${c.notes || ''} ${c.call_status || ''}`.toLowerCase();
                return haystack.includes(query);
            });
        }

        setFilteredCallHistory(filtered);
    }, [callHistory, statusFilter, typeFilter, dateStart, dateEnd, callSearchQuery]);

    const handleSaveContact = async () => {
        if (!selectedContact) return;

        try {
            setLoading(true);
            setError(null);

            await supabaseService.updateContact(selectedContact.id, formData);
            setSuccess('Contacto actualizado correctamente');
            setEditMode(false);

            // Reload contact
            if (formData.phone_number) {
                const updated = await supabaseService.getOrCreateContact(formData.phone_number);
                setSelectedContact(updated);
            }

            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Error al guardar el contacto');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    📇 CRM - Gestión de Contactos
                </h1>
                <p className="text-gray-600">Busca, visualiza y gestiona contactos y su historial de llamadas</p>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-6 mt-4 rounded">
                    ❌ {error}
                </div>
            )}
            {success && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mx-6 mt-2 rounded">
                    ✅ {success}
                </div>
            )}

            <div className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Search Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="font-bold text-gray-900 mb-4">🔍 Buscar Contacto</h2>
                                <input
                                    type="text"
                                    placeholder="Teléfono, email o nombre..."
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            {/* Results list */}
                            <div className="max-h-96 overflow-y-auto">
                                {loading && (
                                    <div className="p-4 text-center text-gray-500">
                                        ⏳ Buscando...
                                    </div>
                                )}
                                {!loading && searchResults.length === 0 && searchQuery && (
                                    <div className="p-4 text-center text-gray-500">
                                        No se encontraron resultados
                                    </div>
                                )}
                                {searchResults.map((contact) => (
                                    <button
                                        key={contact.id}
                                        onClick={() => handleSelectContact(contact)}
                                        className={`w-full text-left px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition ${
                                            selectedContact?.id === contact.id
                                                ? 'bg-orange-50 border-l-4 border-l-orange-500'
                                                : ''
                                        }`}
                                    >
                                        <p className="font-semibold text-gray-900">
                                            {contact.first_name} {contact.last_name}
                                        </p>
                                        <p className="text-sm text-gray-600">{contact.phone_number}</p>
                                        <p className="text-xs text-gray-500">{contact.contact_type}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Contact Details Panel */}
                    {selectedContact && (
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow">
                                {/* Header */}
                                <div className="p-6 border-b border-gray-200 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {selectedContact.first_name} {selectedContact.last_name}
                                        </h2>
                                        <p className="text-gray-600">{selectedContact.contact_type}</p>
                                    </div>
                                    <button
                                        onClick={() => setEditMode(!editMode)}
                                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                                    >
                                        {editMode ? '❌ Cancelar' : '✏️ Editar'}
                                    </button>
                                </div>

                                {/* Contact info */}
                                <div className="p-6">
                                    <h3 className="font-bold text-gray-900 mb-4">📋 Información</h3>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        {/* Phone */}
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600 block mb-1">
                                                Teléfono
                                            </label>
                                            {editMode ? (
                                                <input
                                                    type="tel"
                                                    value={formData.phone_number || ''}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            phone_number: e.target.value,
                                                        })
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            ) : (
                                                <p className="text-gray-900 font-mono">
                                                    {selectedContact.phone_number}
                                                </p>
                                            )}
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600 block mb-1">
                                                Email
                                            </label>
                                            {editMode ? (
                                                <input
                                                    type="email"
                                                    value={formData.email || ''}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            email: e.target.value,
                                                        })
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            ) : (
                                                <p className="text-gray-900">
                                                    {selectedContact.email || '-'}
                                                </p>
                                            )}
                                        </div>

                                        {/* Company */}
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600 block mb-1">
                                                Empresa
                                            </label>
                                            {editMode ? (
                                                <input
                                                    type="text"
                                                    value={formData.company_name || ''}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            company_name: e.target.value,
                                                        })
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            ) : (
                                                <p className="text-gray-900">
                                                    {selectedContact.company_name || '-'}
                                                </p>
                                            )}
                                        </div>

                                        {/* Total calls */}
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600 block mb-1">
                                                Total de Llamadas
                                            </label>
                                            <p className="text-lg font-bold text-blue-600">
                                                {selectedContact.total_call_count}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="mb-6">
                                        <label className="text-sm font-semibold text-gray-600 block mb-1">
                                            Notas
                                        </label>
                                        {editMode ? (
                                            <textarea
                                                value={formData.notes || ''}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        notes: e.target.value,
                                                    })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                rows={4}
                                            />
                                        ) : (
                                            <p className="text-gray-900">
                                                {selectedContact.notes || 'Sin notas'}
                                            </p>
                                        )}
                                    </div>

                                    {editMode && (
                                        <button
                                            onClick={handleSaveContact}
                                            disabled={loading}
                                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg disabled:opacity-50"
                                        >
                                            💾 Guardar Cambios
                                        </button>
                                    )}
                                </div>

                                {/* Recent calls */}
                                <div className="p-6 border-t border-gray-200">
                                    <h3 className="font-bold text-gray-900 mb-4">
                                        📞 Historial de Llamadas ({callHistory.length})
                                    </h3>

                                    {/* Filters */}
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
                                        <input
                                            type="text"
                                            value={callSearchQuery}
                                            onChange={(e) => setCallSearchQuery(e.target.value)}
                                            placeholder="Buscar número, notas o estado..."
                                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        >
                                            <option value="">Estado: Todos</option>
                                            <option value="completed">Completadas</option>
                                            <option value="active">Activas</option>
                                            <option value="failed">Fallidas</option>
                                            <option value="no_answer">No contesta</option>
                                            <option value="missed">Pérdidas</option>
                                        </select>
                                        <select
                                            value={typeFilter}
                                            onChange={(e) => setTypeFilter(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        >
                                            <option value="">Tipo: Todos</option>
                                            <option value="inbound">Entrantes</option>
                                            <option value="outbound">Salientes</option>
                                        </select>
                                        <input
                                            type="date"
                                            value={dateStart}
                                            onChange={(e) => setDateStart(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                        <input
                                            type="date"
                                            value={dateEnd}
                                            onChange={(e) => setDateEnd(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs text-gray-500">
                                            Mostrando {filteredCallHistory.length} de {callHistory.length} llamadas
                                        </p>
                                        <button
                                            onClick={() => {
                                                setStatusFilter('');
                                                setTypeFilter('');
                                                setDateStart('');
                                                setDateEnd('');
                                                setCallSearchQuery('');
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800"
                                        >
                                            Limpiar filtros
                                        </button>
                                    </div>

                                    {filteredCallHistory.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>{statusFilter || typeFilter || dateStart || dateEnd || callSearchQuery ? 'No hay llamadas que coincidan con los filtros' : 'No hay llamadas registradas para este contacto'}</p>
                                        </div>
                                    ) : (
                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="max-h-64 overflow-y-auto">
                                                <table className="min-w-full">
                                                    <thead className="bg-gray-50 sticky top-0">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                                                                Fecha
                                                            </th>
                                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                                                                Tipo
                                                            </th>
                                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                                                                Duración
                                                            </th>
                                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                                                                Estado
                                                            </th>
                                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                                                                Notas
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {filteredCallHistory.map((call: any) => (
                                                            <tr key={call.id} className="hover:bg-gray-50">
                                                                <td className="px-4 py-2 text-sm text-gray-600">
                                                                    {new Date(call.created_at).toLocaleString('es-ES', {
                                                                        day: '2-digit',
                                                                        month: 'short',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                                        call.call_direction === 'inbound'
                                                                            ? 'bg-blue-100 text-blue-700'
                                                                            : 'bg-purple-100 text-purple-700'
                                                                    }`}>
                                                                        {call.call_direction === 'inbound' ? '📥 Entrante' : '📤 Saliente'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-2 text-sm text-gray-900">
                                                                    {Math.floor(call.duration_seconds / 60)}:{(call.duration_seconds % 60).toString().padStart(2, '0')}
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                                        call.call_status === 'completed'
                                                                            ? 'bg-green-100 text-green-700'
                                                                            : call.call_status === 'active'
                                                                            ? 'bg-yellow-100 text-yellow-700'
                                                                            : 'bg-gray-100 text-gray-700'
                                                                    }`}>
                                                                        {call.call_status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-2 text-xs text-gray-600 max-w-xs truncate">
                                                                    {call.notes || '-'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {!selectedContact && (
                        <div className="lg:col-span-2 bg-white rounded-lg shadow p-12">
                            <div className="text-center">
                                <p className="text-gray-500 text-lg mb-2">📭 Selecciona un contacto</p>
                                <p className="text-gray-400">
                                    Busca un contacto para ver su información y historial de llamadas
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CRMContactManager;
