'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import StudentNavBar from '@/components/StudentNavBar';

interface SentToUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'payment-reminder';
  sentTo: Array<{ user: SentToUser; read: boolean; readAt?: string }>;
  createdBy: { firstName: string; lastName: string };
  targetWorkshop?: { _id: string; name: string };
  dueDate?: string;
  metadata?: {
    workshopId?: string;
    installmentNumber?: number;
    amount?: number;
    surcharge?: number;
  };
  createdAt: string;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setMarkingId(notificationId);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error || 'Failed to mark as read');
      }
      await fetchNotifications();
    } catch (error: any) {
      setErrorMsg(error?.message || 'Error al marcar como leído');
      console.error('Error marking as read:', error);
    } finally {
      setMarkingId(null);
    }
  };

  // Find the current user's read status for each notification
  const getUserReadStatus = (notification: NotificationItem): boolean => {
    if (!session?.user?.email) return false;
    const userEntry = notification.sentTo.find(
      (st) => st.user.email === session.user.email
    );
    return userEntry?.read || false;
  } 

  // Remove notification for this user
  const deleteNotification = async (notificationId: string) => {
    setMarkingId(notificationId);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error || 'Failed to delete notification');
      }
      await fetchNotifications();
    } catch (error: any) {
      setErrorMsg(error?.message || 'Error al eliminar notificación');
      console.error('Error deleting notification:', error);
    } finally {
      setMarkingId(null);
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    const isRead = getUserReadStatus(notif);
    if (filter === 'unread') return !isRead;
    if (filter === 'read') return isRead;
    return true;
  });

  if (loading) return <div className="p-4">Cargando notificaciones...</div>;

  return (
    <div className="min-h-screen bg-white">
      <StudentNavBar />
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Mis Notificaciones</h1>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              No leídas (
              {notifications.filter((n) => !getUserReadStatus(n)).length})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 rounded ${
                filter === 'read'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              Leídas ({notifications.filter((n) => getUserReadStatus(n)).length})
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              {filter === 'all' && 'No tienes notificaciones'}
              {filter === 'unread' && 'No tienes notificaciones sin leer'}
              {filter === 'read' && 'No tienes notificaciones leídas'}
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isRead = getUserReadStatus(notif);
              return (
                <div
                  key={notif._id}
                  className={`border rounded-lg p-4 ${
                    isRead
                      ? 'border-gray-200 bg-white'
                      : 'border-blue-400 bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900">
                          {notif.title}
                        </h2>
                        {!isRead && (
                          <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Enviada por {notif.createdBy.firstName} {notif.createdBy.lastName}
                      </p>
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded text-white text-sm font-semibold ${
                        notif.type === 'success'
                          ? 'bg-green-600'
                          : notif.type === 'warning'
                          ? 'bg-yellow-600'
                          : notif.type === 'payment-reminder'
                          ? 'bg-red-600'
                          : 'bg-blue-600'
                      }`}
                    >
                      {notif.type === 'payment-reminder'
                        ? '💳 Pago'
                        : notif.type === 'success'
                        ? '✓ Éxito'
                        : notif.type === 'warning'
                        ? '⚠️ Advertencia'
                        : 'ℹ️ Info'}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-3">{notif.message}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 text-sm">
                    <div>
                      <span className="text-gray-600">Fecha:</span>
                      <p className="text-gray-900 font-medium">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {notif.targetWorkshop && (
                      <div>
                        <span className="text-gray-600">Taller:</span>
                        <p className="text-gray-900 font-medium">
                          {notif.targetWorkshop.name}
                        </p>
                      </div>
                    )}
                    {notif.metadata?.workshopId && (
                      <div>
                        <span className="text-gray-600">Cuota:</span>
                        <p className="text-gray-900 font-medium">
                          #{notif.metadata.installmentNumber}
                        </p>
                      </div>
                    )}
                    {notif.metadata?.amount && (
                      <div>
                        <span className="text-gray-600">Monto:</span>
                        <p className="text-gray-900 font-medium">
                          ${notif.metadata.amount}
                          {notif.metadata.surcharge && notif.metadata.surcharge > 0 && (
                            <span className="text-red-600 text-xs ml-1">
                              +${notif.metadata.surcharge} (atraso)
                            </span>
                          )}
                        </p>
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
                    {!isRead && (
                      <button
                        onClick={() => markAsRead(notif._id)}
                        className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium ${markingId === notif._id ? 'opacity-60 cursor-not-allowed' : ''}`}
                        disabled={markingId === notif._id}
                      >
                        {markingId === notif._id ? 'Marcando...' : 'Marcar como leído'}
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notif._id)}
                      className={`bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm font-medium ${markingId === notif._id ? 'opacity-60 cursor-not-allowed' : ''}`}
                      disabled={markingId === notif._id}
                    >
                      {markingId === notif._id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                  {errorMsg && (
                    <div className="text-red-600 text-xs mt-2">{errorMsg}</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
