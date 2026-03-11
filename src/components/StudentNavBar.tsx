'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useState } from 'react';

export default function StudentNavBar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!session) return null;

  return (
    <nav className="bg-white shadow-lg border-b-2 border-indigo-600">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-3 text-2xl font-bold text-indigo-600">
            <img src="/logoInter.svg" alt="Intermitente" className="h-12 w-12 rounded-full bg-white border border-indigo-200 shadow" />
            <span>Intermitente</span>
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-6">
            <span className="text-gray-500 text-sm mr-2">
              Hola{session.user?.name ? `, ${session.user.name}` : ''}
            </span>
            <Link href="/" className="text-gray-700 hover:text-indigo-600 font-semibold">
              🎭 Mis Talleres
            </Link>
            <Link href="/notifications" className="text-gray-700 hover:text-indigo-600 font-semibold">
              🔔 Notificaciones
            </Link>
            <Link href="/profile" className="text-gray-700 hover:text-indigo-600 font-semibold">
              👤 Mi Perfil
            </Link>
            <button
              onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold"
            >
              Cerrar sesión
            </button>
          </div>

          {/* Mobile hamburger menu */}
          <div className="md:hidden flex items-center">
            <button
              className="p-2 rounded text-indigo-600 focus:outline-none"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Abrir menú"
            >
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute top-16 right-6 bg-white shadow-lg rounded-lg border border-indigo-200 w-56 z-50">
                <div className="flex flex-col p-4 gap-4">
                  <span className="text-gray-500 text-sm">
                    Hola{session.user?.name ? `, ${session.user.name}` : ''}
                  </span>
                  <Link href="/" className="text-gray-700 hover:text-indigo-600 font-semibold" onClick={() => setMenuOpen(false)}>
                    🎭 Mis Talleres
                  </Link>
                  <Link href="/notifications" className="text-gray-700 hover:text-indigo-600 font-semibold" onClick={() => setMenuOpen(false)}>
                    🔔 Notificaciones
                  </Link>
                  <Link href="/profile" className="text-gray-700 hover:text-indigo-600 font-semibold" onClick={() => setMenuOpen(false)}>
                    👤 Mi Perfil
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      signOut({ redirect: true, callbackUrl: '/login' });
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
