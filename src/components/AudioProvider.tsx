"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { PlaylistList } from "./PlaylistList";
import { useSession } from "next-auth/react";

type Track = {
  id: string;
  title: string;
  fileUrl: string;
};

type RepeatMode = "off" | "all" | "one";

type AudioContextType = {
  playlist: Track[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  repeatMode: RepeatMode;
  addTracks: (tracks: Track[] | Track) => void;
  playIndex: (i: number) => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  cycleRepeat: () => void;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudio = () => {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
};

export default function AudioProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");

  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    const a = audioRef.current;
    
    const onEnded = () => {
      if (repeatMode === "one") {
        a.currentTime = 0;
        a.play().catch(() => setIsPlaying(false));
      } else {
        setIsPlaying(false);
        setTimeout(() => next(), 100);
      }
    };
    
    const onTimeUpdate = () => {
      setCurrentTime(a.currentTime);
    };
    
    const onLoadedMetadata = () => {
      setDuration(a.duration);
    };
    
    a.addEventListener("ended", onEnded);
    a.addEventListener("timeupdate", onTimeUpdate);
    a.addEventListener("loadedmetadata", onLoadedMetadata);
    
    return () => {
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("timeupdate", onTimeUpdate);
      a.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [repeatMode]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!playlist[currentIndex]) {
      a.pause();
      a.src = "";
      setIsPlaying(false);
      return;
    }
    a.src = playlist[currentIndex].fileUrl;
    if (isPlaying) a.play().catch(() => setIsPlaying(false));
  }, [currentIndex, playlist]);

  const addTracks = (tracks: Track[] | Track) => {
    setPlaylist((p) => {
      const incoming = Array.isArray(tracks) ? tracks : [tracks];
      // avoid duplicates by id
      const ids = new Set(p.map((t) => t.id));
      const merged = [...p, ...incoming.filter((t) => !ids.has(t.id))];
      return merged;
    });
  };

  const playIndex = (i: number) => {
    if (i < 0 || i >= playlist.length) return;
    setCurrentIndex(i);
    setIsPlaying(true);
  };

  const play = () => {
    if (!playlist[currentIndex]) return;
    audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  };
  const pause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const next = () => {
    setCurrentIndex((i) => {
      const nextIndex = i + 1;
      if (nextIndex >= playlist.length) return 0;
      return nextIndex;
    });
    setIsPlaying(true);
  };

  const prev = () => {
    setCurrentIndex((i) => {
      const prevIndex = i - 1;
      if (prevIndex < 0) return Math.max(0, playlist.length - 1);
      return prevIndex;
    });
    setIsPlaying(true);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const cycleRepeat = () => {
    setRepeatMode((m) => {
      if (m === "off") return "all";
      if (m === "all") return "one";
      return "off";
    });
  };

  const value: AudioContextType = {
    playlist,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    repeatMode,
    addTracks,
    playIndex,
    play,
    pause,
    next,
    prev,
    seek,
    cycleRepeat,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
      {/* Bottom fixed player */}
      {playlist.length > 0 && (
        <div className="fixed left-0 right-0 bottom-0 bg-white border-t border-gray-200 shadow-lg px-4 py-3 space-y-2 z-50">
          {/* Playlist visual (only for non-admin) */}
          {!isAdmin && (
            <PlaylistList playlist={playlist} currentIndex={currentIndex} playIndex={playIndex} setPlaylist={setPlaylist} />
          )}

          {/* Track title and info */}
          <div className="flex justify-between items-center">
            <div className="flex-1 min-w-0">
              {playlist[currentIndex] ? (
                <div className="truncate font-semibold text-gray-900">
                  {playlist[currentIndex].title}
                </div>
              ) : (
                <div className="text-gray-600">No hay pistas en la lista</div>
              )}
            </div>
            <div className="text-sm text-gray-600 ml-4">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-2">
            <button
              onClick={prev}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-2xl text-gray-700 focus:outline-none"
              title="Anterior"
            >
              <span role="img" aria-label="Anterior">⏮️</span>
            </button>
            {isPlaying ? (
              <button
                onClick={pause}
                className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-3xl shadow focus:outline-none"
                title="Pausar"
              >
                <span role="img" aria-label="Pausar">⏸️</span>
              </button>
            ) : (
              <button
                onClick={play}
                className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-3xl shadow focus:outline-none"
                title="Reproducir"
              >
                <span role="img" aria-label="Reproducir">▶️</span>
              </button>
            )}
            <button
              onClick={next}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-2xl text-gray-700 focus:outline-none"
              title="Siguiente"
            >
              <span role="img" aria-label="Siguiente">⏭️</span>
            </button>
            <button
              onClick={cycleRepeat}
              className={`p-2 rounded-full border-2 focus:outline-none transition-colors duration-200 ${
                repeatMode === "off"
                  ? "border-gray-300 bg-white text-gray-400"
                  : repeatMode === "all"
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-green-600 bg-green-50 text-green-700"
              }`}
              title={
                repeatMode === "off"
                  ? "Repetir: Ninguno"
                  : repeatMode === "all"
                  ? "Repetir: Todas"
                  : "Repetir: Una"
              }
            >
              {repeatMode === "off" && <span role="img" aria-label="No repetir">⭕</span>}
              {repeatMode === "all" && <span role="img" aria-label="Repetir todas">🔁</span>}
              {repeatMode === "one" && <span role="img" aria-label="Repetir una">🔂</span>}
            </button>
          </div>
        </div>
      )}
    // Componente para mostrar la playlist y permitir quitar pistas
    </AudioContext.Provider>
  );
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
