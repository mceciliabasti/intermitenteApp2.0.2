'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AdminNavBarProps {
  title: string;
  backLink?: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

export default function AdminNavBar({ title, backLink, actionButton }: AdminNavBarProps) {
  const router = useRouter();

  return (
    <nav className="bg-white shadow-lg border-b-4 border-indigo-600">
      <div className="max-w-7xl mx-auto px-8 py-4">
        {/* Top row: Logo, Title and Action Button */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-6">
            <a href="/admin" className="flex items-center gap-3 text-2xl font-bold text-indigo-600">
              <img src="/logoInter.svg" alt="Intermitente" className="h-12 w-12 rounded-full bg-white border border-indigo-200 shadow" />
              <span>Intermitente</span>
            </a>
            {backLink && (
              <button onClick={() => router.push(backLink)} className="text-gray-600 hover:text-indigo-600 font-semibold">
                ← Volver
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            {actionButton && (
              <button 
                onClick={actionButton.onClick} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow-md transition duration-200"
              >
                {actionButton.label}
              </button>
            )}
            <button onClick={() => signOut()} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg shadow-md transition duration-200">
              Cerrar Sesión
            </button>
          </div>
        </div>
        
        {/* Bottom row: Navigation Links */}
        <div className="flex gap-6 overflow-x-auto pb-2">
          <button onClick={() => router.push('/admin')} className="text-gray-600 hover:text-indigo-600 font-semibold whitespace-nowrap">
            🏠 Inicio
          </button>
          <button onClick={() => router.push('/admin/workshops')} className="text-gray-600 hover:text-indigo-600 font-semibold whitespace-nowrap">
            🎭 Talleres
          </button>
          <button onClick={() => router.push('/admin/users')} className="text-gray-600 hover:text-indigo-600 font-semibold whitespace-nowrap">
            👥 Usuarios
          </button>
          <button onClick={() => router.push('/admin/enroll')} className="text-gray-600 hover:text-indigo-600 font-semibold whitespace-nowrap">
            ✅ Inscribir
          </button>
          <button onClick={() => router.push('/admin/enrollments')} className="text-gray-600 hover:text-indigo-600 font-semibold whitespace-nowrap">
            📊 Ver Inscripciones
          </button>
            <button onClick={() => router.push('/admin/accredit-payments')} className="text-gray-600 hover:text-indigo-600 font-semibold whitespace-nowrap">
              💸 Acreditar Pagos
            </button>
          <button onClick={() => router.push('/admin/materials')} className="text-gray-600 hover:text-indigo-600 font-semibold whitespace-nowrap">
            📚 Materiales
          </button>
          <button onClick={() => router.push('/profile')} className="text-gray-600 hover:text-indigo-600 font-semibold whitespace-nowrap">
            👤 Perfil
          </button>
        </div>
      </div>
    </nav>
  );
}
