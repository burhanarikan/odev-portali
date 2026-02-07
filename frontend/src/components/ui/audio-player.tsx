import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/utils/cn';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];

interface AudioPlayerProps {
  src: string;
  className?: string;
  showSpeed?: boolean;
}

export function AudioPlayer({ src, className, showSpeed = true }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onCanPlay = () => setReady(true);
    const onEnded = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    el.addEventListener('canplay', onCanPlay);
    el.addEventListener('ended', onEnded);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    return () => {
      el.removeEventListener('canplay', onCanPlay);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, [src]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) el.pause();
    else el.play().catch(() => setPlaying(false));
  };

  if (!src) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <audio ref={audioRef} src={src} preload="metadata" />
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
      {showSpeed && (
        <div className="flex items-center gap-1">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={cn(
                'text-xs px-2 py-1 rounded border',
                speed === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-gray-300 hover:bg-gray-100'
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
