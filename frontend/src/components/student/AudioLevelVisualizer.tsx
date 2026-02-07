import { useEffect, useRef } from 'react';

interface AudioLevelVisualizerProps {
  stream: MediaStream;
  barCount?: number;
  className?: string;
}

/**
 * Kayıt sırasında mikrofon seviyesini çubuklarla gösterir (görsel geri bildirim).
 */
export function AudioLevelVisualizer({
  stream,
  barCount = 24,
  className = '',
}: AudioLevelVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !stream.getAudioTracks().length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.7;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const barWidth = Math.max(3, (canvas.width - (barCount - 1) * 2) / barCount);
    const gap = 2;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.fillStyle = 'rgb(241 245 249)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const step = Math.floor(dataArray.length / barCount);
      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] ?? 0;
        const h = Math.max(4, (value / 255) * canvas.height * 0.9);
        const x = i * (barWidth + gap);
        const y = (canvas.height - h) / 2;
        ctx.fillStyle = 'rgb(59 130 246)';
        ctx.fillRect(x, y, barWidth, h);
      }
    };

    draw();
    audioContextRef.current = audioContext;

    return () => {
      cancelAnimationFrame(rafRef.current);
      audioContext.close();
      source.disconnect();
    };
  }, [stream, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={56}
      className={className}
      aria-hidden
    />
  );
}
