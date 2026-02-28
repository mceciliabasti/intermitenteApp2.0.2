'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AdminNavBar from '@/components/AdminNavBar';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Workshop {
  _id: string;
  name: string;
}

export default function EnrollPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedWorkshops, setSelectedWorkshops] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchWorkshops();
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

  const fetchWorkshops = async () => {
    try {
      const res = await fetch('/api/admin/workshops');
      const data = await res.json();
      setWorkshops(data);
    } catch (error) {
      console.error('Error fetching workshops:', error);
    }
  };

  const handleEnroll = async () => {
    if (!selectedUser || selectedWorkshops.length === 0) {
      setMessage({ type: 'error', text: 'Por favor selecciona un usuario y al menos un taller' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser, workshopIds: selectedWorkshops }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: '✓ Usuario inscrito exitosamente' });
        setSelectedUser('');
        setSelectedWorkshops([]);
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Error al inscribir el usuario' });
      }
    } catch (error) {
      console.error('Error enrolling user:', error);
      setMessage({ type: 'error', text: 'Error al inscribir el usuario' });
    } finally {
      setLoading(false);
    }
  };

  const selectedUserData = users.find(u => u._id === selectedUser);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AdminNavBar title="Inscribir Usuarios" backLink="/admin" />

      <div className="max-w-2xl mx-auto p-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg font-semibold ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border-l-4 border-green-500' 
              : 'bg-red-100 text-red-800 border-l-4 border-red-500'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-indigo-600">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Selecciona un Usuario y un Taller</h2>

          <div className="space-y-6">
            {/* User Selection */}
            <div>
              <label className="block text-gray-700 font-semibold mb-3">👤 Usuario</label>
              <select 
                value={selectedUser} 
                onChange={(e) => setSelectedUser(e.target.value)} 
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
              >
                <option value="">- Selecciona un usuario -</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Workshop Selection */}
            <div>
              <label className="block text-gray-700 font-semibold mb-3">🎭 Taller (Selecciona uno o varios)</label>
                <div className="grid gap-2 max-h-56 overflow-auto border-2 border-gray-200 rounded-lg p-3">
                  {workshops.map(w => (
                    <label key={w._id} className="flex items-center gap-3">
                      <input type="checkbox" checked={selectedWorkshops.includes(w._id)} onChange={(e) => {
                        if (e.target.checked) setSelectedWorkshops(prev => [...prev, w._id]);
                        else setSelectedWorkshops(prev => prev.filter(id => id !== w._id));
                      }} className="w-4 h-4" />
                      <span className="text-gray-700">{w.name}</span>
                    </label>
                  ))}
                </div>
            </div>

            {/* Selection Summary */}
            {selectedUser && selectedWorkshops.length > 0 && (
              <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded-lg">
                <p className="text-gray-900 font-semibold">Resumen de inscripción:</p>
                <p className="text-gray-700 mt-2">
                  <strong>Usuario:</strong> {selectedUserData?.firstName} {selectedUserData?.lastName}
                </p>
                <p className="text-gray-700">
                  <strong>Talleres:</strong> {workshops.filter(w => selectedWorkshops.includes(w._id)).map(w => w.name).join(', ')}
                </p>
              </div>
            )}

            {/* Enroll Button */}
            <button 
              onClick={handleEnroll}
              disabled={loading || !selectedUser || selectedWorkshops.length === 0}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Inscribiendo...' : '✓ Inscribir Usuario'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}