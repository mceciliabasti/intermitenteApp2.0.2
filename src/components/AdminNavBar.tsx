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

import { useState } from 'react';

export default function AdminNavBar({ title, backLink, actionButton }: AdminNavBarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

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
          </div>
          {/* 'Volver' button: block below logo in mobile, inline in desktop */}
          {backLink && (
            <div className="mt-2 md:mt-0 md:inline-block block w-full hidden sm:block">
              <button onClick={() => router.push(backLink)} className="text-gray-600 hover:text-indigo-600 font-semibold w-full md:w-auto">
                ← Volver
              </button>
            </div>
          )}
          <div className="flex items-center gap-4">
            <button onClick={() => signOut()} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg shadow-md transition duration-200">
              Cerrar Sesión
            </button>
            {/* Hamburger menu button for mobile */}
            <button className="md:hidden ml-2 p-2 rounded bg-indigo-100 text-indigo-600 focus:outline-none sm:block" onClick={() => setMenuOpen(!menuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          {/* Action button: block below top row in mobile, inline in desktop */}
          {actionButton && (
            <div className="mt-2 md:mt-0 md:inline-block block w-full">
              <button 
                onClick={actionButton.onClick} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow-md transition duration-200 w-full md:w-auto"
              >
                {actionButton.label}
              </button>
            </div>
          )}
        </div>

        {/* Desktop navigation links */}
        <div className="flex gap-6 overflow-x-auto pb-2 hidden md:flex">
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

        {/* Mobile hamburger menu */}
        {menuOpen && (
          <div className="flex flex-col gap-2 mt-2 md:hidden bg-white rounded shadow p-4">
            <button onClick={() => { setMenuOpen(false); router.push('/admin'); }} className="text-gray-600 hover:text-indigo-600 font-semibold whitespace-nowrap">
              🏠 Inicio
            </button>
            <button onClick={() => { setMenuOpen(false); router.push('/admin/workshops'); }} className="text-gray-600 hover:text-indigo-600 font-semibold whitespace-nowrap">
              🎭 Talleres
            </button>
            <button onClick={() => { setMenuOpen(false); router.push('/admin/users'); }} className="text-gray-600 hover:text-indigo-600 font-semibold whitespace-nowrap">
              👥 Usuarios
            </button>
            <button onClick={() => { setMenuOpen(false); router.push('/admin/enroll'); }} className="text-gray-600 hover:text-indigo-600 font-semibold whitespace-nowrap">
              ✅ Inscribir
            </button>
            <button onClick={() => { setMenuOpen(false); router.push('/admin/enrollments'); }} className="text-gray-600 hover:text-indigo-600 font-semibold whitespace-nowrap">
              📊 Ver Inscripciones
            </button>
            <button onClick={() => { setMenuOpen(false); router.push('/admin/accredit-payments'); }} className="text-gray-600 hover:text-indigo-600 font-semibold whitespace-nowrap">
              💸 Acreditar Pagos
            </button>
            <button onClick={() => { setMenuOpen(false); router.push('/admin/materials'); }} className="text-gray-600 hover:text-indigo-600 font-semibold whitespace-nowrap">
              📚 Materiales
            </button>
            <button onClick={() => { setMenuOpen(false); router.push('/profile'); }} className="text-gray-600 hover:text-indigo-600 font-semibold whitespace-nowrap">
              👤 Perfil
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
