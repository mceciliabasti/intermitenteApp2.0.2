"use client";
import AdminNavBar from '@/components/AdminNavBar';
import { useEffect, useState } from 'react';

interface Workshop {
  _id: string;
  name: string;
  installments: number;
}
interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}
interface Payment {
  _id: string;
  user: string;
  workshop: string;
  installmentNumber: number;
  paid: boolean;
}

export default function AdminAccreditPaymentsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [studentsByWorkshop, setStudentsByWorkshop] = useState<Record<string, Student[]>>({});
  const [paymentsByWorkshop, setPaymentsByWorkshop] = useState<Record<string, Payment[]>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({}); // workshopId -> saving state
  const [selected, setSelected] = useState<Record<string, Record<string, boolean>>>({}); // workshopId -> paymentId -> paid
  const [success, setSuccess] = useState<Record<string, boolean>>({}); // workshopId -> success state
  const [error, setError] = useState<Record<string, string>>({}); // workshopId -> error message

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    const ws = await fetch('/api/admin/workshops');
    const workshopsData = await ws.json();
    setWorkshops(workshopsData);
    for (const w of workshopsData) {
      fetchStudents(w._id);
      fetchPayments(w._id);
    }
  };

  const fetchStudents = async (workshopId: string) => {
    const res = await fetch(`/api/admin/workshops/${workshopId}/students`);
    const data = await res.json();
    setStudentsByWorkshop(prev => ({ ...prev, [workshopId]: data }));
  };

  const fetchPayments = async (workshopId: string) => {
    const res = await fetch(`/api/admin/workshops/${workshopId}/payments`);
    const data = await res.json();
    // Deduplicate payments by user and installmentNumber
    const deduped: Payment[] = [];
    const seen = new Set<string>();
    for (const p of data) {
      const key = `${p.user}_${p.installmentNumber}`;
      if (!seen.has(key)) {
        deduped.push(p);
        seen.add(key);
      }
    }
    setPaymentsByWorkshop(prev => ({ ...prev, [workshopId]: deduped }));
  };

  const handleToggle = (workshopId: string, paymentId: string, paid: boolean) => {
    setSelected(prev => ({
      ...prev,
      [workshopId]: {
        ...(prev[workshopId] || {}),
        [paymentId]: !paid,
      },
    }));
    // Limpiar feedback al cambiar selección
    setSuccess(prev => ({ ...prev, [workshopId]: false }));
    setError(prev => ({ ...prev, [workshopId]: '' }));
  };

  const handleSave = async (workshopId: string) => {
    setSaving(prev => ({ ...prev, [workshopId]: true }));
    setSuccess(prev => ({ ...prev, [workshopId]: false }));
    setError(prev => ({ ...prev, [workshopId]: '' }));
    try {
      const updates = Object.entries(selected[workshopId] || {})
        .map(([paymentId, paid]) => fetch('/api/admin/payments', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId, paid }),
        }));
      await Promise.all(updates);
      await fetchPayments(workshopId);
      setSuccess(prev => ({ ...prev, [workshopId]: true }));
      setSelected(prev => ({ ...prev, [workshopId]: {} }));
    } catch (e) {
      setError(prev => ({ ...prev, [workshopId]: 'Error al guardar. Intenta nuevamente.' }));
    }
    setSaving(prev => ({ ...prev, [workshopId]: false }));
  };

  return (
    <div>
      <AdminNavBar title="Acreditar pagos" />
      <div className="p-8">
        {workshops.map(w => (
          <div key={w._id} className="mb-12 border border-gray-200 rounded-lg shadow-sm p-6 bg-white">
            <h2 className="text-xl font-bold mb-4 text-indigo-700">{w.name}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                    {[...Array(w.installments)].map((_, i) => (
                      <th key={i} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cuota {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(studentsByWorkshop[w._id] || []).map(student => (
                    <tr key={student._id} className="hover:bg-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {student.firstName} {student.lastName}
                      </td>
                      {[...Array(w.installments)].map((_, i) => {
                        const payment = (paymentsByWorkshop[w._id] || []).find(p => p.user === student._id && p.installmentNumber === i + 1);
                        const paid = payment ? (selected[w._id]?.[payment._id] ?? payment.paid) : false;
                        return (
                          <td key={i} className="px-2 py-2">
                            {payment ? (
                              <div className="flex items-center gap-2">
                                <span className={paid ? "bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold" : "bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold"}>
                                  {paid ? "Pagado" : "Pendiente"}
                                </span>
                                <button
                                  className={paid
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs font-semibold"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs font-semibold"
                                  }
                                  style={{color:'#fff', WebkitTextFillColor:'#fff', textShadow:'0 0 0 #fff'}}
                                  disabled={saving[w._id] ? true : false}
                                  onClick={() => handleToggle(w._id, payment._id, paid)}
                                >
                                  {paid ? "Marcar no pagado" : "Marcar pagado"}
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">Sin pago</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <button
                className="bg-green-600 text-white px-6 py-2 rounded-lg shadow-md disabled:opacity-50"
                style={{color:'#fff'}}
                disabled={saving[w._id] || !selected[w._id] || Object.keys(selected[w._id]).length === 0}
                onClick={() => handleSave(w._id)}
              >
                {saving[w._id] ? 'Guardando...' : 'Guardar cambios'}
              </button>
              {success[w._id] && <span className="text-green-600 font-semibold">¡Guardado!</span>}
              {error[w._id] && <span className="text-red-600 font-semibold">{error[w._id]}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
