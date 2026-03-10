"use client";
import { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

interface PDFViewerProps {
  url: string;
}

export default function PDFViewer({ url }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    const renderPDF = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context!, viewport, canvas }).promise;
      } catch (err: any) {
        setError('No se pudo cargar el PDF. Verifica que el enlace sea válido y accesible.');
      }
    };
    renderPDF();
  }, [url]);

  return (
    <div className="border rounded overflow-hidden">
      {error ? (
        <div className="text-red-500 p-4 text-center">{error}</div>
      ) : (
        <canvas ref={canvasRef} style={{ width: '100%', height: 'auto' }} />
      )}
    </div>
  );
}
