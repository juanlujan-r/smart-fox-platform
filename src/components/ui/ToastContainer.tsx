'use client';

import { useToast } from '@/context/ToastContext';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  const bgColor = (type?: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-500';
      case 'success':
        return 'bg-green-500';
      default:
        return 'bg-[#FF8C00]';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${bgColor(
            toast.type
          )} text-white px-4 py-2 rounded shadow-lg pointer-events-auto cursor-pointer hover:shadow-xl transition-shadow`}
          onClick={() => removeToast(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
