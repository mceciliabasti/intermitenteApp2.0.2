"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAudio } from '@/components/AudioProvider';
import StudentNavBar from '@/components/StudentNavBar';

export default function WorkshopDetail() {

  const params = useParams() as { id?: string };
  const id = params?.id;
  const [workshop, setWorkshop] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const { addTracks } = useAudio();

  useEffect(() => {
    if (workshop && workshop.sections) {
      const keys = Object.keys(workshop.sections);
      setActiveTab((prev) => (prev && keys.includes(prev) ? prev : keys[0] || ''));
    }
  }, [workshop]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/workshops/${id}/content`)
      .then(async (r) => {
        if (r.status === 403) {
          setWorkshop({ forbidden: true });
          return null;
        }
        if (!r.ok) throw new Error('Fetch error');
        return r.json();
      })
      .then((data) => setWorkshop(data))
      .catch(() => setWorkshop(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8">Cargando...</div>;
  if (workshop && workshop.forbidden) return (
    <div className="p-8">
      <h2 className="text-xl font-semibold mb-4">Contenido protegido</h2>
      <p className="text-gray-700 mb-4">Debes estar inscrito para ver el contenido de este taller. Contacta con el administrador para inscribirte.</p>
    </div>
  );
  if (!workshop) return <div className="p-8">Taller no encontrado o no habilitado.</div>;




  const sections = workshop.sections || {};
  const sectionKeys = Object.keys(sections);

  const addSectionAudioToPlaylist = (sectionKey: string) => {
    const items = (sections[sectionKey] || []).filter((it: any) => it.enabled && it.type === 'audio');
    const tracks = items.map((it: any) => ({ id: it._id || it.fileUrl, title: it.title, fileUrl: it.fileUrl }));
    if (tracks.length) addTracks(tracks);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 text-gray-900">
      <StudentNavBar />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{workshop.name}</h1>
        <p className="text-gray-700 mb-6">{workshop.description}</p>

        {/* Tabs for categories */}
        <div className="mb-6 border-b border-gray-200 flex gap-2">
          {sectionKeys.map((key) => (
            <button
              key={key}
              className={`px-4 py-2 -mb-px border-b-2 font-semibold capitalize focus:outline-none transition-colors duration-200 ${activeTab === key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-indigo-600'}`}
              onClick={() => setActiveTab(key)}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Active tab content */}
        {activeTab && (
          <div className="mb-8 bg-white p-6 rounded shadow text-gray-900">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold capitalize">{activeTab}</h2>
            </div>
            <div className="grid gap-4">
              {(sections[activeTab] || []).filter((it: any) => it.enabled).map((it: any) => (
                <div key={it._id || it.fileUrl} className="p-3 border rounded flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{it.title}</div>
                    <div className="text-sm text-gray-600">{it.type}</div>
                  </div>
                  {it.type === 'audio' ? (
                    <div className="flex gap-2">
                      <button onClick={() => addTracks([{ id: it._id || it.fileUrl, title: it.title, fileUrl: it.fileUrl }])} className="bg-blue-500 text-white px-3 py-1 rounded">Agregar</button>
                      <audio controls src={it.fileUrl} className="h-8" preload="none" controlsList="nodownload" />
                    </div>
                  ) : it.type === 'video' ? (
                    <a href={it.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600">Ver video</a>
                  ) : it.type === 'pdf' ? (
                    <a href={it.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600">Ver PDF</a>
                  ) : (
                    <a href={it.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600">Ver</a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
