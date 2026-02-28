'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StudentNavBar() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) return null;

  return (
    <nav className="bg-white shadow-lg border-b-2 border-indigo-600">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-3 text-2xl font-bold text-indigo-600">
            <img src="/logoInter.svg" alt="Intermitente" className="h-12 w-12 rounded-full bg-white border border-indigo-200 shadow" />
            <span>Intermitente</span>
          </Link>

          <div className="flex items-center gap-6">
            <span className="text-gray-500 text-sm mr-2 hidden md:inline-block">
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
        </div>
      </div>
    </nav>
  );
}
