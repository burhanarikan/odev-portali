/** Başarı ısı haritası: Kelime, Dilbilgisi, Dinleme, Konuşma (0-100) — SVG radar grafik */
interface SkillScores {
  vocabulary: number;
  grammar: number;
  listening: number;
  speaking: number;
}

const LABELS = [
  { key: 'vocabulary', label: 'Kelime' },
  { key: 'grammar', label: 'Dilbilgisi' },
  { key: 'listening', label: 'Dinleme' },
  { key: 'speaking', label: 'Konuşma' },
] as const;

const MAX = 100;
const SIZE = 200;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = (SIZE / 2) * 0.85;

function angleForIndex(i: number) {
  return (i * 360) / LABELS.length - 90;
}

function valueToRadius(value: number) {
  return (value / MAX) * R;
}

export function SkillRadarChart({ skillScores, size = 220 }: { skillScores: SkillScores; size?: number }) {
  const values = LABELS.map(({ key }) => Math.min(MAX, Math.max(0, skillScores[key])));
  const points = values.map((value, i) => {
    const angle = (angleForIndex(i) * Math.PI) / 180;
    const r = valueToRadius(value);
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
  });
  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const labelPositions = LABELS.map((_, i) => {
    const angle = (angleForIndex(i) * Math.PI) / 180;
    const r = R + 14;
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle), label: LABELS[i].label };
  });

  return (
    <div className="inline-block" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-full" aria-label="Başarı ısı haritası">
        {/* Arka plan ızgara (her 25 için daire) */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <circle
            key={f}
            cx={CX}
            cy={CY}
            r={R * f}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={0.8}
          />
        ))}
        {/* Eksen çizgileri */}
        {LABELS.map((_, i) => {
          const angle = (angleForIndex(i) * Math.PI) / 180;
          const x2 = CX + R * Math.cos(angle);
          const y2 = CY + R * Math.sin(angle);
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={x2}
              y2={y2}
              stroke="#e5e7eb"
              strokeWidth={0.8}
            />
          );
        })}
        {/* Veri çokgeni */}
        <polygon
          points={polygonPoints}
          fill="rgba(59, 130, 246, 0.25)"
          stroke="#3b82f6"
          strokeWidth={2}
          className="transition-all duration-300"
        />
        {/* Etiketler */}
        {labelPositions.map((pos, i) => (
          <text
            key={i}
            x={pos.x}
            y={pos.y}
            textAnchor={pos.x < CX ? 'end' : pos.x > CX ? 'start' : 'middle'}
            dominantBaseline="middle"
            className="fill-gray-600 text-[10px] font-medium"
          >
            {pos.label}
          </text>
        ))}
        {/* Değerler (merkeze yakın) */}
        {values.map((value, i) => {
          const angle = (angleForIndex(i) * Math.PI) / 180;
          const r = valueToRadius(value) * 0.5;
          const x = CX + r * Math.cos(angle);
          const y = CY + r * Math.sin(angle);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-blue-700 text-[9px] font-semibold"
            >
              {value}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
