'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminNavBar from '@/components/AdminNavBar';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  enrollments: {
    workshop: {
      _id: string;
      name: string;
    };
    status: 'current' | 'past';
    enabled: boolean;
    enrolledAt: string;
  }[];
}

interface Workshop {
  _id: string;
  name: string;
  description: string;
  enrolled: number;
  capacity: number;
}

interface WorkshopWithStudents extends Workshop {
  students: User[];
}

export default function EnrollmentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'students' | 'workshops'>('students');
  const [users, setUsers] = useState<User[]>([]);
  const [workshops, setWorkshops] = useState<WorkshopWithStudents[]>([]);
  const [userEnrollments, setUserEnrollments] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');
  const [workshopSearch, setWorkshopSearch] = useState('');
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [expandedWorkshops, setExpandedWorkshops] = useState<Set<string>>(new Set());

  const toggleStudentExpanded = (userId: string) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedStudents(newExpanded);
  };

  const toggleWorkshopExpanded = (workshopId: string) => {
    const newExpanded = new Set(expandedWorkshops);
    if (newExpanded.has(workshopId)) {
      newExpanded.delete(workshopId);
    } else {
      newExpanded.add(workshopId);
    }
    setExpandedWorkshops(newExpanded);
  };

  useEffect(() => {
    if (session && session.user && session.user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchEnrollments();
  }, [session, router]);

  const toggleEnrollment = async (userId: string, workshopId: string, currentEnabled: boolean) => {
    try {
      const res = await fetch('/api/admin/enrollments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, workshopId, enabled: !currentEnabled }),
      });
      fetchEnrollments();
    } catch (error) {
      console.error('Error toggling enrollment:', error);
    }
  };

  const deleteEnrollment = async (userId: string, workshopId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta inscripción?')) return;
    try {
      const res = await fetch('/api/admin/enrollments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, workshopId }),
      });
      fetchEnrollments();
    } catch (error) {
      console.error('Error deleting enrollment:', error);
    }
  };

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const [usersRes, workshopsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/workshops'),
      ]);

      const usersData = await usersRes.json();
      const workshopsData = await workshopsRes.json();

      setUsers(usersData);

      // Fetch enrollments for each user
      const enrollmentsMap: Record<string, any[]> = {};
      await Promise.all(usersData.map(async (u: User) => {
        const res = await fetch(`/api/user?id=${u._id}`);
        const data = await res.json();
        enrollmentsMap[u._id] = data.user?.enrollments || [];
      }));
      setUserEnrollments(enrollmentsMap);

      // Fetch students for each workshop
      const workshopsWithStudents = await Promise.all(
        workshopsData.map(async (w: Workshop) => {
          const students = usersData.filter((u: User) => {
            if (!u || !u._id || !Array.isArray(enrollmentsMap[u._id])) return false;
            return enrollmentsMap[u._id].some(e => e && e.workshop && e.workshop._id === w._id);
          });
          return { ...w, students };
        })
      );
      setWorkshops(workshopsWithStudents);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session || !session.user || session.user.role !== 'admin') {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AdminNavBar title="Visualizar Inscripciones" backLink="/admin" />

      {loading ? (
        <div className="max-w-7xl mx-auto p-8 text-center">
          <div className="text-xl text-gray-600">Cargando inscripciones...</div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto p-8">
          {/* Refresh Button */}
          <div className="mb-6">
            <button
              onClick={() => fetchEnrollments()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow-md transition duration-200"
            >
              🔄 Actualizar
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab('students')}
              className={`px-6 py-3 font-bold rounded-lg transition duration-200 ${
                activeTab === 'students'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              👤 Talleres por Estudiante
            </button>
            <button
              onClick={() => setActiveTab('workshops')}
              className={`px-6 py-3 font-bold rounded-lg transition duration-200 ${
                activeTab === 'workshops'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              🎭 Estudiantes por Taller
            </button>
          </div>

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Talleres por Estudiante</h2>
              
              {/* Search Filter */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="🔍 Buscar estudiante por nombre o email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              {users.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-lg text-center text-gray-600">
                  No hay estudiantes registrados
                </div>
              ) : (
                <div className="grid gap-4">
                  {users
                    .filter(user =>
                      `${user.firstName} ${user.lastName} ${user.email}`
                        .toLowerCase()
                        .includes(studentSearch.toLowerCase())
                    )
                    .map(user => (
                    <div key={user._id} className="bg-white rounded-xl shadow-lg border-l-4 border-indigo-600 overflow-hidden">
                      <button
                        onClick={() => toggleStudentExpanded(user._id)}
                        className="w-full p-6 text-left hover:bg-gray-50 transition duration-200"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-gray-600">{user.email}</p>
                          </div>
                          <div className="text-2xl">
                            {expandedStudents.has(user._id) ? '▼' : '▶'}
                          </div>
                        </div>
                      </button>

                      {expandedStudents.has(user._id) && (
                        <div className="px-6 pb-6 border-t-2 border-gray-100">
                          {userEnrollments[user._id] && userEnrollments[user._id].length > 0 ? (
                            <div className="grid gap-2">
                              {userEnrollments[user._id]
                                .filter(enrollment => enrollment && enrollment.workshop && enrollment.workshop.name && enrollment.workshop._id)
                                .map((enrollment, idx) => (
                                  <div key={enrollment.workshop._id + '-' + idx} className="flex items-center justify-between bg-indigo-50 p-3 rounded-lg">
                                    <div>
                                      <p className="font-semibold text-gray-900">{enrollment.workshop.name}</p>
                                      <p className="text-sm text-gray-600">
                                        Inscrito el: {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString('es-ES') : 'Fecha desconocida'}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                        enrollment.status === 'current'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {enrollment.status === 'current' ? 'Activo' : 'Finalizado'}
                                      </span>
                                      <button
                                        onClick={() => toggleEnrollment(user._id, enrollment.workshop._id, enrollment.enabled)}
                                        className={`px-3 py-1 rounded text-white text-sm font-semibold transition duration-200 ${
                                          enrollment.enabled
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-yellow-600 hover:bg-yellow-700'
                                        }`}
                                      >
                                        {enrollment.enabled ? '✓ Habilitado' : '✗ Deshabilitado'}
                                      </button>
                                      <button
                                        onClick={() => deleteEnrollment(user._id, enrollment.workshop._id)}
                                        className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition duration-200"
                                      >
                                        Eliminar
                                      </button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                      ) : (
                        <p className="text-gray-600 italic">Sin talleres inscritos</p>
                      )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Workshops Tab */}
          {activeTab === 'workshops' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Estudiantes por Taller</h2>

              {/* Search Filter */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="🔍 Buscar taller por nombre..."
                  value={workshopSearch}
                  onChange={(e) => setWorkshopSearch(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              {workshops.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-lg text-center text-gray-600">
                  No hay talleres registrados
                </div>
              ) : (
                <div className="grid gap-6">
                  {workshops
                    .filter(workshop =>
                      workshop.name.toLowerCase().includes(workshopSearch.toLowerCase())
                    )
                    .map(workshop => (
                    <div key={workshop._id} className="bg-white rounded-xl shadow-lg border-t-4 border-indigo-600 overflow-hidden">
                      <button
                        onClick={() => toggleWorkshopExpanded(workshop._id)}
                        className="w-full p-6 text-left hover:bg-gray-50 transition duration-200"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">{workshop.name}</h3>
                            <p className="text-gray-600 mt-1">{workshop.description}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-indigo-600">
                                {workshop.students.length}/{workshop.capacity}
                              </p>
                              <p className="text-sm text-gray-600">inscritos</p>
                            </div>
                            <div className="text-2xl">
                              {expandedWorkshops.has(workshop._id) ? '▼' : '▶'}
                            </div>
                          </div>
                        </div>
                      </button>

                      {expandedWorkshops.has(workshop._id) && (
                        <div className="px-6 pb-6 border-t-2 border-gray-100">
                          {workshop.students && workshop.students.length > 0 ? (
                        <div className="grid gap-2">
                          {workshop.students.map((student, idx) => {
                            if (!student || !student._id || !Array.isArray(student.enrollments)) return null;
                            const enrollment = student.enrollments.find(e => e && e.workshop && e.workshop._id === workshop._id);
                            if (!enrollment) return null;
                            return (
                              <div key={student._id} className="flex items-center justify-between bg-indigo-50 p-3 rounded-lg">
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {student.firstName} {student.lastName}
                                  </p>
                                  <p className="text-sm text-gray-600">{student.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    enrollment.enabled
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {enrollment.enabled ? '✓ Habilitado' : '✗ Deshabilitado'}
                                  </span>
                                  <button
                                    onClick={() => toggleEnrollment(student._id, workshop._id, enrollment.enabled)}
                                    className={`px-3 py-1 rounded text-white text-sm font-semibold transition duration-200 ${
                                      enrollment.enabled
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-yellow-600 hover:bg-yellow-700'
                                    }`}
                                  >
                                    {enrollment.enabled ? 'Deshabilitar' : 'Habilitar'}
                                  </button>
                                  <button
                                    onClick={() => deleteEnrollment(student._id, workshop._id)}
                                    className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition duration-200"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-600 italic">Sin estudiantes inscritos</p>
                      )}                        </div>
                      )}                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
