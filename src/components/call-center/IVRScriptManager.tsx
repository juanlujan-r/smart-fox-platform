/**
 * IVR SCRIPT MANAGER
 * Gestión de scripts de IVR (Interactive Voice Response)
 */

'use client';

import React, { useState, useEffect } from 'react';
import * as supabaseService from '@/lib/call-center/supabase';

export interface IVRMenuOption {
    digit: string;
    description: string;
    actionQueue?: string;
    actionTransfer?: string;
}

export interface IVRMenu {
    id: string;
    message: string;
    options: IVRMenuOption[];
    maxAttempts: number;
    timeout: number;
}

export function IVRScriptManager() {
    const [scripts, setScripts] = useState<supabaseService.IVRScript[]>([]);
    const [menus, setMenus] = useState<IVRMenu[]>([]);
    const [selectedMenu, setSelectedMenu] = useState<IVRMenu | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<Partial<IVRMenu>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newScriptName, setNewScriptName] = useState('');

    const [newScriptName, setNewScriptName] = useState('');

    useEffect(() => {
        loadScripts();
    }, []);

    const loadScripts = async () => {
        try {
            setLoading(true);
            const data = await supabaseService.getIVRScripts();
            setScripts(data);

            // Load first active script
            const activeScript = data.find(s => s.active) || data[0];
            if (activeScript) {
                loadMenusFromScript(activeScript);
            } else {
                // Create default menu if no scripts exist
                setMenus([{
                    id: 'main',
                    message: 'Bienvenido a Smart Fox Solutions. Para Ventas presione 1, para Soporte presione 2, para Recursos Humanos presione 3',
                    options: [
                        { digit: '1', description: 'Ventas', actionQueue: 'sales' },
                        { digit: '2', description: 'Soporte', actionQueue: 'support' },
                        { digit: '3', description: 'Recursos Humanos', actionQueue: 'hr' },
                    ],
                    maxAttempts: 3,
                    timeout: 10,
                }]);
                setSelectedMenu(menus[0]);
            }
        } catch (err) {
            setError('Error cargando scripts IVR');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadMenusFromScript = (script: supabaseService.IVRScript) => {
        try {
            const scriptMenus = script.script_data?.menus || [];
            if (scriptMenus.length > 0) {
                setMenus(scriptMenus);
                setSelectedMenu(scriptMenus[0]);
                setFormData(scriptMenus[0]);
            }
        } catch (err) {
            console.error('Error parsing script menus:', err);
        }
    };

    const handleCreateNewScript = async () => {
        if (!newScriptName.trim()) {
            setError('El nombre del script es requerido');
            return;
        }

        try {
            setLoading(true);
            const defaultMenu: IVRMenu = {
                id: 'main',
                message: 'Bienvenido a Smart Fox Solutions',
                options: [],
                maxAttempts: 3,
                timeout: 10,
            };

            const newScript = await supabaseService.createIVRScript({
                name: newScriptName,
                description: '',
                language: 'es',
                welcome_message: defaultMenu.message,
                script_data: { menus: [defaultMenu] },
                active: false,
            });

            setScripts([newScript, ...scripts]);
            setMenus([defaultMenu]);
            setSelectedMenu(defaultMenu);
            setFormData(defaultMenu);
            setShowCreateModal(false);
            setNewScriptName('');
            setSuccess('Script IVR creado correctamente');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Error creando script IVR');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectMenu = (menu: IVRMenu) => {
        setSelectedMenu(menu);
        setFormData(menu);
        setEditMode(false);
    };

    const handleAddOption = () => {
        const newOptions = [
            ...(formData.options || []),
            { digit: '', description: '', actionQueue: '' },
        ];
        setFormData({ ...formData, options: newOptions });
    };

    const handleUpdateOption = (index: number, field: string, value: string) => {
        const newOptions = [...(formData.options || [])];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setFormData({ ...formData, options: newOptions });
    };

    const handleRemoveOption = (index: number) => {
        const newOptions = (formData.options || []).filter((_, i) => i !== index);
        setFormData({ ...formData, options: newOptions });
    };

    const handleSaveMenu = async () => {
        if (!selectedMenu) return;

        try {
            setLoading(true);
            setError(null);

            // Update menu in list
            const updatedMenus = menus.map((m) =>
                m.id === selectedMenu.id
                    ? { ...selectedMenu, ...formData }
                    : m
            );
            setMenus(updatedMenus);

            // Find current active script or use first one
            const currentScript = scripts.find(s => s.active) || scripts[0];
            
            if (currentScript) {
                // Update script in database
                await supabaseService.updateIVRScript(currentScript.id, {
                    script_data: { menus: updatedMenus },
                    welcome_message: updatedMenus[0]?.message || '',
                });

                setSuccess('Script IVR guardado correctamente');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                // Create new script if none exists
                await handleCreateNewScript();
            }

            setSelectedMenu(updatedMenus.find((m) => m.id === selectedMenu.id) || null);
            setEditMode(false);
        } catch (err) {
            setError('Error guardando script IVR');
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
                    🎙️ Gestor de Scripts IVR
                </h1>
                <p className="text-gray-600">
                    Configura menús de respuesta interactiva de voz
                </p>
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

            {loading && (
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
            )}

            <div className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Menu list */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="font-bold text-gray-900 mb-4">📋 Menús IVR</h2>
                                <button 
                                    onClick={() => setShowCreateModal(true)}
                                    className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                                >
                                    ➕ Crear Nuevo Menú
                                </button>
                            </div>

                            <div className="divide-y divide-gray-200">
                                {menus.map((menu) => (
                                    <button
                                        key={menu.id}
                                        onClick={() => handleSelectMenu(menu)}
                                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${
                                            selectedMenu?.id === menu.id
                                                ? 'bg-orange-50 border-l-4 border-l-orange-500'
                                                : ''
                                        }`}
                                    >
                                        <p className="font-semibold text-gray-900">
                                            {menu.id === 'main' ? 'Menú Principal' : menu.id}
                                        </p>
                                        <p className="text-sm text-gray-600 truncate">
                                            {menu.options.length} opción(es)
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Edit menu */}
                    {selectedMenu && (
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow">
                                {/* Header */}
                                <div className="p-6 border-b border-gray-200 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {editMode ? '✏️ Editar' : '👁️'} {selectedMenu.id === 'main' ? 'Menú Principal' : selectedMenu.id}
                                        </h2>
                                    </div>
                                    <button
                                        onClick={() => setEditMode(!editMode)}
                                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                                    >
                                        {editMode ? '❌ Cancelar' : '✏️ Editar'}
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    {/* Message */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            📢 Mensaje de Bienvenida
                                        </label>
                                        {editMode ? (
                                            <textarea
                                                value={formData.message || ''}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, message: e.target.value })
                                                }
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                                rows={3}
                                            />
                                        ) : (
                                            <p className="text-gray-900">
                                                {selectedMenu.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Settings */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                                Max. Intentos
                                            </label>
                                            {editMode ? (
                                                <input
                                                    type="number"
                                                    value={formData.maxAttempts || 3}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            maxAttempts: parseInt(e.target.value),
                                                        })
                                                    }
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                                />
                                            ) : (
                                                <p className="text-gray-900 font-semibold">
                                                    {selectedMenu.maxAttempts}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                                Timeout (seg)
                                            </label>
                                            {editMode ? (
                                                <input
                                                    type="number"
                                                    value={formData.timeout || 10}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            timeout: parseInt(e.target.value),
                                                        })
                                                    }
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                                />
                                            ) : (
                                                <p className="text-gray-900 font-semibold">
                                                    {selectedMenu.timeout}s
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Options */}
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-gray-900">🔢 Opciones del Menú</h3>
                                            {editMode && (
                                                <button
                                                    onClick={handleAddOption}
                                                    className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                                >
                                                    ➕ Añadir Opción
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            {(formData.options || []).map((option, index) => (
                                                <div
                                                    key={index}
                                                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                                >
                                                    <div className="grid grid-cols-4 gap-2 mb-2">
                                                        <div>
                                                            <label className="text-xs font-semibold text-gray-600 block mb-1">
                                                                Dígito
                                                            </label>
                                                            {editMode ? (
                                                                <input
                                                                    type="text"
                                                                    maxLength={1}
                                                                    value={option.digit}
                                                                    onChange={(e) =>
                                                                        handleUpdateOption(index, 'digit', e.target.value)
                                                                    }
                                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                                                                />
                                                            ) : (
                                                                <p className="font-bold text-lg text-gray-900">
                                                                    {option.digit}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className="text-xs font-semibold text-gray-600 block mb-1">
                                                                Descripción
                                                            </label>
                                                            {editMode ? (
                                                                <input
                                                                    type="text"
                                                                    value={option.description}
                                                                    onChange={(e) =>
                                                                        handleUpdateOption(
                                                                            index,
                                                                            'description',
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    className="w-full px-2 py-1 border border-gray-300 rounded"
                                                                />
                                                            ) : (
                                                                <p className="text-gray-900">
                                                                    {option.description}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className="text-xs font-semibold text-gray-600 block mb-1">
                                                                Cola
                                                            </label>
                                                            {editMode ? (
                                                                <input
                                                                    type="text"
                                                                    value={option.actionQueue || ''}
                                                                    onChange={(e) =>
                                                                        handleUpdateOption(
                                                                            index,
                                                                            'actionQueue',
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    className="w-full px-2 py-1 border border-gray-300 rounded"
                                                                />
                                                            ) : (
                                                                <p className="text-gray-900">
                                                                    {option.actionQueue || '-'}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {editMode && (
                                                            <div className="flex items-end">
                                                                <button
                                                                    onClick={() => handleRemoveOption(index)}
                                                                    className="w-full bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {editMode && (
                                        <button
                                            onClick={handleSaveMenu}
                                            className="w-full mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg"
                                        >
                                            💾 Guardar Script
                                        </button>
                                    )}
                                </div>

                                {/* Preview */}
                                <div className="p-6 bg-gray-50 border-t border-gray-200">
                                    <h3 className="font-bold text-gray-900 mb-3">👁️ Vista Previa</h3>
                                    <div className="bg-blue-900 text-white rounded-lg p-6 font-mono text-sm">
                                        <p className="mb-4">{formData.message || selectedMenu.message}</p>
                                        <p className="text-blue-300 mb-2">Presione:</p>
                                        {(formData.options || selectedMenu.options).map((opt) => (
                                            <p key={opt.digit} className="text-blue-300">
                                                {opt.digit}. {opt.description}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create New Script Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            ➕ Crear Nuevo Script IVR
                        </h2>

                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Nombre del Script
                            </label>
                            <input
                                type="text"
                                value={newScriptName}
                                onChange={(e) => setNewScriptName(e.target.value)}
                                placeholder="Ej: IVR Principal, IVR Ventas"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleCreateNewScript}
                                disabled={loading || !newScriptName.trim()}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg disabled:opacity-50"
                            >
                                Crear
                            </button>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewScriptName('');
                                }}
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

export default IVRScriptManager;
