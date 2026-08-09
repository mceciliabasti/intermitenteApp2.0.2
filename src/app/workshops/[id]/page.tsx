"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAudio } from '@/components/AudioProvider';
import StudentNavBar from '@/components/StudentNavBar';

type Palette = {
  primary: string;
  soft: string;
};

function getWorkshopImageSrc(picture?: string) {
  if (!picture || !picture.trim()) return '/default-placeholder.svg';
  if (/^https?:\/\//.test(picture) || picture.startsWith('/uploads/')) return picture;
  return `/uploads/${picture.replace(/^\/+/, '')}`;
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  if (d !== 0) {
    switch (max) {
      case rn:
        h = ((gn - bn) / d) % 6;
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function buildSoftColorFromPrimary(r: number, g: number, b: number) {
  const hsl = rgbToHsl(r, g, b);
  const soft = hslToRgb(hsl.h, Math.max(0.2, hsl.s * 0.35), 0.93);
  return rgbToHex(soft.r, soft.g, soft.b);
}

async function extractPaletteFromImage(src: string): Promise<Palette | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxSide = 120;
        const ratio = Math.min(maxSide / img.width, maxSide / img.height, 1);
        canvas.width = Math.max(1, Math.floor(img.width * ratio));
        canvas.height = Math.max(1, Math.floor(img.height * ratio));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

        let totalR = 0;
        let totalG = 0;
        let totalB = 0;
        let count = 0;
        let bestScore = -1;
        let bestR = 79;
        let bestG = 70;
        let bestB = 229;

        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 120) continue;

          totalR += r;
          totalG += g;
          totalB += b;
          count += 1;

          const { s, l } = rgbToHsl(r, g, b);
          const contrastWeight = 1 - Math.abs(l - 0.5);
          const score = s * 0.8 + contrastWeight * 0.2;
          if (score > bestScore) {
            bestScore = score;
            bestR = r;
            bestG = g;
            bestB = b;
          }
        }

        if (!count) {
          resolve(null);
          return;
        }

        const avgR = totalR / count;
        const avgG = totalG / count;
        const avgB = totalB / count;

        const primary = rgbToHex((bestR + avgR) / 2, (bestG + avgG) / 2, (bestB + avgB) / 2);
        const soft = buildSoftColorFromPrimary((bestR + avgR) / 2, (bestG + avgG) / 2, (bestB + avgB) / 2);
        resolve({ primary, soft });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export default function WorkshopDetail() {
  // Estado para el orden
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const params = useParams() as { id?: string };
  const id = params?.id;
  const [workshop, setWorkshop] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [palette, setPalette] = useState<Palette | null>(null);
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

  useEffect(() => {
    const hasCustomPicture = !!(workshop?.picture && String(workshop.picture).trim());
    if (!hasCustomPicture) {
      setPalette(null);
      return;
    }

    const src = getWorkshopImageSrc(workshop.picture);
    extractPaletteFromImage(src).then((result) => setPalette(result));
  }, [workshop?.picture]);

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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <StudentNavBar />
      <div
        className="p-8 transition-colors duration-500"
        style={
          palette
            ? {
                background: `linear-gradient(160deg, ${palette.soft} 0%, #f8fafc 40%, #ffffff 100%)`,
              }
            : undefined
        }
      >
      <div className="max-w-4xl mx-auto">
        <div
          className="mb-6 bg-white rounded-xl shadow p-4 sm:p-5 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 sm:gap-6 items-stretch"
          style={
            palette
              ? {
                  background: `linear-gradient(135deg, ${palette.soft} 0%, #ffffff 55%)`,
                  border: `1px solid ${palette.primary}33`,
                }
              : undefined
          }
        >
          <div className="w-full h-52 sm:h-64 md:h-full md:min-h-[220px] bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden">
            <img
              src={getWorkshopImageSrc(workshop.picture)}
              alt={`Imagen de ${workshop.name}`}
              className="w-full h-full object-contain p-2"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/default-placeholder.svg';
              }}
            />
          </div>
          <div className="flex flex-col">
            <h1
              className="text-3xl font-bold mb-3"
              style={palette ? { color: palette.primary } : undefined}
            >
              {workshop.name}
            </h1>
            <p className="text-gray-700">{workshop.description}</p>
          </div>
        </div>

        {/* Tabs for categories */}
        <div className="mb-6 border-b border-gray-200 flex flex-wrap gap-2">
          {sectionKeys.map((key) => (
            <button
              key={key}
              className={`px-5 py-2 text-base sm:text-lg rounded-t-lg capitalize focus:outline-none transition-colors duration-200 ${activeTab === key ? '!text-black font-bold border-b-2' : 'bg-white border-b-2 border-transparent text-gray-500 font-semibold'}`}
              style={
                activeTab === key
                  ? palette
                    ? { backgroundColor: `${palette.primary}22`, borderColor: palette.primary }
                    : undefined
                  : palette
                    ? { borderColor: 'transparent' }
                    : undefined
              }
              onClick={() => setActiveTab(key)}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Active tab content */}
        {activeTab && (
          <div
            className="mb-8 bg-white p-6 rounded shadow text-gray-900"
            style={palette ? { border: `1px solid ${palette.primary}33` } : undefined}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold capitalize">{activeTab}</h2>
              <div className="flex gap-2 items-center">
                <span className="font-semibold">Ordenar:</span>
                <button
                  className={`px-3 py-1 rounded ${sortOrder === 'asc' ? 'bg-white font-bold' : ''}`}
                  style={
                    sortOrder === 'asc'
                      ? palette
                        ? { color: palette.primary, border: `1px solid ${palette.primary}66` }
                        : { color: '#4f46e5' }
                      : palette
                        ? { backgroundColor: `${palette.primary}2b`, color: palette.primary }
                        : { backgroundColor: '#c7d2fe', color: '#3730a3' }
                  }
                  onClick={() => setSortOrder('asc')}
                  aria-label="Orden ascendente"
                >A-Z</button>
                <button
                  className={`px-3 py-1 rounded ${sortOrder === 'desc' ? 'bg-white font-bold' : ''}`}
                  style={
                    sortOrder === 'desc'
                      ? palette
                        ? { color: palette.primary, border: `1px solid ${palette.primary}66` }
                        : { color: '#4f46e5' }
                      : palette
                        ? { backgroundColor: `${palette.primary}2b`, color: palette.primary }
                        : { backgroundColor: '#c7d2fe', color: '#3730a3' }
                  }
                  onClick={() => setSortOrder('desc')}
                  aria-label="Orden descendente"
                >Z-A</button>
              </div>
            </div>
            <div className="grid gap-4">
              {((sections[activeTab] || [])
                .filter((it: any) => it.enabled)
                .sort((a: any, b: any) => {
                  const pad = (title: string) => title.replace(/^(\d)(\s|-)/, '0$1$2');
                  return sortOrder === 'asc'
                    ? pad(a.title).localeCompare(pad(b.title), 'es', { sensitivity: 'base' })
                    : pad(b.title).localeCompare(pad(a.title), 'es', { sensitivity: 'base' });
                })
              ).map((it: any) => (
                <div key={it._id || it.fileUrl} className="p-3 border rounded flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate text-lg" title={it.title}>{it.title}</div>
                    <div className="text-xs sm:text-sm text-gray-600 mt-1">{it.type}</div>
                  </div>
                  {it.type === 'audio' ? (
                    <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
                      <button
                        onClick={() => addTracks([{ id: it._id || it.fileUrl, title: it.title, fileUrl: it.fileUrl }])}
                        className="text-white px-4 py-1 rounded shadow transition"
                        style={palette ? { backgroundColor: palette.primary } : { backgroundColor: '#4f46e5' }}
                      >
                        Agregar
                      </button>
                      <audio controls src={it.fileUrl} className="w-full sm:w-64 h-10" preload="none" controlsList="nodownload" />
                    </div>
                  ) : it.type === 'video' ? (
                    <a href={it.fileUrl} target="_blank" rel="noreferrer" style={palette ? { color: palette.primary } : undefined}>Ver video</a>
                  ) : it.type === 'pdf' ? (
                    <a href={it.fileUrl} target="_blank" rel="noreferrer" style={palette ? { color: palette.primary } : undefined}>Ver PDF</a>
                  ) : (
                    <a href={it.fileUrl} target="_blank" rel="noreferrer" style={palette ? { color: palette.primary } : undefined}>Ver</a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
