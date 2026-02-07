import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Pen, MessageSquare, Trash2, Loader2 } from 'lucide-react';

export type PathAnnotation = {
  type: 'path';
  page: number;
  points: number[][];
  stroke: string;
  strokeWidth: number;
};

export type CommentAnnotation = {
  type: 'comment';
  page: number;
  x: number;
  y: number;
  text: string;
};

export type PdfAnnotation = PathAnnotation | CommentAnnotation;

export type AnnotationData = {
  version: number;
  annotations: PdfAnnotation[];
};

const DEFAULT_STROKE = '#dc2626';
const STROKE_WIDTH = 2.5;

function isPdfUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return path.endsWith('.pdf') || url.toLowerCase().includes('.pdf');
  } catch {
    return false;
  }
}

export interface PdfAnnotatorProps {
  fileUrl: string;
  initialData?: AnnotationData | null;
  readOnly?: boolean;
  onSave?: (data: AnnotationData) => void;
  onClose?: () => void;
}

export function PdfAnnotator({
  fileUrl,
  initialData,
  readOnly = false,
  onSave,
  onClose,
}: PdfAnnotatorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageCanvases, setPageCanvases] = useState<HTMLCanvasElement[]>([]);
  const scale = 1.5;
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const displayCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>(() => {
    const raw = initialData ?? null;
    if (raw && typeof raw === 'object' && Array.isArray((raw as { annotations?: unknown }).annotations)) {
      return (raw as { annotations: PdfAnnotation[] }).annotations;
    }
    return [];
  });
  const [tool, setTool] = useState<'pen' | 'comment'>('pen');
  const [currentPath, setCurrentPath] = useState<number[][] | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageDimensions, setPageDimensions] = useState<{ w: number; h: number }[]>([]);
  const [commentPrompt, setCommentPrompt] = useState<{ page: number; x: number; y: number } | null>(null);
  const [commentText, setCommentText] = useState('');

  const drawAnnotationOnOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, ann: PdfAnnotation, pageW: number, pageH: number) => {
      if (ann.type === 'path') {
        const pts = ann.points;
        if (pts.length < 2) return;
        ctx.strokeStyle = ann.stroke ?? DEFAULT_STROKE;
        ctx.lineWidth = (ann.strokeWidth ?? STROKE_WIDTH) * (ctx.canvas.width / pageW);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        const sx = ctx.canvas.width / pageW;
        const sy = ctx.canvas.height / pageH;
        ctx.moveTo(pts[0][0] * sx, pts[0][1] * sy);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i][0] * sx, pts[i][1] * sy);
        }
        ctx.stroke();
      }
    },
    []
  );

  const redrawOverlays = useCallback(() => {
    overlayRefs.current.forEach((canvas, pageIndex) => {
      if (!canvas) return;
      const dim = pageDimensions[pageIndex];
      if (!dim) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      annotations
        .filter((a) => a.page === pageIndex)
        .forEach((a) => {
          if (a.type === 'path') drawAnnotationOnOverlay(ctx, a, dim.w, dim.h);
        });
    });
  }, [annotations, pageDimensions, drawAnnotationOnOverlay]);

  useEffect(() => {
    redrawOverlays();
  }, [redrawOverlays]);

  useEffect(() => {
    pageCanvases.forEach((srcCanvas, i) => {
      const dest = displayCanvasRefs.current[i];
      if (!dest || !srcCanvas) return;
      dest.width = srcCanvas.width;
      dest.height = srcCanvas.height;
      const ctx = dest.getContext('2d');
      if (ctx) ctx.drawImage(srcCanvas, 0, 0);
    });
  }, [pageCanvases]);

  useEffect(() => {
    if (!isPdfUrl(fileUrl)) {
      setError('Bu dosya PDF değil.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        if (typeof window !== 'undefined' && pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
          try {
            const workerUrl = await import(/* @vite-ignore */ 'pdfjs-dist/build/pdf.worker.min.mjs?url').then((m) => m.default);
            if (workerUrl) pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
          } catch {
            // worker optional
          }
        }
      } catch {
        // worker optional; PDF may still load on main thread
      }
      try {
        const getDocument = (await import('pdfjs-dist')).getDocument;
        const pdf = await getDocument({ url: fileUrl }).promise;
        if (cancelled) return;
        const n = pdf.numPages;
        const canvases: HTMLCanvasElement[] = [];
        const dims: { w: number; h: number }[] = [];

        for (let i = 1; i <= n; i++) {
          const page = await pdf.getPage(i);
          if (cancelled) return;
          const viewport = page.getViewport({ scale });
          dims.push({ w: viewport.width, h: viewport.height });
          const canvas = document.createElement('canvas');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, viewport.width, viewport.height);
            await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          }
          canvases.push(canvas);
        }
        if (cancelled) return;
        setPageCanvases(canvases);
        setPageDimensions(dims);
      } catch (e) {
        if (!cancelled) setError((e as Error).message || 'PDF yüklenemedi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [fileUrl, scale]);

  const handleOverlayMouseDown = (pageIndex: number, e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const dim = pageDimensions[pageIndex];
    if (!dim) return;
    const rx = x / dim.w;
    const ry = y / dim.h;
    if (tool === 'pen') {
      setCurrentPage(pageIndex);
      setCurrentPath([[rx, ry]]);
    } else if (tool === 'comment') {
      setCommentPrompt({ page: pageIndex, x: rx, y: ry });
      setCommentText('');
    }
  };

  const handleOverlayMouseMove = (pageIndex: number, e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly || tool !== 'pen' || currentPath === null || currentPage !== pageIndex) return;
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const dim = pageDimensions[pageIndex];
    if (!dim) return;
    setCurrentPath((prev) => (prev ? [...prev, [x / dim.w, y / dim.h]] : null));
  };

  const handleOverlayMouseUp = (pageIndex: number) => {
    if (readOnly || currentPath === null || currentPage !== pageIndex) return;
    if (currentPath.length >= 2) {
      setAnnotations((prev) => [
        ...prev,
        {
          type: 'path',
          page: pageIndex,
          points: currentPath,
          stroke: DEFAULT_STROKE,
          strokeWidth: STROKE_WIDTH,
        },
      ]);
    }
    setCurrentPath(null);
  };

  const handleAddComment = () => {
    if (!commentPrompt || !commentText.trim()) {
      setCommentPrompt(null);
      return;
    }
    setAnnotations((prev) => [
      ...prev,
      {
        type: 'comment',
        page: commentPrompt.page,
        x: commentPrompt.x,
        y: commentPrompt.y,
        text: commentText.trim(),
      },
    ]);
    setCommentPrompt(null);
    setCommentText('');
  };

  const handleSave = () => {
    onSave?.({
      version: 1,
      annotations,
    });
  };

  const handleClear = () => {
    if (readOnly) return;
    setAnnotations([]);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
        <p className="text-sm text-gray-500">PDF yükleniyor…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-600">
        <p>{error}</p>
        {onClose && (
          <Button variant="outline" className="mt-4" onClick={onClose}>
            Kapat
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4" ref={containerRef}>
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-100 rounded-lg">
          <Button
            type="button"
            variant={tool === 'pen' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('pen')}
          >
            <Pen className="h-4 w-4 mr-1" />
            Kalem
          </Button>
          <Button
            type="button"
            variant={tool === 'comment' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('comment')}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Yorum
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="h-4 w-4 mr-1" />
            Temizle
          </Button>
          <div className="flex-1" />
          {onSave && (
            <Button type="button" size="sm" onClick={handleSave}>
              İşaretlemeleri kaydet
            </Button>
          )}
          {onClose && (
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Kapat
            </Button>
          )}
        </div>
      )}

      <div className="space-y-6">
        {pageCanvases.map((canvas, pageIndex) => (
          <div key={pageIndex} className="relative inline-block shadow-lg bg-white">
            <div
              className="relative"
              style={{ width: canvas.width, height: canvas.height }}
            >
              <canvas
                ref={(el) => {
                  if (el) displayCanvasRefs.current[pageIndex] = el;
                }}
                width={canvas.width}
                height={canvas.height}
                style={{ display: 'block', width: '100%', height: 'auto', maxWidth: '100%' }}
              />
              <canvas
                ref={(el) => {
                  overlayRefs.current[pageIndex] = el;
                }}
                width={canvas.width}
                height={canvas.height}
                className="absolute inset-0 w-full h-full cursor-crosshair"
                style={{ left: 0, top: 0, pointerEvents: readOnly ? 'none' : 'auto' }}
                onMouseDown={(e) => handleOverlayMouseDown(pageIndex, e)}
                onMouseMove={(e) => handleOverlayMouseMove(pageIndex, e)}
                onMouseLeave={() => handleOverlayMouseUp(pageIndex)}
                onMouseUp={() => handleOverlayMouseUp(pageIndex)}
              />
              {annotations
                .filter((a): a is CommentAnnotation => a.type === 'comment' && a.page === pageIndex)
                .map((a, i) => (
                  <div
                    key={`comment-${pageIndex}-${i}`}
                    className="absolute bg-amber-100 border-2 border-amber-400 rounded-lg px-2 py-1 text-sm text-amber-900 shadow max-w-[200px]"
                    style={{
                      left: `${a.x * 100}%`,
                      top: `${a.y * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {a.text}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {commentPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 max-w-md w-full space-y-3">
            <p className="font-medium">Yorum metni</p>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Örn: Burada hata var"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddComment();
                if (e.key === 'Escape') setCommentPrompt(null);
              }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddComment} disabled={!commentText.trim()}>
                Ekle
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCommentPrompt(null)}>
                İptal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
