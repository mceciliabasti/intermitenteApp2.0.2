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
        <div className="mb-6 border-b border-gray-200 flex flex-wrap gap-2">
          {sectionKeys.map((key) => (
            <button
              key={key}
              className={`px-5 py-2 text-base sm:text-lg rounded-t-lg capitalize focus:outline-none transition-colors duration-200 ${activeTab === key ? 'bg-indigo-100 border-b-2 border-indigo-600 !text-black font-bold' : 'bg-white border-b-2 border-transparent text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 font-semibold'}`}
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
                <div key={it._id || it.fileUrl} className="p-3 border rounded flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate text-lg" title={it.title}>{it.title}</div>
                    <div className="text-xs sm:text-sm text-gray-600 mt-1">{it.type}</div>
                  </div>
                  {it.type === 'audio' ? (
                    <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
                      <button onClick={() => addTracks([{ id: it._id || it.fileUrl, title: it.title, fileUrl: it.fileUrl }])} className="bg-indigo-600 text-white px-4 py-1 rounded shadow hover:bg-indigo-700 transition">Agregar</button>
                      <audio controls src={it.fileUrl} className="w-full sm:w-64 h-10" preload="none" controlsList="nodownload" />
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
