'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminNavBar from '@/components/AdminNavBar';

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session && session.user && session.user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [session, router]);

  if (!session || !session.user || session.user.role !== 'admin') {
    return <div>Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AdminNavBar title="Panel de Administración" />

      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Panel de Administración</h2>
          <p className="text-gray-600">Bienvenido, {session.user.name || 'Admin'}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
          {/* Gestionar Talleres */}
          <a href="/admin/workshops" className="group bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:scale-105 border-t-4 border-indigo-500">
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-4">🎭</span>
              <h2 className="text-2xl font-bold text-gray-900">Gestionar Talleres</h2>
            </div>
            <p className="text-gray-600">Crear, editar y eliminar talleres</p>
            <div className="mt-4 text-indigo-600 font-semibold group-hover:translate-x-2 transition duration-200">
              Ver talleres →
            </div>
          </a>

          {/* Gestionar Usuarios */}
          <a href="/admin/users" className="group bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:scale-105 border-t-4 border-blue-500">
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-4">👥</span>
              <h2 className="text-2xl font-bold text-gray-900">Gestionar Usuarios</h2>
            </div>
            <p className="text-gray-600">Crear, editar y eliminar usuarios</p>
            <div className="mt-4 text-blue-600 font-semibold group-hover:translate-x-2 transition duration-200">
              Ver usuarios →
            </div>
          </a>

          {/* Inscribir Usuarios */}
          <a href="/admin/enroll" className="group bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:scale-105 border-t-4 border-green-500">
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-4">✅</span>
              <h2 className="text-2xl font-bold text-gray-900">Inscribir Usuarios</h2>
            </div>
            <p className="text-gray-600">Inscribir usuarios en talleres</p>
            <div className="mt-4 text-green-600 font-semibold group-hover:translate-x-2 transition duration-200">
              Inscribir →
            </div>
          </a>

          {/* Gestionar Materiales */}
          <a href="/admin/materials" className="group bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:scale-105 border-t-4 border-yellow-500">
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-4">📚</span>
              <h2 className="text-2xl font-bold text-gray-900">Gestionar Materiales</h2>
            </div>
            <p className="text-gray-600">Crear, editar y adjuntar materiales globales</p>
            <div className="mt-4 text-yellow-600 font-semibold group-hover:translate-x-2 transition duration-200">
              Ver materiales →
            </div>
          </a>

          {/* Ver Inscripciones */}
          <a href="/admin/enrollments" className="group bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:scale-105 border-t-4 border-purple-500">
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-4">📊</span>
              <h2 className="text-2xl font-bold text-gray-900">Ver Inscripciones</h2>
            </div>
            <p className="text-gray-600">Ver talleres de estudiantes y estudiantes por taller</p>
            <div className="mt-4 text-purple-600 font-semibold group-hover:translate-x-2 transition duration-200">
              Ver inscripciones →
            </div>
          </a>

          {/* Notificaciones */}
          <a href="/admin/notifications" className="group bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:scale-105 border-t-4 border-red-500">
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-4">🔔</span>
              <h2 className="text-2xl font-bold text-gray-900">Notificaciones</h2>
            </div>
            <p className="text-gray-600">Enviar notificaciones a usuarios</p>
            <div className="mt-4 text-red-600 font-semibold group-hover:translate-x-2 transition duration-200">
              Ver notificaciones →
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}