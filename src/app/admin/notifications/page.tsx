'use client';

import { useEffect, useState } from 'react';
import AdminNavBar from '@/components/AdminNavBar';
import Toast from '@/components/Toast';

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

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'payment-reminder';
  sentTo: Array<{ user: User; read: boolean }>;
  createdBy: User;
  targetWorkshop?: Workshop;
  dueDate?: string;
  metadata?: any;
  sent: boolean;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'payment-reminder',
    targetWorkshop: '',
    dueDate: '',
  });

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
    fetchWorkshops();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications');
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setToast({ type: 'error', message: 'Error cargando notificaciones' });
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchWorkshops = async () => {
    try {
      const response = await fetch('/api/admin/workshops');
      const data = await response.json();
      setWorkshops(data || []);
    } catch (error) {
      console.error('Error fetching workshops:', error);
    }
  };

  const handleOpenModal = (notification?: NotificationItem) => {
    if (notification) {
      setEditingId(notification._id);
      setFormData({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        targetWorkshop: notification.targetWorkshop?._id || '',
        dueDate: notification.dueDate ? notification.dueDate.split('T')[0] : '',
      });
      setSelectedUsers(notification.sentTo.map((st) => st.user._id));
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        message: '',
        type: 'info',
        targetWorkshop: '',
        dueDate: '',
      });
      setSelectedUsers([]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setToast({ type: 'error', message: 'El título es obligatorio.' });
      return;
    }
    if (!formData.message.trim()) {
      setToast({ type: 'error', message: 'El mensaje es obligatorio.' });
      return;
    }
    if (selectedUsers.length === 0) {
      setToast({ type: 'error', message: 'Selecciona al menos un usuario.' });
      return;
    }

    try {
      const url = editingId
        ? `/api/admin/notifications/${editingId}`
        : '/api/admin/notifications';
      const method = editingId ? 'PUT' : 'POST';

      const body = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        targetWorkshop: formData.targetWorkshop || undefined,
        dueDate: formData.dueDate || undefined,
        targetUserIds: selectedUsers,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to save');

      setToast({ type: 'success', message: editingId ? 'Notificación actualizada' : 'Notificación creada' });
      await fetchNotifications();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving notification:', error);
      setToast({ type: 'error', message: 'Error guardando notificación' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta notificación?')) return;

    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setToast({ type: 'success', message: 'Notificación eliminada' });
      await fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      setToast({ type: 'error', message: 'Error eliminando notificación' });
    }
  };

  if (loading) return <div className="p-4">Cargando...</div>;

  return (
    <div className="min-h-screen bg-white">
      <AdminNavBar title="Notificaciones" />
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Nueva Notificación
          </button>
        </div>

        <div className="grid gap-4">
          {notifications.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No hay notificaciones</p>
          ) : (
            notifications.map((notif) => (
              <div key={notif._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900">{notif.title}</h2>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs text-white mt-1 ${
                        notif.type === 'success'
                          ? 'bg-green-600'
                          : notif.type === 'warning'
                          ? 'bg-yellow-600'
                          : notif.type === 'payment-reminder'
                          ? 'bg-red-600'
                          : 'bg-blue-600'
                      }`}
                    >
                      {notif.type}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-gray-700 mb-3">{notif.message}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-sm">
                  <div>
                    <span className="text-gray-600">Enviada a:</span>
                    <p className="text-gray-900 font-medium">{notif.sentTo.length} usuarios</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Leídas:</span>
                    <p className="text-gray-900 font-medium">
                      {notif.sentTo.filter((st) => st.read).length}/{notif.sentTo.length}
                    </p>
                  </div>
                  {notif.targetWorkshop && (
                    <div>
                      <span className="text-gray-600">Taller:</span>
                      <p className="text-gray-900 font-medium">{notif.targetWorkshop.name}</p>
                    </div>
                  )}
                  {notif.dueDate && (
                    <div>
                      <span className="text-gray-600">Vencimiento:</span>
                      <p className="text-gray-900 font-medium">
                        {new Date(notif.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(notif)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(notif._id)}
                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                {editingId ? 'Editar Notificación' : 'Nueva Notificación'}
              </h2>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Título"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500"
                />

                <textarea
                  placeholder="Mensaje"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500"
                  rows={4}
                />

                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 rounded text-gray-900"
                >
                  <option value="info">Info</option>
                  <option value="success">Éxito</option>
                  <option value="warning">Advertencia</option>
                  <option value="payment-reminder">Recordatorio Pago</option>
                </select>

                <select
                  value={formData.targetWorkshop}
                  onChange={(e) => setFormData({ ...formData, targetWorkshop: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-gray-900"
                >
                  <option value="">-- Sin taller específico --</option>
                  {workshops.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-gray-900"
                />

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">
                    Selecciona usuarios (obligatorio)
                  </label>
                  <select
                    multiple
                    value={selectedUsers}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
                      setSelectedUsers(selected);
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900 h-40"
                  >
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.firstName} {u.lastName} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-sm text-gray-600">
                  Usuarios seleccionados: {selectedUsers.length}
                </p>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Guardar
                </button>
                <button
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
}
