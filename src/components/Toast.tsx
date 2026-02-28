'use client';

import { useEffect } from 'react';

interface ToastProps {
  id?: string;
  type?: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'info', onClose, duration = 3500 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const bg = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-indigo-600';

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${bg} text-white px-5 py-3 rounded-lg shadow-lg max-w-sm`} role="status">
      <div className="font-semibold">{type === 'success' ? 'Éxito' : type === 'error' ? 'Error' : 'Info'}</div>
      <div className="text-sm mt-1">{message}</div>
    </div>
  );
}
