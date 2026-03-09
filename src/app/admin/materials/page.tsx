'use client';

import { useEffect, useState } from 'react';
import AdminNavBar from '@/components/AdminNavBar';
import Toast from '@/components/Toast';

interface Material {
  _id: string;
  title: string;
  type: string;
  fileUrl: string;
  enabled: boolean;
  tags: string[];
}

interface Workshop { _id: string; name: string }

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [workshopsFull, setWorkshopsFull] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('audio');
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{type:'success'|'error'|'info', message:string}|null>(null);
  const [attachModal, setAttachModal] = useState<{ open: boolean; materialId?: string } | null>(null);
  const [moveModal, setMoveModal] = useState<{ open: boolean; workshopId?: string; contentId?: string; content?: any } | null>(null);
  const [selectedWorkshops, setSelectedWorkshops] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState('pistas');

  useEffect(() => { fetchMaterials(); fetchWorkshops(); }, []);

  const fetchMaterials = async () => {
    const res = await fetch('/api/admin/materials');
    const data = await res.json();
    setMaterials(data || []);
  };

  const fetchWorkshops = async () => {
    const res = await fetch('/api/admin/workshops');
    const data = await res.json();
    // data may be full workshop objects; keep minimal list and full list
    setWorkshops(data.map((w: any) => ({ _id: w._id, name: w.name })) || []);
    setWorkshopsFull(data || []);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setToast({ type: 'error', message: 'Selecciona un archivo' });
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await fetch('/api/upload', { method: 'POST', body: fd });
      const upData = await up.json();
      const res = await fetch('/api/admin/materials', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type, fileUrl: upData.url, enabled, tags: tags.split(',').map(t=>t.trim()).filter(Boolean) })
      });
      if (res.ok) {
        setToast({ type: 'success', message: 'Material creado' });
        setTitle(''); setType('audio'); setFile(null); setTags(''); setEnabled(true);
        fetchMaterials();
      } else {
        setToast({ type: 'error', message: 'Error creando material' });
      }
    } catch (err) {
      console.error(err); setToast({ type: 'error', message: 'Error creando material' });
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar material?')) return;
    const res = await fetch('/api/admin/materials', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (res.ok) { setToast({ type: 'success', message: 'Eliminado' }); fetchMaterials(); }
    else setToast({ type: 'error', message: 'Error eliminando' });
  };

  const openAttach = (id: string) => { setAttachModal({ open: true, materialId: id }); setSelectedWorkshops([]); };

  const handleAttach = async () => {
    if (!attachModal?.materialId || selectedWorkshops.length === 0) return setToast({ type: 'error', message: 'Selecciona talleres' });
    setLoading(true);
    try {
      const res = await fetch('/api/admin/materials/attach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ materialId: attachModal.materialId, workshopIds: selectedWorkshops, section: selectedSection }) });
      if (res.ok) { setToast({ type: 'success', message: 'Material adjuntado' }); setAttachModal(null); }
      else { setToast({ type: 'error', message: 'Error al adjuntar' }); }
    } catch (err) { console.error(err); setToast({ type: 'error', message: 'Error al adjuntar' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AdminNavBar title="Gestionar Materiales" backLink="/admin" />

      <div className="p-8">
        <div className="max-w-6xl mx-auto">

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <form onSubmit={handleCreate} className="grid md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold mb-1">Título</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full px-3 py-2 border rounded" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Tipo</label>
              <select value={type} onChange={e=>setType(e.target.value)} className="w-full px-3 py-2 border rounded">
                <option value="audio">audio</option>
                <option value="video">video</option>
                <option value="pdf">pdf</option>
                <option value="image">image</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Archivo</label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full"
                accept={
                  type === 'pdf' ? 'application/pdf' :
                  type === 'audio' ? 'audio/*' :
                  type === 'video' ? 'video/*' :
                  type === 'image' ? 'image/*' : undefined
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Etiquetas</label>
              <input value={tags} onChange={e=>setTags(e.target.value)} placeholder="a, b" className="w-full px-3 py-2 border rounded" />
            </div>
            <div className="md:col-span-4 flex gap-3 mt-2">
              <label className="flex items-center gap-2"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)} /> Habilitado</label>
              <button className="bg-green-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Creando...' : 'Crear Material Global'}</button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Lista de materiales globales</h2>
          <div className="grid gap-3">
            {materials.map(m => (
              <div key={m._id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <div className="font-bold">{m.title} <span className="text-xs text-gray-500">({m.type})</span></div>
                  <div className="text-sm text-gray-600">{m.tags.join(', ')}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>openAttach(m._id)} className="bg-blue-600 text-white px-3 py-1 rounded">Adjuntar</button>
                  <a href={m.fileUrl} target="_blank" rel="noreferrer" className="bg-indigo-600 text-white px-3 py-1 rounded">Abrir</a>
                  <button onClick={()=>handleDelete(m._id)} className="bg-red-600 text-white px-3 py-1 rounded">Eliminar</button>
                </div>
              </div>
            ))}
            {materials.length === 0 && <div className="text-gray-500">No hay materiales globales.</div>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Materiales en talleres</h2>
          <div className="grid gap-3">
            {workshopsFull.map(w => (
              <div key={w._id} className="border rounded p-4">
                <div className="font-bold mb-2">{w.name}</div>
                <div className="grid gap-2">
                  {Object.keys(w.sections || {}).map((sectionKey) => (
                    <div key={sectionKey}>
                      <div className="text-sm font-semibold">{sectionKey}</div>
                      <div className="grid gap-2 mt-2">
                        {(w.sections?.[sectionKey] || []).map((c: any) => (
                          <div key={c._id} className="flex justify-between items-center p-2 border rounded">
                            <div>
                              <div className="font-semibold">{c.title} <span className="text-xs text-gray-500">({c.type})</span></div>
                              <div className="text-xs text-gray-600">{(c.tags||[]).join(', ')}</div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={async () => {
                                // create global material from this content
                                try {
                                  const res = await fetch('/api/admin/materials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: c.title, type: c.type, fileUrl: c.fileUrl, enabled: c.enabled, tags: c.tags || [] }) });
                                  if (res.ok) { setToast({ type: 'success', message: 'Material creado globalmente' }); fetchMaterials(); }
                                  else setToast({ type: 'error', message: 'Error creando material global' });
                                } catch (err) { console.error(err); setToast({ type: 'error', message: 'Error creando material global' }); }
                              }} className="bg-indigo-600 text-white px-3 py-1 rounded">Hacer Global</button>
                              <button onClick={async () => {
                                if (!confirm('Eliminar este material del taller?')) return;
                                try {
                                  const res = await fetch(`/api/admin/workshops/${w._id}/content/${c._id}`, { method: 'DELETE' });
                                  if (res.ok) { setToast({ type: 'success', message: 'Material eliminado del taller' }); fetchWorkshops(); fetchMaterials(); }
                                  else setToast({ type: 'error', message: 'Error al eliminar' });
                                } catch (err) { console.error(err); setToast({ type: 'error', message: 'Error al eliminar' }); }
                              }} className="bg-red-600 text-white px-3 py-1 rounded">Eliminar</button>
                              <button onClick={() => setMoveModal({ open: true, workshopId: w._id, contentId: c._id, content: c })} className="bg-yellow-500 text-white px-3 py-1 rounded">Mover</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {workshopsFull.length === 0 && <div className="text-gray-500">No hay talleres o no hay materiales en talleres.</div>}
          </div>
        </div>
        </div>
      </div>

      {attachModal?.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full">
            <h3 className="text-lg font-bold mb-4">Adjuntar material a talleres</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Selecciona talleres</label>
                <select multiple value={selectedWorkshops} onChange={(e)=>{
                  const opts = Array.from(e.target.selectedOptions).map(o=>o.value);
                  setSelectedWorkshops(opts);
                }} className="w-full h-40 border rounded p-2">
                  {workshops.map(w=> <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Sección</label>
                <select value={selectedSection} onChange={e=>setSelectedSection(e.target.value)} className="w-full px-3 py-2 border rounded">
                  <option value="pistas">🎵 Pistas</option>
                  <option value="referencias">📚 Referencias</option>
                  <option value="coreos">💃 Coreografías</option>
                  <option value="guion">📝 Guión</option>
                  <option value="vestuario">👗 Vestuario</option>
                </select>
                <div className="mt-4 flex gap-3">
                  <button onClick={handleAttach} className="bg-green-600 text-white px-4 py-2 rounded">Adjuntar</button>
                  <button onClick={()=>setAttachModal(null)} className="bg-gray-500 text-white px-4 py-2 rounded">Cancelar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {moveModal?.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full">
            <h3 className="text-lg font-bold mb-4">Mover material del taller</h3>
            <p className="mb-4">Material: <strong>{moveModal.content?.title}</strong></p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Selecciona talleres destino</label>
                <select multiple value={selectedWorkshops} onChange={(e)=>{
                  const opts = Array.from(e.target.selectedOptions).map(o=>o.value);
                  setSelectedWorkshops(opts);
                }} className="w-full h-40 border rounded p-2">
                  {workshops.map(w=> <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Sección destino</label>
                <select value={selectedSection} onChange={e=>setSelectedSection(e.target.value)} className="w-full px-3 py-2 border rounded">
                  <option value="pistas">🎵 Pistas</option>
                  <option value="referencias">📚 Referencias</option>
                  <option value="coreos">💃 Coreografías</option>
                  <option value="guion">📝 Guión</option>
                  <option value="vestuario">👗 Vestuario</option>
                </select>
                <div className="mt-4 flex gap-3">
                  <button onClick={async () => {
                    if (!moveModal?.workshopId || !moveModal?.contentId) return setToast({ type: 'error', message: 'Datos inválidos' });
                    if (selectedWorkshops.length === 0) return setToast({ type: 'error', message: 'Selecciona talleres destino' });
                    setLoading(true);
                    try {
                      // 1) create global material from content
                      const createRes = await fetch('/api/admin/materials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: moveModal.content.title, type: moveModal.content.type, fileUrl: moveModal.content.fileUrl, enabled: moveModal.content.enabled, tags: moveModal.content.tags || [] }) });
                      if (!createRes.ok) throw new Error('create failed');
                      const created = await createRes.json();
                      // 2) attach to selected workshops
                      const attachRes = await fetch('/api/admin/materials/attach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ materialId: created._id, workshopIds: selectedWorkshops, section: selectedSection }) });
                      if (!attachRes.ok) throw new Error('attach failed');
                      // 3) delete original from source workshop
                      const deleteRes = await fetch(`/api/admin/workshops/${moveModal.workshopId}/content/${moveModal.contentId}`, { method: 'DELETE' });
                      if (!deleteRes.ok) throw new Error('delete failed');
                      setToast({ type: 'success', message: 'Material movido correctamente' });
                      setMoveModal(null);
                      fetchMaterials(); fetchWorkshops();
                    } catch (err) {
                      console.error(err); setToast({ type: 'error', message: 'Error moviendo material' });
                    } finally { setLoading(false); }
                  }} className="bg-green-600 text-white px-4 py-2 rounded">Mover</button>
                  <button onClick={()=>setMoveModal(null)} className="bg-gray-500 text-white px-4 py-2 rounded">Cancelar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
