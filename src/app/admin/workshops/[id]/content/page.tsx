import PDFViewer from '@/components/PDFViewer';
'use client';

import { useState, useEffect } from 'react';
import AdminNavBar from '@/components/AdminNavBar';
import Toast from '@/components/Toast';
import { useParams, useRouter } from 'next/navigation';

interface Content {
  _id: string;
  title: string;
  type: string;
  fileUrl: string;
  enabled: boolean;
  tags: string[];
}

interface Workshop {
  _id: string;
  name: string;
  sections: {
    pistas: Content[];
    referencias: Content[];
    coreos: Content[];
    guion: Content[];
    'use client';
    vestuario: Content[];
  };
}

const sectionInfo = {
  pistas: { label: '🎵 Pistas', description: 'Archivos de audio y aceleraciones' },
  referencias: { label: '📚 Referencias', description: 'Videos y materiales de referencia' },
  coreos: { label: '💃 Coreografías', description: 'Videos y PDFs de coreografías' },
  guion: { label: '📝 Guión', description: 'Scripts y guiones del taller' },
  vestuario: { label: '👗 Vestuario', description: 'Imágenes y referencias de vestuario' },
};

const sectionAllowedTypes: Record<string, string[]> = {
  pistas: ['audio'],
  referencias: ['video'],
  coreos: ['video', 'pdf'],
  guion: ['pdf'],
  vestuario: ['image'],
};

export default function WorkshopContentPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('pistas');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [materialsList, setMaterialsList] = useState<Content[]>([]);
  const [showAttachUI, setShowAttachUI] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'audio',
    file: null as File | null,
    enabled: true,
    tags: '',
  });

  const [editFormData, setEditFormData] = useState({
    title: '',
    type: 'audio',
    file: null as File | null,
    enabled: true,
    tags: '',
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    fetchWorkshop();
    fetchMaterials();
  }, [id]);

  const fetchMaterials = async () => {
    try {
      const res = await fetch('/api/admin/materials');
      const data = await res.json();
      setMaterialsList(data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const fetchWorkshop = async () => {
    try {
      const res = await fetch(`/api/admin/workshops/${id}`);
      const data = await res.json();
      setWorkshop(data);
    } catch (error) {
      console.error('Error fetching workshop:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, file: e.target.files?.[0] || null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let fileUrl = '';
      if (formData.file) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', formData.file);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });
        const uploadData = await uploadRes.json();
        fileUrl = uploadData.url;
      } else {
        setToast({ type: 'error', message: 'Por favor selecciona un archivo' });
        setLoading(false);
        return;
      }

      const content = {
        title: formData.title,
        type: formData.type,
        fileUrl,
        enabled: formData.enabled,
        tags: formData.tags.split(',').map((t: string) => t.trim()).filter(t => t),
      };
      
      const res = await fetch(`/api/admin/workshops/${id}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: selectedSection, content }),
      });
      
      if (res.ok) {
        fetchWorkshop();
        setShowForm(false);
        setFormData({ title: '', type: 'audio', file: null, enabled: true, tags: '' });
      }
    } catch (error) {
      console.error('Error uploading content:', error);
      setToast({ type: 'error', message: 'Error al cargar el contenido' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFormData({ ...editFormData, file: e.target.files?.[0] || null });
  };

  const openEditForm = (item: Content) => {
    setEditingItemId(item._id);
    setEditFormData({
      title: item.title,
      type: item.type,
      file: null,
      enabled: item.enabled,
      tags: item.tags.join(', '),
    });
    setShowEditForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItemId) return;
    setEditLoading(true);
    try {
      let fileUrl = undefined as string | undefined;
      if (editFormData.file) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', editFormData.file);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });
        const uploadData = await uploadRes.json();
        fileUrl = uploadData.url;
      }

      const contentUpdate: any = {
        title: editFormData.title,
        type: editFormData.type,
        enabled: editFormData.enabled,
        tags: editFormData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t),
      };
      if (fileUrl) contentUpdate.fileUrl = fileUrl;

      const res = await fetch(`/api/admin/workshops/${id}/content/${editingItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contentUpdate }),
      });

      if (res.ok) {
        fetchWorkshop();
        setShowEditForm(false);
        setEditingItemId(null);
      } else {
        console.error('Failed to update content', await res.text());
        setToast({ type: 'error', message: 'Error al actualizar el material' });
      }
    } catch (error) {
      console.error('Error updating content:', error);
      setToast({ type: 'error', message: 'Error al actualizar el material' });
    } finally {
      setEditLoading(false);
    }
  };

  const toggleEnabled = async (section: string, contentId: string, enabled: boolean) => {
    try {
      await fetch(`/api/admin/workshops/${id}/content/${contentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      fetchWorkshop();
    } catch (error) {
      console.error('Error toggling content:', error);
    }
  };

  const deleteContent = async (section: string, contentId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este contenido?')) {
      try {
        await fetch(`/api/admin/workshops/${id}/content/${contentId}`, {
          method: 'DELETE',
        });
        fetchWorkshop();
      } catch (error) {
        console.error('Error deleting content:', error);
      }
    }
  };

  if (!workshop) return <div className="flex items-center justify-center min-h-screen text-lg">Cargando...</div>;

  const sections = ['pistas', 'referencias', 'coreos', 'guion', 'vestuario'] as const;
  const currentSectionContent = workshop.sections[selectedSection as keyof typeof workshop.sections];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AdminNavBar 
        title={`Materiales - ${workshop.name}`}
        backLink="/admin/workshops"
        actionButton={{
          label: '+ Agregar Material',
          onClick: () => setShowForm(true)
        }}
      />

      <div className="max-w-7xl mx-auto p-8">
        {/* Section Tabs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          {sections.map((section) => (
            <button
              key={section}
              onClick={() => setSelectedSection(section)}
              className={`p-4 rounded-lg font-semibold transition duration-200 text-center ${
                selectedSection === section
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-900 shadow hover:shadow-md'
              }`}
            >
              <div className="text-2xl mb-1">{sectionInfo[section as keyof typeof sectionInfo].label.split(' ')[0]}</div>
              <div className="text-sm">{sectionInfo[section as keyof typeof sectionInfo].label.split(' ').slice(1).join(' ')}</div>
            </button>
          ))}
        </div>

        {/* Add Content Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-l-4 border-indigo-600">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Agregar Material a {sectionInfo[selectedSection as keyof typeof sectionInfo].label}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-semibold mb-2">Título del Material</label>
                  <input type="text" placeholder="Ej: Ritmo Básico - Clase 1" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Tipo de Archivo</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600">
                    <option value="audio">🎵 Audio</option>
                    <option value="video">🎬 Video</option>
                    <option value="pdf">📄 PDF</option>
                    <option value="image">🖼️ Imagen</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Archivo</label>
                  <input type="file" onChange={handleFileChange} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-semibold mb-2">Etiquetas (separadas por coma)</label>
                  <input type="text" placeholder="Ej: ritmo, básico, clase1" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600" />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" checked={formData.enabled} onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })} className="w-5 h-5 text-indigo-600 rounded" />
                  <label className="ml-3 text-gray-700 font-semibold">Habilitar Inmediatamente</label>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-lg transition duration-200 disabled:opacity-50">
                  {loading ? 'Subiendo...' : 'Guardar'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold px-6 py-2 rounded-lg transition duration-200">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Attach existing material UI */}
        {showAttachUI && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-l-4 border-blue-600">
            <h3 className="text-lg font-bold mb-4">Agregar material existente a esta sección</h3>
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-gray-700 font-semibold mb-2">Selecciona material</label>
                <select value={selectedMaterialId} onChange={(e) => setSelectedMaterialId(e.target.value)} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600">
                  <option value="">- Selecciona un material -</option>
                  {materialsList.filter(m => sectionAllowedTypes[selectedSection]?.includes(m.type)).map(m => (
                    <option key={m._id} value={m._id}>{m.title} ({m.type})</option>
                  ))}
                </select>
                {materialsList.filter(m => sectionAllowedTypes[selectedSection]?.includes(m.type)).length === 0 && (
                  <div className="text-sm text-gray-500 mt-2">No hay materiales globales compatibles con esta sección.</div>
                )}
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Sección</label>
                <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600">
                  {sections.map(s => <option key={s} value={s}>{sectionInfo[s as keyof typeof sectionInfo].label}</option>)}
                </select>
              </div>
              <div className="md:col-span-3 flex gap-3 pt-2">
                <button onClick={async () => {
                  if (!selectedMaterialId || !selectedSection) return setToast({ type: 'error', message: 'Selecciona material y sección' });
                  try {
                    const res = await fetch(`/api/admin/workshops/${id}/content`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ section: selectedSection, materialId: selectedMaterialId }),
                    });
                    if (res.ok) {
                      fetchWorkshop();
                      setShowAttachUI(false);
                      setSelectedMaterialId('');
                    } else {
                        setToast({ type: 'error', message: 'Error al adjuntar material' });
                    }
                  } catch (err) {
                    console.error(err);
                      setToast({ type: 'error', message: 'Error al adjuntar material' });
                  }
                }} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg">Adjuntar</button>
                <button onClick={() => setShowAttachUI(false)} className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Content Form */}
        {showEditForm && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-l-4 border-yellow-400">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Editar Material</h2>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-semibold mb-2">Título del Material</label>
                  <input type="text" placeholder="Título" value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Tipo de Archivo</label>
                  <select value={editFormData.type} onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600">
                    <option value="audio">🎵 Audio</option>
                    <option value="video">🎬 Video</option>
                    <option value="pdf">📄 PDF</option>
                    <option value="image">🖼️ Imagen</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Reemplazar Archivo (opcional)</label>
                  <input type="file" onChange={handleEditFileChange} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-semibold mb-2">Etiquetas (separadas por coma)</label>
                  <input type="text" placeholder="Ej: ritmo, básico" value={editFormData.tags} onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600" />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" checked={editFormData.enabled} onChange={(e) => setEditFormData({ ...editFormData, enabled: e.target.checked })} className="w-5 h-5 text-indigo-600 rounded" />
                  <label className="ml-3 text-gray-700 font-semibold">Habilitar</label>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={editLoading} className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-lg transition duration-200 disabled:opacity-50">{editLoading ? 'Guardando...' : 'Guardar Cambios'}</button>
                <button type="button" onClick={() => { setShowEditForm(false); setEditingItemId(null); }} className="bg-gray-500 hover:bg-gray-600 text-white font-bold px-6 py-2 rounded-lg transition duration-200">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {/* Content List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
            <h2 className="text-2xl font-bold">{sectionInfo[selectedSection as keyof typeof sectionInfo].label}</h2>
            <p className="text-indigo-100 mt-1">{sectionInfo[selectedSection as keyof typeof sectionInfo].description}</p>
          </div>

          <div className="p-6">
            {currentSectionContent.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No hay materiales en esta sección. ¡Agrega uno para comenzar!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentSectionContent.map((item) => (
                  <div key={item._id} className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-indigo-400 rounded-lg hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                        <p className="text-gray-600 mt-1">Tipo: <span className="font-semibold">{item.type}</span></p>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${item.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.enabled ? '✓ Activo' : '✗ Inactivo'}
                      </span>
                    </div>
                    {item.tags.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {item.tags.map((tag, idx) => (
                          <span key={idx} className="inline-block bg-indigo-100 text-indigo-800 text-xs font-semibold px-3 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Preview */}
                    <div className="mb-4">
                      {item.type === 'audio' && (
                        <audio controls src={item.fileUrl} className="w-full" />
                      )}
                      {item.type === 'video' && (
                        <video controls src={item.fileUrl} className="w-full max-h-60" />
                      )}
                      {item.type === 'pdf' && (
                        <PDFViewer url={item.fileUrl} />
                      )}
                      {item.type === 'image' && (
                        <img src={item.fileUrl} alt={item.title} className="w-full rounded" />
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => toggleEnabled(selectedSection, item._id, !item.enabled)} 
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition duration-200 ${
                          item.enabled 
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {item.enabled ? '🔒 Deshabilitar' : '🔓 Habilitar'}
                      </button>
                      <button 
                        onClick={() => deleteContent(selectedSection, item._id)} 
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition duration-200"
                      >
                        🗑️ Eliminar
                      </button>
                      <button onClick={() => openEditForm(item)} className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg text-sm font-semibold transition duration-200">✏️ Editar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}