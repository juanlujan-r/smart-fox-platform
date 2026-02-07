/**
 * CRM CONTACT MANAGER
 * Gestión de contactos, historial de llamadas y notas
 */

'use client';

import React, { useState } from 'react';
import * as supabaseService from '@/lib/call-center/supabase';
import { CRMContact } from '@/lib/call-center/supabase';

export function CRMContactManager() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<CRMContact[]>([]);
    const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

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

    const handleSelectContact = (contact: CRMContact) => {
        setSelectedContact(contact);
        setFormData(contact);
        setEditMode(false);
    };

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
                                    <h3 className="font-bold text-gray-900 mb-4">📞 Llamadas Recientes</h3>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {/* Call history would be loaded here */}
                                        <p className="text-gray-500 text-sm">Carga las llamadas del contacto</p>
                                    </div>
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
