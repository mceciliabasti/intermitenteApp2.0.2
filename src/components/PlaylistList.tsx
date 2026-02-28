import React from "react";

type Track = {
  id: string;
  title: string;
  fileUrl: string;
};

type PlaylistListProps = {
  playlist: Track[];
  currentIndex: number;
  playIndex: (i: number) => void;
  setPlaylist: React.Dispatch<React.SetStateAction<Track[]>>;
};

export function PlaylistList({ playlist, currentIndex, playIndex, setPlaylist }: PlaylistListProps) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id); else copy.add(id);
      return copy;
    });
  };

  const removeSelected = () => {
    setPlaylist((prev) => prev.filter((t) => !selected.has(t.id)));
    setSelected(new Set());
  };

  const removeOne = (id: string) => {
    setPlaylist((prev) => prev.filter((t) => t.id !== id));
    setSelected((prev) => { const copy = new Set(prev); copy.delete(id); return copy; });
  };

  if (playlist.length === 0) return null;
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-gray-700">Playlist</span>
        {selected.size > 0 && (
          <button onClick={removeSelected} className="ml-2 px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600">Quitar seleccionados</button>
        )}
      </div>
      <ul className="max-h-32 overflow-y-auto divide-y divide-gray-200">
        {playlist.map((track, i) => (
          <li key={track.id} className={`flex items-center px-2 py-1 gap-2 ${i === currentIndex ? 'bg-indigo-50' : ''}`}>
            <input type="checkbox" checked={selected.has(track.id)} onChange={() => toggleSelect(track.id)} />
            <span className={`flex-1 truncate cursor-pointer ${i === currentIndex ? 'font-bold text-indigo-700' : ''}`} onClick={() => playIndex(i)} title={track.title}>{track.title}</span>
            <button onClick={() => removeOne(track.id)} className="text-xs text-red-500 hover:text-red-700 ml-2">✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
