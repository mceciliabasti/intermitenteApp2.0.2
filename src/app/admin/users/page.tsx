'use client';

import { useState, useEffect } from 'react';
import AdminNavBar from '@/components/AdminNavBar';

interface User {
  _id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phone: string;
  dni: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [enrollModalUser, setEnrollModalUser] = useState<any | null>(null);
  const [availableWorkshops, setAvailableWorkshops] = useState<any[]>([]);
  const [userModalData, setUserModalData] = useState<any | null>(null); // unified user data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student',
    firstName: '',
    lastName: '',
    phone: '',
    dni: '',
  });

  useEffect(() => {
    fetchUsers();
    fetch('/api/workshops')
      .then((r) => r.json())
      .then((data) => setAvailableWorkshops(Array.isArray(data) ? data : []))
      .catch(() => setAvailableWorkshops([]));
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingUser ? 'PUT' : 'POST';
    const url = editingUser ? `/api/admin/users/${editingUser._id}` : '/api/admin/users';
    const body = editingUser ? { ...formData, password: formData.password || undefined } : formData;

    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      fetchUsers();
      setShowForm(false);
      setEditingUser(null);
      setFormData({ email: '', password: '', role: 'student', firstName: '', lastName: '', phone: '', dni: '' });
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      dni: user.dni,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const openEnrollModal = (user: any) => {
    setEnrollModalUser(user);
    fetch(`/api/user?id=${user._id}`)
      .then(r => r.json())
      .then(data => setUserModalData(data.user ? data : null))
      .catch(() => setUserModalData(null));
  };

  const closeEnrollModal = () => {
    setEnrollModalUser(null);
    setUserModalData(null);
  };

  const toggleEnrollment = async (userId: string, workshopId: string, enabled: boolean) => {
    try {
      await fetch('/api/admin/enrollments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, workshopId, enabled }),
      });
      // Refresh modal data
      openEnrollModal({ _id: userId });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling enrollment:', error);
    }
  };

  const enrollUser = async (userId: string, workshopId: string) => {
    try {
      // Always use absolute path
      const url = '/api/admin/enroll';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, workshopId }),
      });
      let data = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error('Failed to parse JSON:', jsonErr);
      }
      if (!res.ok) {
        // Log full response for debugging
        console.error('Enroll API error:', {
          status: res.status,
          statusText: res.statusText,
          url,
          body: { userId, workshopId },
          response: data
        });
        alert((data && data.error) || `Error al inscribir usuario (HTTP ${res.status})`);
      } else {
        // Refresh modal data
        openEnrollModal({ _id: userId });
      }
      fetchUsers();
    } catch (error) {
      alert('Error al inscribir usuario');
      console.error('Error enrolling user:', error);
    }
  };

  const deleteEnrollment = async (userId: string, workshopId: string) => {
    try {
      await fetch('/api/admin/enrollments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, workshopId }),
      });
      // Refresh modal data
      openEnrollModal({ _id: userId });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting enrollment:', error);
    }
  };

  function groupPaymentsByWorkshop(payments: any[]) {
    const map: Record<string, any[]> = {};
    for (const p of payments) {
      const name = p.workshop?.name || 'Taller desconocido';
      if (!map[name]) map[name] = [];
      // deduplicate by installmentNumber
      if (!map[name].some(x => x.installmentNumber === p.installmentNumber)) {
        map[name].push(p);
      }
    }
    Object.keys(map).forEach(k => map[k].sort((a,b) => a.installmentNumber - b.installmentNumber));
    return map;
  }

  const fetchPaymentsForUser = async (userId: string) => {
    // Deprecated: payments now come from userModalData
    // No-op
  };

  const togglePaymentStatus = async (paymentId: string, paid: boolean) => {
    try {
      await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, paid }),
      });
      // Refresh modal data
      if (enrollModalUser) openEnrollModal({ _id: enrollModalUser._id });
    } catch (error) {
      console.error('Error toggling payment status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AdminNavBar 
        title="Gestionar Usuarios" 
        backLink="/admin"
        actionButton={{
          label: '+ Nuevo Usuario',
          onClick: () => setShowForm(true)
        }}
      />

      <div className="max-w-7xl mx-auto p-8">
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-l-4 border-indigo-600">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700">Nombre</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Apellido</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Email</label>
                  <input
                    type="email"
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Contraseña {editingUser ? '(dejar vacío para no cambiar)' : ''}</label>
                  <input
                    type="password"
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? '••••••••' : ''}
                    {...(!editingUser && { required: true })}
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Teléfono</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">DNI</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={formData.dni}
                    onChange={e => setFormData({ ...formData, dni: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Rol</label>
                  <select
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    required
                  >
                    <option value="student">Estudiante</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded" style={{color:'#fff'}}>
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
                <button type="button" className="bg-gray-300 text-gray-800 px-6 py-2 rounded" onClick={() => { setShowForm(false); setEditingUser(null); setFormData({ email: '', password: '', role: 'student', firstName: '', lastName: '', phone: '', dni: '' }); }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Teléfono</th>
                  <th className="px-4 py-2 text-left">DNI</th>
                  <th className="px-4 py-2 text-left">Rol</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b">
                    <td className="px-4 py-2 text-gray-900">{user.firstName} {user.lastName}</td>
                    <td className="px-4 py-2 text-gray-900">{user.email}</td>
                    <td className="px-4 py-2 text-gray-900">{user.phone}</td>
                    <td className="px-4 py-2 text-gray-900">{user.dni}</td>
                    <td className="px-4 py-2 text-gray-900">{user.role}</td>
                    <td className="px-4 py-2">
                      <button className="mr-2 px-3 py-1 bg-indigo-500 text-white rounded" onClick={() => handleEdit(user)}>Editar</button>
                      <button className="mr-2 px-3 py-1 bg-red-500 text-white rounded" onClick={() => handleDelete(user._id)}>Eliminar</button>
                      <button className="px-3 py-1 bg-green-500 text-white rounded" onClick={() => openEnrollModal(user)}>Ver Inscripciones/Pagos</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {enrollModalUser && userModalData && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Inscripciones — {userModalData.user.firstName} {userModalData.user.lastName}</h3>
                  <button onClick={closeEnrollModal} className="text-gray-500">Cerrar</button>
                </div>
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Inscripciones actuales</h4>
                  <div className="space-y-2">
                    {(userModalData.user.enrollments || []).map((en: any) => (
                      <div key={en.workshop._id || en.workshop} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-semibold">{en.workshop?.name || en.workshop}</div>
                          <div className="text-sm text-gray-600">Estado: {en.status} • Habilitado: {en.enabled ? 'Sí' : 'No'}</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => {
                            const userId = userModalData?.user?._id || enrollModalUser?._id;
                            if (!userId) {
                              alert('ID de usuario no válido. No se puede cambiar el estado de inscripción.');
                              console.error('Intento de habilitar/deshabilitar con userId inválido:', userModalData?.user, enrollModalUser);
                              return;
                            }
                            toggleEnrollment(userId, String(en.workshop._id || en.workshop), !en.enabled);
                          }} className="px-3 py-1 bg-yellow-400 rounded">{en.enabled ? 'Deshabilitar' : 'Habilitar'}</button>
                          <button onClick={() => {
                            const userId = userModalData?.user?._id || enrollModalUser?._id;
                            if (!userId) {
                              alert('ID de usuario no válido. No se puede eliminar la inscripción.');
                              console.error('Intento de eliminar inscripción con userId inválido:', userModalData?.user, enrollModalUser);
                              return;
                            }
                            deleteEnrollment(userId, String(en.workshop._id || en.workshop));
                          }} className="px-3 py-1 bg-red-500 text-white rounded">Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Agregar nueva inscripción</h4>
                  <div className="flex gap-2">
                    <select id="add-workshop-select" className="flex-1 px-3 py-2 border rounded">
                      <option value="">Seleccionar taller</option>
                      {availableWorkshops.map((w) => (
                        <option key={w._id} value={w._id}>{w.name}</option>
                      ))}
                    </select>
                    <button onClick={() => {
                      const sel = (document.getElementById('add-workshop-select') as HTMLSelectElement);
                      // Use userModalData.user._id, fallback to enrollModalUser._id
                      const userId = userModalData?.user?._id || enrollModalUser?._id;
                      if (!userId) {
                        alert('ID de usuario no válido. No se puede inscribir.');
                        console.error('Intento de inscripción con userId inválido:', userModalData?.user, enrollModalUser);
                        return;
                      }
                      if (sel && sel.value) {
                        console.log('Inscribiendo usuario:', userId, 'en taller:', sel.value);
                        enrollUser(userId, sel.value);
                      }
                    }} className="px-4 py-2 bg-green-600 text-white rounded">Inscribir</button>
                  </div>
                </div>
                <div className="mt-6">
                  {userModalData.user.role !== 'admin' && (
                    <>
                      <h4 className="font-semibold mb-3">Pagos</h4>
                      {(() => {
                        // Only show payments for enrolled workshops
                        const enrolledWorkshopIds = new Set((userModalData.user.enrollments || []).map((en: any) => String(en.workshop._id || en.workshop)));
                        const filteredPayments = (userModalData.payments || []).filter((p: any) => p.workshop && enrolledWorkshopIds.has(String(p.workshop._id || p.workshop)));
                        if (filteredPayments.length === 0) {
                          return <p className="text-gray-600">No hay pagos registrados para este usuario.</p>;
                        }
                        return (
                          <div className="space-y-3">
                            {Object.entries(groupPaymentsByWorkshop(filteredPayments)).map(([workshopName, items]: any) => (
                              <div key={workshopName} className="p-3 border rounded">
                                <div className="flex justify-between items-center mb-2">
                                  <div className="font-semibold">{workshopName}</div>
                                  <div className="text-sm text-gray-600">{items.length} cuotas</div>
                                </div>
                                <div className="space-y-2">
                                  {items.map((p: any) => (
                                    <div key={p._id} className="flex items-center justify-between">
                                      <div>
                                        <div className="text-sm">Cuota {p.installmentNumber} — ${p.amount.toFixed(2)}</div>
                                        <div className="text-xs text-gray-500">Vence: {new Date(p.dueDate).toLocaleDateString()}</div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className={`px-2 py-1 rounded text-sm ${p.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.paid ? 'Pagado' : 'Pendiente'}</div>
                                        <button onClick={() => togglePaymentStatus(p._id, !p.paid)} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">{p.paid ? 'Marcar no pagado' : 'Marcar pagado'}</button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          {users.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No hay usuarios creados. ¡Crea uno para comenzar!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}