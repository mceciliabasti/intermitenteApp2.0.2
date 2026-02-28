'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import StudentNavBar from '@/components/StudentNavBar';

interface Workshop {
  _id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    if (session.user.role === 'admin') {
      router.push('/admin');
      return;
    }
    // Student: fetch enrolled workshops
    fetch('/api/user')
      .then((r) => r.json())
      .then((data) => {
        const enrollments = (data.user?.enrollments || []);
        const enrolledWorkshops = enrollments
          .filter((e: any) => e.enabled && e.workshop && e.workshop.enabled)
          .map((e: any) => e.workshop)
          .filter((w: any) => w);
        setWorkshops(enrolledWorkshops);
      })
      .catch(() => setWorkshops([]))
      .finally(() => setLoading(false));
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  if (!session || session.user.role === 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <StudentNavBar />
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Mis Talleres</h1>
          {workshops.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-600">
              <p>No estás inscrito en ningún taller aún.</p>
              <p className="text-sm mt-2">Contacta con el administrador para inscribirte.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {workshops.map((w) => (
                <div key={w._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                  <h2 className="text-xl font-semibold mb-2 text-gray-900">{w.name}</h2>
                  <p className="text-gray-600 mb-4">{w.description}</p>
                  <button
                    onClick={() => router.push(`/workshops/${w._id}`)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                  >
                    Ver contenido →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
