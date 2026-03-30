
"use client";

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';


interface PDFViewerProps {
  url: string;
}

export default function PDFViewer({ url }: PDFViewerProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only set workerSrc on client
    if (typeof window !== 'undefined' && pdfjs && pdfjs.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    }
  }, []);

  return (
    <div className="border rounded overflow-hidden">
      <Document
        file={url}
        onLoadError={() => setError('No se pudo cargar el PDF. Verifica que el enlace sea válido y accesible.')}
        onSourceError={() => setError('No se pudo cargar el PDF. Verifica que el enlace sea válido y accesible.')}
        loading={<div className="p-4 text-center">Cargando PDF...</div>}
        error={<div className="text-red-500 p-4 text-center">{error}</div>}
      >
        <Page pageNumber={1} width={600} />
      </Document>
    </div>
  );
}
