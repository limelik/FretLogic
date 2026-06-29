import type { FretPosition } from '../../types';
import { noteMarkerColor } from '../../lib/theory';

interface Props {
  fretCount: number;
  openNotes: string[];
  positions: FretPosition[];
  mode?: 'all' | 'scale';
  showLabels?: boolean;
  activeNote?: string;
  activePositionKey?: string | null;
  activePositionKeys?: string[];
  shapePositionKeys?: string[];
  dimPositionKeys?: string[];
  feedbackMap?: Record<string, 'correct' | 'wrong'>;
  onSelect?: (position: FretPosition) => void;
}

const fretMarkers = new Set([3, 5, 7, 9, 12, 15, 17]);

export function Fretboard({
  fretCount,
  openNotes,
  positions,
  mode = 'all',
  showLabels = true,
  activeNote,
  activePositionKey,
  activePositionKeys = [],
  shapePositionKeys = [],
  dimPositionKeys = [],
  feedbackMap = {},
  onSelect,
}: Props) {
  const width = Math.max(1000, fretCount * 82);
  const height = 360;
  const fretGap = (width - 120) / (fretCount + 1);
  const stringGap = (height - 80) / (openNotes.length - 1);
  const stringY = (stringIndex: number) => 40 + stringGap * (openNotes.length - 1 - stringIndex);
  const visiblePositions = mode === 'scale' ? positions.filter((position) => position.inScale) : positions;

  return (
    <div className="overflow-x-auto rounded-[28px] border border-white/10 bg-[#160f08]/90 p-4 shadow-glow">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-[920px]"
        role="img"
        aria-label="Interactive guitar fretboard"
      >
        <defs>
          <linearGradient id="neck" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#120d08" />
            <stop offset="30%" stopColor="#2c1f15" />
            <stop offset="70%" stopColor="#1a120b" />
            <stop offset="100%" stopColor="#0c0906" />
          </linearGradient>
          <linearGradient id="metal" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#8c99b2" />
            <stop offset="50%" stopColor="#dce8ff" />
            <stop offset="100%" stopColor="#69738c" />
          </linearGradient>
        </defs>

        <rect x="28" y="28" width={width - 56} height={height - 56} rx="28" fill="url(#neck)" />
        {openNotes.map((note, index) => {
          const y = stringY(index);
          return (
            <g key={`${note}-${index}`}>
              <line
                x1="60"
                y1={y}
                x2={width - 60}
                y2={y}
                stroke={index < 2 ? '#a9b7cf' : '#cfd8ea'}
                strokeOpacity={0.8}
                strokeWidth={index === openNotes.length - 1 ? 2.2 : openNotes.length - index}
              />
              <text x="18" y={y + 5} fill="#cbd5e1" fontSize="14" fontWeight="700">
                {note}
              </text>
            </g>
          );
        })}

        {Array.from({ length: fretCount + 1 }).map((_, fret) => {
          const x = 60 + fretGap * fret;
          return (
            <g key={fret}>
              <line
                x1={x}
                y1="38"
                x2={x}
                y2={height - 38}
                stroke={fret === 0 ? '#f8fafc' : 'url(#metal)'}
                strokeWidth={fret === 0 ? 10 : 4}
                opacity={fret === 0 ? 0.9 : 0.7}
              />
              {fret > 0 && (
                <text x={x - fretGap / 2} y={height - 8} fill="#94a3b8" fontSize="13">
                  {fret}
                </text>
              )}
              {fretMarkers.has(fret) && fret <= fretCount && (
                <>
                  {fret !== 12 && <circle cx={x - fretGap / 2} cy={height / 2} r="8" fill="rgba(255,255,255,.14)" />}
                  {fret === 12 && (
                    <circle cx={x - fretGap / 2} cy={height / 2 - 46} r="8" fill="rgba(255,255,255,.14)" />
                  )}
                  {fret === 12 && (
                    <circle cx={x - fretGap / 2} cy={height / 2 + 46} r="8" fill="rgba(255,255,255,.14)" />
                  )}
                </>
              )}
            </g>
          );
        })}

        {visiblePositions.map((position) => {
          const x = 60 + fretGap * position.fret + (position.fret === 0 ? 0 : fretGap / 2);
          const y = stringY(position.stringIndex);
          const key = `${position.stringIndex}-${position.fret}`;
          const feedback = feedbackMap[key];
          const activePosition = activePositionKey === key || activePositionKeys.includes(key);
          const inShape = shapePositionKeys.includes(key);
          const dimPosition = dimPositionKeys.includes(key);
          const fillClass =
            feedback === 'correct'
              ? 'fill-emerald-300'
              : feedback === 'wrong'
                ? 'fill-rose-300'
                  : activePosition
                  ? 'fill-emerald-300'
                  : inShape
                    ? position.root
                      ? 'fill-amber-300'
                      : 'fill-cyan-300'
                    : dimPosition
                      ? 'fill-slate-300/10'
                      : noteMarkerColor(position, activeNote);
          return (
            <g key={key} onClick={() => onSelect?.(position)} className="cursor-pointer transition-all">
              <circle
                cx={x}
                cy={y}
                r={position.root ? 17 : 15}
                className={`${fillClass} transition-colors duration-300`}
                opacity={activePosition ? 1 : dimPosition ? 0.42 : mode === 'all' ? (position.fret === 0 ? 0.85 : 0.72) : 0.96}
              />
              {showLabels && !dimPosition && (
                <text x={x} y={y + 4.5} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#020617">
                  {position.note}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
