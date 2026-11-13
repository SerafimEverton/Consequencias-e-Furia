import { useMemo, useState } from 'react';
import { useGameStore } from '../../store/gameStore';

/**
 * Percentuais calibrados visualmente sobre painel-industrial.jpg (1920×911).
 */
const PANEL_ASPECT_H = 911 / 1920;

const FIELDS = [
  { id: 'mov', label: 'Movimentos', left: '11.8%', top: '20.1%', width: '7.70%', height: '8.50%', fontRatio: 0.72, borderRadius: '15%', rotate: '2.5deg', defaultValue: '0000' },
  { id: 'bat', label: 'Ícone objetivo', left: '12.55%', top: '42.9%', width: '6.2%', height: '9.7%', fontRatio: 0.75, borderRadius: '45%', rotate: '0deg', defaultValue: '🔋' },
  { id: 'obj', label: 'Progresso objetivo', left: '11.9%', top: '66.5%', width: '8.0%', height: '5.10%', fontRatio: 0.98, borderRadius: '5%', rotate: '-1deg', defaultValue: '00/00' },
  { id: 'pts', label: 'Pontuação', left: '12%', top: '83.5%', width: '7.8%', height: '6.5%', fontRatio: 0.98, borderRadius: '20%', rotate: '-3deg', defaultValue: '0000' },
  { id: 'dados', label: 'Dados', left: '79.50%', top: '24.65%', width: '3.0%', height: '3.25%', fontRatio: 0.95, borderRadius: '25%', rotate: '0deg', defaultValue: '000' },
  { id: 'cristais', label: 'Cristais', left: '82.6%', top: '31.0%', width: '2%', height: '4.0%', fontRatio: 0.95, borderRadius: '55%', rotate: '0deg', defaultValue: '0' },
  { id: 'purga', label: 'Custo purga', left: '81.5%', top: '46.5%', width: '3.3%', height: '4.1%', fontRatio: 1.1, borderRadius: '35%', rotate: '0deg', defaultValue: '00' },
  { id: 'reparo', label: 'Custo reparo', left: '81.7%', top: '62.28%', width: '3.3%', height: '4.1%', fontRatio: 1, borderRadius: '25%', rotate: '0deg', defaultValue: '00' },
  { id: 'emerg', label: 'Custo emergência', left: '80%', top: '79.0%', width: '3.3%', height: '4.30%', fontRatio: 0.95, borderRadius: '25%', rotate: '0deg', defaultValue: '40' },
] as const;

const PREVIEW_PIECES = [
  { id: 'battery', src: '/pieces/battery.png', label: 'Bateria' },
  { id: 'oxygen', src: '/pieces/oxygen.png', label: 'Oxigênio' },
  { id: 'sample', src: '/pieces/sample.png', label: 'Amostra' },
  { id: 'crystal', src: '/pieces/crystal.png', label: 'Cristal' },
  { id: 'propulsion', src: '/pieces/propulsion.png', label: 'Propulsão' },
  { id: 'treasure', src: '/pieces/treasure.png', label: 'Tesouro' },
  { id: 'blocked', src: '/pieces/blocked.png', label: 'Bloqueado' },
] as const;

function fontForField(heightPct: string, fontRatio: number) {
  const h = parseFloat(heightPct) / 100;
  const vw = fontRatio * h * PANEL_ASPECT_H * 100;
  return `min(${Math.round(fontRatio * h * 569)}px, ${vw.toFixed(2)}vw)`;
}

export function ScreenTest() {
  const setScreen = useGameStore((s) => s.setScreen);

  const [showBoard, setShowBoard] = useState(true);
  const [showFields, setShowFields] = useState(true);
  const [showFilhotes, setShowFilhotes] = useState(true);
  const [furyMode, setFuryMode] = useState(true);
  const [showUpperMonitor, setShowUpperMonitor] = useState(true);
  const [oceanVideo, setOceanVideo] = useState(true);

  const [boardLeft, setBoardLeft] = useState(31.7);
  const [boardTop, setBoardTop] = useState(12.9);
  const [boardWidth, setBoardWidth] = useState(35.7);
  const [boardHeight, setBoardHeight] = useState(78.1);
  const [gap, setGap] = useState(0);
  const [cols, setCols] = useState(8);
  const [rows, setRows] = useState(8);

  const grid = useMemo(() => {
    const cells: (typeof PREVIEW_PIECES)[number][] = [];
    for (let i = 0; i < cols * rows; i++) {
      cells.push(PREVIEW_PIECES[i % PREVIEW_PIECES.length]);
    }
    return cells;
  }, [cols, rows]);

  // Algumas células com filhote para prévia (padrão fixo)
  const filhoteCells = useMemo(() => {
    const set = new Set<number>();
    const total = cols * rows;
    [3, 12, 21, 28, 35, 44, 50].forEach((i) => {
      if (i < total) set.add(i);
    });
    return set;
  }, [cols, rows]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#020712] text-white flex flex-col">
      {/* Controles */}
      <div className="shrink-0 z-40 flex flex-wrap items-center gap-2 border-b border-yellow-500/30 bg-zinc-950 px-3 py-1.5">
        <button type="button" onClick={() => setScreen('main_menu')} className="rounded bg-white/10 px-3 py-1 text-xs hover:bg-white/20">
          ← MENU
        </button>
        <button type="button" onClick={() => setScreen('cabin')} className="rounded bg-sky-500 px-3 py-1 text-xs font-bold text-black hover:bg-sky-400">
          JOGAR
        </button>
        <span className="text-xs font-bold text-yellow-200">TESTE TELA</span>
        <label className="flex items-center gap-1 text-[11px] text-white/70">
          <input type="checkbox" checked={showUpperMonitor} onChange={(e) => setShowUpperMonitor(e.target.checked)} />
          Monitor superior
        </label>
        <label className="flex items-center gap-1 text-[11px] text-white/70">
          <input type="checkbox" checked={oceanVideo} onChange={(e) => setOceanVideo(e.target.checked)} />
          Vídeo fundo do mar
        </label>
        <label className="flex items-center gap-1 text-[11px] text-white/70">
          <input type="checkbox" checked={furyMode} onChange={(e) => setFuryMode(e.target.checked)} />
          Fúria
        </label>
        <label className="flex items-center gap-1 text-[11px] text-white/70">
          <input type="checkbox" checked={showFilhotes} onChange={(e) => setShowFilhotes(e.target.checked)} />
          Filhotes
        </label>
        <label className="flex items-center gap-1 text-[11px] text-white/70">
          <input type="checkbox" checked={showBoard} onChange={(e) => setShowBoard(e.target.checked)} />
          Tabuleiro
        </label>
        <label className="flex items-center gap-1 text-[11px] text-white/70">
          <input type="checkbox" checked={showFields} onChange={(e) => setShowFields(e.target.checked)} />
          Displays
        </label>
      </div>

      {showBoard && (
        <div className="shrink-0 w-full grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-cyan-500/20 bg-zinc-900/90 px-3 py-1.5 text-[11px]">
          <label className="flex flex-col gap-0.5">
            <span className="text-cyan-200/80">Left % ({boardLeft.toFixed(1)})</span>
            <input type="range" min={0} max={60} step={0.1} value={boardLeft} onChange={(e) => setBoardLeft(Number(e.target.value))} />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-cyan-200/80">Top % ({boardTop.toFixed(1)})</span>
            <input type="range" min={0} max={40} step={0.1} value={boardTop} onChange={(e) => setBoardTop(Number(e.target.value))} />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-cyan-200/80">Width % ({boardWidth.toFixed(1)})</span>
            <input type="range" min={20} max={70} step={0.1} value={boardWidth} onChange={(e) => setBoardWidth(Number(e.target.value))} />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-cyan-200/80">Height % ({boardHeight.toFixed(1)})</span>
            <input type="range" min={40} max={95} step={0.1} value={boardHeight} onChange={(e) => setBoardHeight(Number(e.target.value))} />
          </label>
        </div>
      )}

      {/* MONITOR SUPERIOR — prévia fúria / normal */}
      {showUpperMonitor && (
        <div
          className={`shrink-0 w-full ${
            furyMode ? 'bg-gradient-to-b from-red-950 via-zinc-950 to-black' : 'bg-gradient-to-b from-slate-900 via-zinc-950 to-black'
          }`}
          style={{ height: 'min(36vh, 320px)' }}
        >
          <div className="h-full w-full max-w-[1400px] mx-auto px-2 py-1 flex items-stretch gap-3">
            <div
              className="relative rounded-sm bg-black overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] flex items-center justify-center"
              style={{ border: '4px solid #3a3428', width: '70%', height: '100%', minWidth: 160 }}
            >
              {oceanVideo ? (
                <video
                  key="ocean-monitor"
                  src="/videos/monitor-fundo-mar.mp4"
                  className="w-full h-full object-contain bg-black"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={furyMode ? '/bosses/jaekelopterus-revenge.jpg' : '/bosses/jaekelopterus.jpg'}
                  alt={furyMode ? 'Jaekelopterus em fúria' : 'Jaekelopterus'}
                  className="object-contain max-w-full max-h-full"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-2 py-1">
              <div className="flex items-center gap-2 flex-wrap">
                {furyMode && (
                  <span className="text-[10px] font-black text-red-300 bg-red-900/80 px-2 py-0.5 rounded">FÚRIA</span>
                )}
                <span className="text-sm font-bold text-red-100">Jaekelopterus</span>
                {furyMode && (
                  <span className="text-[10px] text-amber-300 border border-amber-500/50 px-1.5 rounded">REVANCHE</span>
                )}
              </div>
              <div className="text-xs text-white/80">
                Casco do Nautilus-X: <span className="text-red-300 font-bold">42%</span>
              </div>
              <div className="h-2.5 w-full max-w-sm rounded-full bg-black/60 border border-white/10 overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: '42%' }} />
              </div>
              <div className="text-[10px] text-white/40">Prévia do monitor · vídeo fundo do mar ou chefe</div>
            </div>
          </div>
        </div>
      )}

      {/* Barra 8px */}
      <div
        className="shrink-0 w-full border-t border-[#5a5346]"
        style={{ height: 8, background: 'linear-gradient(180deg, #4a4336 0%, #2c2820 45%, #1a1814 100%)' }}
        aria-hidden
      />

      {/* Painel + tabuleiro + filhotes */}
      <div className="flex-1 min-h-0 flex items-center justify-center bg-black" style={{ paddingBottom: 15 }}>
        <div
          className="relative overflow-hidden border border-t-0 border-[#3a3428] bg-black w-full"
          style={{
            aspectRatio: '1920 / 911',
            maxHeight: 'min(73vh, calc(100vw * 911 / 1920))',
            width: 'min(100%, calc(73vh * 1920 / 911))',
          }}
        >
          <img
            src="/cabin/painel-industrial.jpg"
            alt=""
            className="absolute inset-0 h-full w-full pointer-events-none select-none"
            style={{ objectFit: 'fill' }}
            draggable={false}
          />

          {showFields &&
            FIELDS.map((f) => (
              <input
                key={f.id}
                id={`v-${f.id}`}
                aria-label={f.label}
                defaultValue={'defaultValue' in f ? (f.defaultValue as string) : ''}
                className="input-vazio absolute text-center font-black z-10"
                style={{
                  left: f.left,
                  top: f.top,
                  width: f.width,
                  height: f.height,
                  fontSize: fontForField(f.height, f.fontRatio),
                  borderRadius: f.borderRadius,
                  transform: `rotate(${f.rotate})`,
                }}
              />
            ))}

          {showBoard && (
            <div
              className="absolute z-20"
              style={{
                left: `${boardLeft}%`,
                top: `${boardTop}%`,
                width: `${boardWidth}%`,
                height: `${boardHeight}%`,
              }}
            >
              <div
                className="w-full h-full grid"
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                  gap: `${gap}%`,
                }}
              >
                {grid.map((piece, i) => (
                  <div key={`${piece.id}-${i}`} className="relative aspect-square" title={piece.label}>
                    <div className="absolute rounded-full bg-black" style={{ inset: '0.5%', zIndex: 0 }} aria-hidden />
                    <div className="absolute inset-0 rounded-full overflow-hidden z-[1]">
                      <img
                        src={piece.src}
                        alt={piece.label}
                        className="absolute inset-0 w-full h-full object-cover scale-[1.12]"
                        draggable={false}
                      />
                    </div>
                    {showFilhotes && filhoteCells.has(i) && (
                      <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                        <div className="relative aspect-square w-full h-full rounded-full overflow-hidden">
                          <div className="absolute rounded-full bg-black" style={{ inset: '0.5%' }} />
                          <img
                            src="/bosses/jaekelopterus-filhote.png"
                            alt="Filhote"
                            className="absolute inset-0 m-auto object-contain"
                            style={{ width: '70%', height: '70%', borderRadius: '50%' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .input-vazio {
          background: #080808;
          border: 0 !important;
          color: #ffef8a;
          outline: none;
          padding: 0 !important;
          margin: 0 !important;
          line-height: 1 !important;
          box-sizing: border-box;
          letter-spacing: 0.01em;
          -webkit-appearance: none;
          appearance: none;
          display: block;
        }
        .input-vazio:focus {
          outline: 1px solid #facc15;
          outline-offset: 0;
        }
      `}</style>
    </div>
  );
}
