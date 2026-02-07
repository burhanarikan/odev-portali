import { useRef, useEffect, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WaveformPlayerProps {
  /** Ses URL'i (object URL veya blob URL) */
  src: string;
  /** Yükseklik (px) */
  height?: number;
  className?: string;
}

/**
 * Wavesurfer.js ile ses dalgası gösterimi — ses kaydı destekli ödev tesliminde kullanılır.
 * Dinleme ve oynatma/durdurma kontrolleri.
 */
export function WaveformPlayer({ src, height = 48, className = '' }: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const wavesurferRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    if (!src || !containerRef.current) return;

    let mounted = true;
    import('wavesurfer.js').then(({ default: WaveSurfer }) => {
      if (!mounted || !containerRef.current) return;
      const ws = WaveSurfer.create({
        container: containerRef.current,
        waveColor: '#94a3b8',
        progressColor: '#3b82f6',
        cursorColor: '#3b82f6',
        barWidth: 2,
        barGap: 1,
        barRadius: 1,
        height,
        normalize: true,
        url: src,
      });
      ws.on('ready', () => {
        if (mounted) setReady(true);
      });
      ws.on('play', () => mounted && setPlaying(true));
      ws.on('pause', () => mounted && setPlaying(false));
      ws.on('finish', () => mounted && setPlaying(false));
      wavesurferRef.current = ws as unknown as { destroy: () => void; play: () => void; pause: () => void };
    }).catch(() => {
      if (mounted) setReady(true);
    });

    return () => {
      mounted = false;
      wavesurferRef.current?.destroy();
      wavesurferRef.current = null;
    };
  }, [src, height]);

  const toggle = () => {
    const ws = wavesurferRef.current as { play: () => void; pause: () => void } | null;
    if (!ws) return;
    if (playing) ws.pause();
    else ws.play();
  };

  if (!src) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div ref={containerRef} className="min-h-[24px] rounded bg-gray-100" />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={toggle}
        disabled={!ready}
        className="gap-1.5"
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        <span className="text-xs">{playing ? 'Durdur' : 'Oynat'}</span>
      </Button>
    </div>
  );
}
