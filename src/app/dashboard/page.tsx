"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import AdminNavBar from '@/components/AdminNavBar';
import StudentNavBar from '@/components/StudentNavBar';



interface User {
  firstName: string;
  lastName: string;
  phone: string;
  dni: string;
  email: string;
  enrollments?: any[];
}

export default function InicioPage() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/user');
        if (!res.ok) throw new Error('No se pudieron obtener los datos');
        const data = await res.json();
        setUser(data.user);
      } catch (e) {
        setError('No se pudieron obtener los datos');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }
  if (status === 'unauthenticated') {
    return <div className="flex items-center justify-center min-h-screen">Redirigiendo a login...</div>;
  }
  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Error: {error}</div>;
  }
  const isAdmin = session?.user?.role === 'admin';
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {isAdmin ? <AdminNavBar title="Inicio" /> : <StudentNavBar />}
      <div className="p-8">
        <div className="max-w-3xl mx-auto grid grid-cols-1 gap-8 mb-8">
          {/* Datos Personales */}
          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500 flex flex-col justify-between min-h-[260px]">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Datos Personales
            </h2>
            {user && (
              <div className="space-y-2">
                <div>
                  <p className="text-gray-600 text-xs">Nombres</p>
                  <p className="text-base font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Correo Electrónico</p>
                  <p className="text-base font-semibold text-gray-900">{user.email}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Teléfono</p>
                  <p className="text-base font-semibold text-gray-900">{user.phone}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">DNI</p>
                  <p className="text-base font-semibold text-gray-900">{user.dni}</p>
                </div>
                <div className="pt-2">
                  <a
                    href="/profile"
                    className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1 rounded-lg shadow-md transition duration-200 font-semibold text-sm"
                  >
                    Editar perfil
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
