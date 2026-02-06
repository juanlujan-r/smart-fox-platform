'use client';

import React, { createContext, useContext, useState, useRef } from 'react';

export type Toast = {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
};

type ToastContextType = {
  toasts: Toast[];
  pushToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const pushToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${++counterRef.current}`;
    const toast: Toast = { id, message, type };
    setToasts((prev) => [...prev, toast]);

    // Auto-remove after 4 seconds
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, pushToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
