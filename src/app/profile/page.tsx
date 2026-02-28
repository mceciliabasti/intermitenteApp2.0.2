"use client";



import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import StudentNavBar from '@/components/StudentNavBar';

interface UserData {
  firstName: string;
  lastName: string;
  phone: string;
  dni: string;
  email: string;
}



export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [section, setSection] = useState<'view' | 'edit' | 'password'>('view');
  const [user, setUser] = useState<UserData | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dni: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Cargar datos del usuario desde la API
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/user');
        if (!res.ok) throw new Error('No se pudieron obtener los datos');
        const data = await res.json();
        setUser(data.user);
        setForm({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          phone: data.user.phone || '',
          dni: data.user.dni || '',
          email: data.user.email || '',
        });
      } catch (e) {
        setError('No se pudieron obtener los datos');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'email') return; // No permitir editar email
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          dni: form.dni,
        }),
      });
      if (!res.ok) throw new Error('Error al guardar los datos');
      setSuccess(true);
      update && update();
      setSection('view');
      // Refrescar datos
      setUser({ ...user!, ...form });
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <span className="text-lg text-gray-600">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <StudentNavBar />
      <div className="max-w-xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>
        {section === 'view' && user && (
          <div className="bg-white p-6 rounded shadow space-y-4">
            <div>
              <span className="block text-gray-700 font-semibold mb-1">Nombre</span>
              <span>{user.firstName}</span>
            </div>
            <div>
              <span className="block text-gray-700 font-semibold mb-1">Apellido</span>
              <span>{user.lastName}</span>
            </div>
            <div>
              <span className="block text-gray-700 font-semibold mb-1">Teléfono</span>
              <span>{user.phone}</span>
            </div>
            <div>
              <span className="block text-gray-700 font-semibold mb-1">DNI</span>
              <span>{user.dni}</span>
            </div>
            <div>
              <span className="block text-gray-700 font-semibold mb-1">Email</span>
              <span>{user.email}</span>
            </div>
            <div className="flex gap-4 mt-4">
              <button onClick={() => setSection('edit')} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Editar datos</button>
              <button onClick={() => setSection('password')} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">Cambiar contraseña</button>
            </div>
          </div>
        )}
        {section === 'edit' && user && (
          <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Nombre</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Apellido</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Teléfono</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">DNI</label>
              <input name="dni" value={form.dni} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Email</label>
              <input name="email" value={form.email} disabled className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-500" />
            </div>
            <div className="flex gap-4 mt-4">
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button type="button" onClick={() => setSection('view')} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Cancelar</button>
            </div>
            {success && <div className="text-green-600 mt-2">Datos actualizados correctamente.</div>}
            {error && <div className="text-red-600 mt-2">{error}</div>}
          </form>
        )}
        {section === 'password' && (
          <PasswordChange onBack={() => setSection('view')} />
        )}
      </div>
    </div>
  );
}


function PasswordChange({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({ current: '', new: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    if (form.new !== form.confirm) {
      setError('Las contraseñas nuevas no coinciden');
      setSaving(false);
      return;
    }
    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.new }),
      });
      if (!res.ok) throw new Error('Error al actualizar la contraseña');
      setSuccess(true);
      setForm({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
      <h2 className="text-lg font-bold mb-2">Actualizar contraseña</h2>
      <div>
        <label className="block text-gray-700 font-semibold mb-1">Contraseña actual</label>
        <input name="current" type="password" value={form.current} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
      </div>
      <div>
        <label className="block text-gray-700 font-semibold mb-1">Nueva contraseña</label>
        <input name="new" type="password" value={form.new} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
      </div>
      <div>
        <label className="block text-gray-700 font-semibold mb-1">Confirmar nueva contraseña</label>
        <input name="confirm" type="password" value={form.confirm} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
      </div>
      <div className="flex gap-4 mt-4">
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700" disabled={saving}>
          {saving ? 'Actualizando...' : 'Actualizar contraseña'}
        </button>
        <button type="button" onClick={onBack} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Cancelar</button>
      </div>
      {success && <div className="text-green-600 mt-2">Contraseña actualizada correctamente.</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </form>
  );
}
