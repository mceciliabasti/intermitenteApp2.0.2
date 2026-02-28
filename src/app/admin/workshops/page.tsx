'use client';

import { useState, useEffect } from 'react';
import AdminNavBar from '@/components/AdminNavBar';

interface Workshop {
  _id: string;
  name: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  capacity: number;
  instructor: string;
  installments: number;
  enabled: boolean;
  picture: string;
}

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [studentsModal, setStudentsModal] = useState<{workshop: Workshop, students: any[]} | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    picture: '',
    type: 'quarterly',
    startDate: '',
    endDate: '',
    capacity: 0,
    instructor: '',
    installments: 1,
    enabled: true,
  });
  const [pictureFile, setPictureFile] = useState<File | null>(null);

  const handleShowStudents = async (workshop: Workshop) => {
    try {
      const res = await fetch(`/api/admin/workshops/${workshop._id}/students`);
      let students = await res.json();
      // Sanitize: remove null/invalid entries
      if (Array.isArray(students)) {
        students = students.filter((s: any) => s && s._id);
      } else {
        students = [];
      }
      setStudentsModal({ workshop, students });
    } catch (error) {
      alert('Error al obtener alumnos');
    }
  };

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    const res = await fetch('/api/admin/workshops');
    const data = await res.json();
    setWorkshops(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingWorkshop ? 'PUT' : 'POST';
    const url = editingWorkshop ? `/api/admin/workshops/${editingWorkshop._id}` : '/api/admin/workshops';
    let pictureUrl = formData.picture;
    if (pictureFile) {
      const formDataUpload = new FormData();
      formDataUpload.append('file', pictureFile);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });
      if (!uploadRes.ok) {
        alert('Error al subir la imagen');
        return;
      }
      const uploadData = await uploadRes.json();
      // Ensure pictureUrl is always /uploads/filename
      if (uploadData.url && uploadData.url.startsWith('/uploads/')) {
        pictureUrl = uploadData.url;
      } else if (uploadData.url) {
        pictureUrl = `/uploads/${uploadData.url}`;
      } else {
        pictureUrl = '';
      }
    }
    // Ensure all required fields are present and valid
    const body = {
      name: formData.name,
      description: formData.description || '',
      picture: pictureUrl,
      type: formData.type,
      startDate: formData.startDate,
      endDate: formData.endDate,
      capacity: Number(formData.capacity),
      instructor: String(formData.instructor),
      installments: Number(formData.installments),
      enabled: !!formData.enabled,
      sections: {
        pistas: [],
        referencias: [],
        coreos: [],
        guion: [],
        vestuario: [],
      },
    };
    // Log body for debugging
    console.log('Workshop creation payload:', body);
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      alert('Error al crear el taller');
      return;
    }
    fetchWorkshops();
    setShowForm(false);
    setEditingWorkshop(null);
    setFormData({
      name: '',
      description: '',
      picture: '',
      type: 'quarterly',
      startDate: '',
      endDate: '',
      capacity: 0,
      instructor: '',
      installments: 1,
      enabled: true,
    });
    setPictureFile(null);
  };

  const handleEdit = (workshop: Workshop) => {
    setEditingWorkshop(workshop);
    setFormData({
      name: typeof workshop.name === 'string' ? workshop.name : '',
      description: typeof workshop.description === 'string' ? workshop.description : '',
      picture: typeof workshop.picture === 'string' ? workshop.picture : '',
      type: typeof workshop.type === 'string' ? workshop.type : 'quarterly',
      startDate:
        typeof workshop.startDate === 'string'
          ? (workshop.startDate.includes('T') ? workshop.startDate.split('T')[0] : workshop.startDate)
          : '',
      endDate:
        typeof workshop.endDate === 'string'
          ? (workshop.endDate.includes('T') ? workshop.endDate.split('T')[0] : workshop.endDate)
          : '',
      capacity: typeof workshop.capacity === 'number' && !isNaN(workshop.capacity) ? workshop.capacity : 0,
      instructor: typeof workshop.instructor === 'string' ? workshop.instructor : '',
      installments: typeof workshop.installments === 'number' && !isNaN(workshop.installments) ? workshop.installments : 1,
      enabled: typeof workshop.enabled === 'boolean' ? workshop.enabled : true,
    });
    setPictureFile(null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este taller?')) {
      await fetch(`/api/admin/workshops/${id}`, { method: 'DELETE' });
      fetchWorkshops();
    }
  };

  // Order workshops from newest to oldest by startDate
  const orderedWorkshops = [...workshops].sort((a, b) => {
    const dateA = new Date(a.startDate).getTime();
    const dateB = new Date(b.startDate).getTime();
    return dateB - dateA;
  });

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <AdminNavBar 
          title="Gestionar Talleres" 
          backLink="/admin"
          actionButton={{
            label: '+ Nuevo Taller',
            onClick: () => setShowForm(true)
          }}
        />

        <div className="max-w-7xl mx-auto p-8">
          {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-l-4 border-indigo-600">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{editingWorkshop ? 'Editar Taller' : 'Crear Nuevo Taller'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Nombre del Taller</label>
                  <input type="text" placeholder="Ej: Danza Contemporánea" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Coach</label>
                  <select
                    value={formData.instructor}
                    onChange={e => setFormData({ ...formData, instructor: e.target.value })}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  >
                    <option value="">Seleccionar coach</option>
                    <option value="Cami Rocha">Cami Rocha</option>
                    <option value="Valen Vera">Valen Vera</option>
                    <option value="Cami Rocha y Valen Vera">Cami Rocha y Valen Vera</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Foto (opcional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      setPictureFile(file);
                    }}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-semibold mb-2">Descripción</label>
                  <textarea
                    placeholder="Descripción del taller..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    required
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:border-indigo-600 resize-none ${formData.description ? 'border-gray-300' : 'border-red-500'}`}
                    rows={3}
                  ></textarea>
                  {!formData.description && <span className="text-red-600 text-xs">La descripción es obligatoria.</span>}
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Tipo</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600">
                    <option value="quarterly">Cuatrimestral</option>
                    <option value="occasional">Ocasional</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Capacidad</label>
                  <input type="number" placeholder="20" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Cuotas</label>
                  <input type="number" placeholder="4" value={formData.installments} onChange={(e) => setFormData({ ...formData, installments: parseInt(e.target.value) })} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Fecha de Inicio</label>
                  <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Fecha de Fin</label>
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600" />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" checked={formData.enabled} onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })} className="w-5 h-5 text-indigo-600 rounded" />
                  <label className="ml-3 text-gray-700 font-semibold">Habilitado</label>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-lg transition duration-200"
                  disabled={!formData.name || !formData.description || !formData.type || !formData.startDate || !formData.endDate || !formData.capacity || !formData.instructor || !formData.installments}
                >
                  Guardar
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingWorkshop(null); }} className="bg-gray-500 hover:bg-gray-600 text-white font-bold px-6 py-2 rounded-lg transition duration-200">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Foto</th>
                  <th className="px-6 py-4 text-left font-semibold">Nombre</th>
                  <th className="px-6 py-4 text-left font-semibold">Coach</th>
                  <th className="px-6 py-4 text-left font-semibold">Tipo</th>
                  <th className="px-6 py-4 text-left font-semibold">Capacidad</th>
                  <th className="px-6 py-4 text-left font-semibold">Estado</th>
                  <th className="px-6 py-4 text-left font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orderedWorkshops.map((workshop, index) => (
                  <tr key={workshop._id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b hover:bg-indigo-50 transition`}>
                    <td className="px-6 py-4">
                      {workshop.picture && typeof workshop.picture === 'string' && workshop.picture.trim() !== '' ? (
                        <img
                          src={
                            workshop.picture.startsWith('/uploads/')
                              ? workshop.picture
                              : `/uploads/${workshop.picture.replace(/^\/+/, '')}`
                          }
                          alt="Foto"
                          className="w-12 h-12 object-cover rounded"
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).src = '/default-placeholder.png';
                          }}
                        />
                      ) : (
                        <img src="/default-placeholder.png" alt="Sin foto" className="w-12 h-12 object-cover rounded opacity-60" />
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{workshop.name}</td>
                    <td className="px-6 py-4 text-gray-700">{workshop.instructor}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${workshop.type === 'quarterly' ? 'bg-blue-100 text-blue-800' : workshop.type === 'anual' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {workshop.type === 'quarterly' ? 'Cuatrimestral' : workshop.type === 'anual' ? 'Anual' : 'Ocasional'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{workshop.capacity}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${workshop.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {workshop.enabled ? '✓ Activo' : '✗ Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button onClick={() => handleEdit(workshop)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg text-sm font-bold transition duration-200" style={{color:'#fff', WebkitTextFillColor:'#fff', textShadow:'0 0 0 #fff'}}>Editar</button>
                      <button onClick={() => handleDelete(workshop._id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-bold transition duration-200" style={{color:'#fff', WebkitTextFillColor:'#fff', textShadow:'0 0 0 #fff'}}>Eliminar</button>
                      <a href={`/admin/workshops/${workshop._id}/content`} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-sm font-bold transition duration-200 inline-block" style={{color:'#fff', WebkitTextFillColor:'#fff', textShadow:'0 0 0 #fff'}}>Materiales</a>
                      <button onClick={() => handleShowStudents(workshop)} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-bold transition duration-200" style={{color:'#fff', WebkitTextFillColor:'#fff', textShadow:'0 0 0 #fff'}}>Ver alumnos</button>
                    </td>
                        {studentsModal && (
                          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">Alumnos inscriptos — {studentsModal.workshop.name}</h3>
                                <button onClick={() => setStudentsModal(null)} className="text-gray-500">Cerrar</button>
                              </div>
                              {Array.isArray(studentsModal.students) && studentsModal.students.filter((student: any) => student && student._id).length === 0 ? (
                                <p className="text-gray-600">No hay alumnos inscriptos en este taller.</p>
                              ) : Array.isArray(studentsModal.students) ? (
                                <table className="w-full">
                                  <thead>
                                    <tr>
                                      <th className="px-4 py-2 text-left">Nombre</th>
                                      <th className="px-4 py-2 text-left">Email</th>
                                      <th className="px-4 py-2 text-left">Teléfono</th>
                                      <th className="px-4 py-2 text-left">DNI</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {studentsModal.students
                                      .filter((student: any) => student && student._id)
                                      .map((student: any) => (
                                        <tr key={student._id} className="border-b">
                                          <td className="px-4 py-2 text-gray-900">{student.firstName} {student.lastName}</td>
                                          <td className="px-4 py-2 text-gray-900">{student.email}</td>
                                          <td className="px-4 py-2 text-gray-900">{student.phone}</td>
                                          <td className="px-4 py-2 text-gray-900">{student.dni}</td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p className="text-gray-600">No hay alumnos inscriptos en este taller.</p>
                              )}
                            </div>
                          </div>
                        )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {workshops.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No hay talleres creados. ¡Crea uno para comenzar!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}