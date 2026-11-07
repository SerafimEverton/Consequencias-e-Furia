import { useEffect, useState, useCallback, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { unlockAudio } from '../../systems/sounds';
import { PIECE_COLORS, PIECE_LABELS } from '../../types/game';
import type { PieceType } from '../../types/game';
import {
  ParticleLayer,
  colorForPiece,
  type ParticleBurst,
} from '../fx/ParticleLayer';

/** Ícones: PNG em /public/pieces (quando existir) ou SVG de fallback */
const PIECE_IMAGE: Partial<Record<PieceType, string>> = {
  sample: '/pieces/sample.png',
  battery: '/pieces/battery.png',
  oxygen: '/pieces/oxygen.png',
  crystal: '/pieces/crystal.png',
  propulsion: '/pieces/propulsion.png',
  treasure: '/pieces/treasure.png',
  blocked: '/pieces/blocked.png',
  // neutralizer: sem arte nova — mantém SVG
};

function PieceIcon({
  type,
  crystalChest = false,
}: {
  type: PieceType;
  crystalChest?: boolean;
}) {
  const src = PIECE_IMAGE[type];
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="piece-img absolute inset-0 w-full h-full object-cover pointer-events-none select-none scale-[1.12]"
        draggable={false}
        style={
          crystalChest
            ? {
                filter:
                  'sepia(0.85) hue-rotate(-40deg) saturate(2.8) brightness(0.92) contrast(1.15)',
              }
            : undefined
        }
      />
    );
  }

  if (type === 'treasure') {
    return (
      <svg viewBox="0 0 64 64" className="w-[70%] h-[70%] drop-shadow-md" aria-hidden>
        <rect x="8" y="28" width="48" height="28" rx="4" fill="#b45309" />
        <rect x="10" y="30" width="44" height="24" rx="3" fill="#d97706" />
        <path d="M8 30 C8 18 56 18 56 30 L56 34 L8 34 Z" fill="#92400e" />
        <path d="M10 30 C10 20 54 20 54 30 L54 32 L10 32 Z" fill="#b45309" />
        <rect x="28" y="30" width="8" height="12" rx="2" fill="#fbbf24" />
        <circle cx="32" cy="38" r="2.5" fill="#78350f" />
      </svg>
    );
  }

  if (type === 'oxygen') {
    return (
      <svg viewBox="0 0 64 64" className="w-[65%] h-[65%] drop-shadow-md" aria-hidden>
        <circle cx="32" cy="36" r="16" fill="#e0f2fe" opacity="0.9" />
        <circle cx="32" cy="36" r="11" fill="#7dd3fc" opacity="0.7" />
        <circle cx="26" cy="30" r="4" fill="white" opacity="0.8" />
      </svg>
    );
  }

  if (type === 'battery') {
    return (
      <svg viewBox="0 0 64 64" className="w-[60%] h-[60%] drop-shadow-md" aria-hidden>
        <rect x="18" y="14" width="28" height="40" rx="4" fill="#fef08a" />
        <rect x="26" y="8" width="12" height="8" rx="2" fill="#fde047" />
        <path d="M34 22 L26 34 H32 L28 46 L40 32 H33 Z" fill="#eab308" />
      </svg>
    );
  }

  if (type === 'sample') {
    return (
      <svg viewBox="0 0 64 64" className="w-[60%] h-[60%] drop-shadow-md" aria-hidden>
        <path d="M24 10 H40 V38 C40 48 34 54 32 54 C30 54 24 48 24 38 Z" fill="#bbf7d0" stroke="#4ade80" strokeWidth="2" />
        <path d="M26 36 C26 44 30 50 32 50 C34 50 38 44 38 36 Z" fill="#22c55e" opacity="0.7" />
        <rect x="22" y="8" width="20" height="6" rx="2" fill="#86efac" />
      </svg>
    );
  }

  if (type === 'crystal') {
    return (
      <svg viewBox="0 0 64 64" className="w-[60%] h-[60%] drop-shadow-md" aria-hidden>
        <polygon points="32,8 48,28 40,56 24,56 16,28" fill="#e9d5ff" />
        <polygon points="32,8 48,28 32,34" fill="#c084fc" opacity="0.8" />
        <polygon points="32,8 16,28 32,34" fill="#a855f7" opacity="0.7" />
      </svg>
    );
  }

  if (type === 'propulsion') {
    return (
      <svg viewBox="0 0 64 64" className="w-[60%] h-[60%] drop-shadow-md" aria-hidden>
        <path d="M20 40 L32 12 L44 40 Z" fill="#fdba74" />
        <path d="M26 40 L32 22 L38 40 Z" fill="#fb923c" />
        <ellipse cx="32" cy="46" rx="14" ry="6" fill="#f97316" opacity="0.8" />
      </svg>
    );
  }

  if (type === 'neutralizer') {
    return (
      <svg viewBox="0 0 64 64" className="w-[55%] h-[55%] drop-shadow-md" aria-hidden>
        <rect x="28" y="8" width="8" height="14" rx="2" fill="#a5f3fc" />
        <rect x="20" y="20" width="24" height="32" rx="6" fill="#22d3ee" />
        <rect x="24" y="26" width="16" height="16" rx="3" fill="#ecfeff" opacity="0.5" />
        <circle cx="32" cy="34" r="4" fill="#06b6d4" />
      </svg>
    );
  }

  if (type === 'blocked') {
    return <span className="text-2xl sm:text-3xl font-black text-zinc-200">✖</span>;
  }

  if (type === 'toxic') {
    return <span className="text-2xl sm:text-3xl">☠</span>;
  }

  return null;
}

function MatchEffect({ type }: { type: PieceType }) {
  if (type === 'battery') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-md z-20">
        <div className="absolute inset-0 bg-yellow-300/40 animate-pulse" />
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute bg-yellow-200"
            style={{
              width: 2,
              height: '70%',
              left: `${20 + i * 20}%`,
              top: '15%',
              transform: `rotate(${-25 + i * 15}deg)`,
              boxShadow: '0 0 6px 2px rgba(250,204,21,0.9)',
              animation: `spark 0.85s ease-out forwards`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'oxygen') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-md z-20">
        <div className="absolute inset-0 bg-sky-300/30" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border border-sky-200/80 bg-sky-100/40"
            style={{
              width: 6 + (i % 3) * 3,
              height: 6 + (i % 3) * 3,
              left: `${15 + i * 15}%`,
              bottom: '10%',
              animation: `bubblePop 0.9s ease-out forwards`,
              animationDelay: `${i * 0.04}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'sample') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-md z-20">
        <div className="absolute inset-0 bg-emerald-200/40" />
        {[
          { x: 30, y: 20, r: -40, s: 1 },
          { x: 55, y: 25, r: 25, s: 0.9 },
          { x: 20, y: 50, r: -70, s: 0.8 },
          { x: 60, y: 55, r: 50, s: 1.1 },
          { x: 40, y: 40, r: 10, s: 0.7 },
          { x: 70, y: 35, r: 60, s: 0.85 },
          { x: 25, y: 65, r: -20, s: 0.75 },
          { x: 50, y: 70, r: 35, s: 0.95 },
        ].map((shard, i) => (
          <div
            key={i}
            className="absolute bg-emerald-100/90 border border-emerald-300/80"
            style={{
              width: 8 * shard.s,
              height: 6 * shard.s,
              left: '50%',
              top: '50%',
              clipPath: 'polygon(50% 0%, 100% 40%, 80% 100%, 20% 100%, 0% 40%)',
              animation: `glassShard 0.95s ease-out forwards`,
              animationDelay: `${i * 0.02}s`,
              ['--sx' as string]: `${shard.x - 50}px`,
              ['--sy' as string]: `${shard.y - 50}px`,
              ['--sr' as string]: `${shard.r}deg`,
            }}
          />
        ))}
        <div
          className="absolute inset-0 bg-white/70"
          style={{ animation: 'glassFlash 0.45s ease-out forwards' }}
        />
      </div>
    );
  }

  if (type === 'crystal') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-md z-20">
        <div className="absolute inset-0 bg-purple-400/40" />
        <div
          className="absolute inset-1 rounded-sm"
          style={{
            background:
              'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.7) 50%, transparent 60%)',
            animation: 'shine 0.9s ease-out forwards',
          }}
        />
      </div>
    );
  }

  if (type === 'propulsion') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-md z-20">
        <div className="absolute inset-0 bg-orange-400/35" />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute left-1/2 -translate-x-1/2 bg-orange-300 rounded-full"
            style={{
              width: 8 - i * 2,
              height: 8 - i * 2,
              bottom: `${10 + i * 25}%`,
              opacity: 0.9 - i * 0.2,
              animation: `thrust 0.85s ease-out forwards`,
              animationDelay: `${i * 0.05}s`,
              boxShadow: '0 0 8px rgba(251,146,60,0.8)',
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'treasure') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-visible rounded-md z-30">
        <div className="absolute inset-0 bg-amber-400/50 animate-pulse rounded-md" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 64 64" className="w-[80%] h-[80%] animate-bounce" aria-hidden>
            <rect x="8" y="28" width="48" height="28" rx="4" fill="#b45309" />
            <rect x="10" y="30" width="44" height="24" rx="3" fill="#d97706" />
            <path d="M8 30 C8 14 56 14 56 30 L56 34 L8 34 Z" fill="#92400e" />
            <rect x="28" y="28" width="8" height="14" rx="2" fill="#fbbf24" />
          </svg>
        </div>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className="absolute text-base"
            style={{
              left: '50%',
              top: '40%',
              animation: `coinFly 1s ease-out forwards`,
              animationDelay: `${i * 0.05}s`,
              ['--dx' as string]: `${-22 + i * 9}px`,
              ['--dy' as string]: `${-32 - (i % 3) * 12}px`,
            }}
          >
            🪙
          </span>
        ))}
      </div>
    );
  }

  if (type === 'neutralizer') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-md z-20">
        <div className="absolute inset-0 bg-cyan-300/40 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none rounded-md z-20 bg-white/30 animate-pulse" />
  );
}

export function Match3Board() {
  const {
    board,
    selectedPiece,
    selectPiece,
    movesLeft,
    targetCollected,
    currentLevelConfig,
    score,
    isProcessing,
    lastTreasureEvent,
    clearTreasureEvent,
    getBossHud,
    lastBossAttack,
    hullIntegrity,
    energy,
    progress,
    useEngineeringCommand,
    setScreen,
    offspringMarks,
    clearOffspringMarks,
    endLevel,
  } = useGameStore();
  const bossHud = getBossHud();
  const energyPct = Math.max(0, Math.min(100, energy));
  const energyColor =
    energyPct > 50 ? '#fbbf24' : energyPct > 25 ? '#f59e0b' : '#ef4444';
  const [energyFx, setEnergyFx] = useState<'idle' | 'charge' | 'drain' | 'low'>(
    'idle'
  );
  const [emergCountdown, setEmergCountdown] = useState<number | null>(null);
  const prevEnergyRef = useRef(energy);
  const emergStartedRef = useRef(false);

  useEffect(() => {
    const prev = prevEnergyRef.current;
    prevEnergyRef.current = energy;
    if (energy > prev + 0.5) {
      setEnergyFx('charge');
      const t = setTimeout(() => setEnergyFx('idle'), 700);
      return () => clearTimeout(t);
    }
    if (energy < prev - 0.5) {
      setEnergyFx(energy <= 16 ? 'low' : 'drain');
      const t = setTimeout(() => setEnergyFx(energy <= 16 ? 'low' : 'idle'), 550);
      return () => clearTimeout(t);
    }
    if (energy <= 16 && energy > 0) {
      setEnergyFx('low');
    } else if (energy > 16 && energyFx === 'low') {
      setEnergyFx('idle');
    }
  }, [energy]);

  const cmdPurge =
    (progress.unlockedUpgrades.includes('electro_fuselage') ||
      progress.unlockedUpgrades.includes('emergency_purge')) &&
    progress.biologicalData >= 25;
  const cmdRepair =
    progress.unlockedUpgrades.includes('hull_nanites') &&
    progress.biologicalData >= 30 &&
    hullIntegrity < 100;
  const cmdMoves = progress.biologicalData >= 40;
  /** Emergência só com mínimo de Dados (40), em qualquer situação */
  const cmdEmergReady = cmdMoves && !isProcessing;

  // Ao chegar em ≤4%: espera 1,5s, depois mostra o alerta e inicia contagem de 5s
  useEffect(() => {
    if (energy > 4) {
      emergStartedRef.current = false;
      setEmergCountdown(null);
      return;
    }
    if (energy <= 4 && !emergStartedRef.current) {
      emergStartedRef.current = true;
      const delay = setTimeout(() => {
        setEmergCountdown(5);
      }, 1500);
      return () => clearTimeout(delay);
    }
  }, [energy]);

  useEffect(() => {
    if (emergCountdown === null) return;
    if (emergCountdown <= 0) {
      setEmergCountdown(null);
      endLevel(false);
      return;
    }
    const tmr = setTimeout(() => {
      setEmergCountdown((c) => (c === null ? null : c - 1));
    }, 1000);
    return () => clearTimeout(tmr);
  }, [emergCountdown, endLevel]);


  const [bursts, setBursts] = useState<ParticleBurst[]>([]);
  const boardWrapRef = useRef<HTMLDivElement>(null);
  const prevMatchedRef = useRef<Set<string>>(new Set());

  const consumeBursts = useCallback(() => setBursts([]), []);

  const emitBurst = useCallback(
    (
      x: number,
      y: number,
      color: string,
      kind: ParticleBurst['kind'],
      count?: number
    ) => {
      setBursts((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          x,
          y,
          color,
          kind,
          count,
        },
      ]);
    },
    []
  );

  useEffect(() => {
    const wrap = boardWrapRef.current;
    if (!wrap || board.length === 0) return;

    const boardEl = wrap.querySelector('[data-board-grid]') as HTMLElement | null;
    if (!boardEl) return;

    const cells = boardEl.querySelectorAll('[data-cell]');
    const cols = currentLevelConfig?.cols ?? 8;
    const newly = new Set<string>();

    board.forEach((row, r) => {
      row.forEach((piece, c) => {
        if (piece.isMatched || piece.isOpening) {
          const key = `${r}-${c}-${piece.type}`;
          newly.add(key);
          if (!prevMatchedRef.current.has(key)) {
            const idx = r * cols + c;
            const el = cells[idx] as HTMLElement | undefined;
            if (el) {
              const br = boardEl.getBoundingClientRect();
              const er = el.getBoundingClientRect();
              const x = er.left - br.left + er.width / 2;
              const y = er.top - br.top + er.height / 2;
              const kind =
                piece.type === 'treasure'
                  ? 'treasure'
                  : piece.type === 'battery'
                    ? 'spark'
                    : 'match';
              emitBurst(x, y, colorForPiece(piece.type), kind);
            }
          }
        }
      });
    });
    prevMatchedRef.current = newly;
  }, [board, currentLevelConfig?.cols, emitBurst]);

  useEffect(() => {
    if (!lastBossAttack) return;
    const wrap = boardWrapRef.current;
    if (!wrap) return;
    const boardEl = wrap.querySelector('[data-board-grid]') as HTMLElement | null;
    if (!boardEl) return;
    const br = boardEl.getBoundingClientRect();
    const cx = br.width / 2;
    const cy = br.height / 2;
    if (lastBossAttack === 'primary') {
      emitBurst(cx, cy, '#f59e0b', 'boss', 32);
      emitBurst(cx * 0.5, cy * 0.7, '#78716c', 'boss', 16);
      emitBurst(cx * 1.3, cy * 0.8, '#a8a29e', 'boss', 16);
    } else {
      emitBurst(cx, cy, '#f87171', 'boss', 24);
      emitBurst(cx * 0.6, cy, '#dc2626', 'match', 12);
      emitBurst(cx * 1.2, cy, '#dc2626', 'match', 12);
    }
  }, [lastBossAttack, emitBurst]);

  /** Cristal: trava na tela até o tempo acabar — nada interrompe */
  const [crystalHold, setCrystalHold] = useState<typeof lastTreasureEvent>(null);
  const crystalTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!lastTreasureEvent?.crystals) return;
    // Novo marco de cristal: reinicia só se for um evento novo
    setCrystalHold(lastTreasureEvent);
    if (crystalTimerRef.current != null) {
      window.clearTimeout(crystalTimerRef.current);
    }
    crystalTimerRef.current = window.setTimeout(() => {
      crystalTimerRef.current = null;
      setCrystalHold(null);
      clearTreasureEvent();
    }, 4000); // aviso de cristal: 4 segundos
  }, [lastTreasureEvent?.id, lastTreasureEvent?.crystals, clearTreasureEvent]);

  useEffect(() => {
    return () => {
      if (crystalTimerRef.current != null) {
        window.clearTimeout(crystalTimerRef.current);
      }
    };
  }, []);

  // Tesouro normal — 2,5s; bloqueado enquanto o aviso de cristal estiver ativo
  useEffect(() => {
    if (crystalHold?.crystals) return;
    if (!lastTreasureEvent || lastTreasureEvent.crystals) return;
    const t = window.setTimeout(() => clearTreasureEvent(), 2500);
    return () => window.clearTimeout(t);
  }, [lastTreasureEvent, crystalHold, clearTreasureEvent]);

  useEffect(() => {
    if (!offspringMarks.length) return;
    const t = setTimeout(() => clearOffspringMarks(), 2000);
    return () => clearTimeout(t);
  }, [offspringMarks, clearOffspringMarks]);

  if (!currentLevelConfig || board.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        Carregando missão...
      </div>
    );
  }

  const { targetPiece, targetCount, name, isRevenge } = currentLevelConfig;

  const BOARD = { left: 31.7, top: 12.9, width: 35.7, height: 78.1, gap: 0 };

  /**
   * Bateria Nautilus-X — ajuste livre de tamanho/posição do bloco.
   * width / height: tamanho do container da imagem (%, px, etc.)
   * maxWidth: teto em px (opcional; use '' para desligar)
   * marginRight: sobreposição com o monitor (negativo = mais à frente/sobre)
   * zIndex: na frente do monitor = valor alto (ex. 40)
   * gauge*: posição do visor de líquido sobre a imagem
   */
  /**
   * Tamanho REAL da imagem da bateria:
   * - width / maxWidth → largura
   * - height → altura (ex: '120%', '200px', '40vh')
   * object-fit: fill aplica os dois eixos.
   */
  const BATTERY = {
    width: '39%',
    height: '109%',
    maxWidth: '330px',
    // Com chefe no monitor: -80px; sem chefe: -100px
    marginRight: bossHud ? '-80px' : '-100px',
    zIndex: 20,
    // Visor do líquido
    gaugeLeft: '47.8%',
    gaugeTop: '43.4%',
    gaugeWidth: '7%',
    gaugeHeight: '37.6%',
    // Conexão positiva (esquerda) — width/height livres
    posLeft: '-22%',
    posTop: '8.5%',
    posWidth: '32%',
    posHeight: '18%',
    // Conexão negativa (direita)
    negLeft: '81%',
    negTop: '74%',
    negWidth: '22%',
    negHeight: '40%',
  };

  const DISPLAYS = {
    mov: { left: '11.8%', top: '20.1%', width: '7.70%', height: '8.50%', rotate: '2.5deg', radius: '15%' },
    bat: { left: '12.55%', top: '42.9%', width: '6.2%', height: '9.7%', rotate: '0deg', radius: '45%' },
    obj: { left: '11.9%', top: '66.5%', width: '8.0%', height: '5.10%', rotate: '-1deg', radius: '5%' },
    pts: { left: '12%', top: '83.5%', width: '7.8%', height: '6.5%', rotate: '-3deg', radius: '20%' },
    dados: { left: '79.50%', top: '24.65%', width: '3.0%', height: '3.25%', rotate: '0deg', radius: '25%' },
    cristais: { left: '82.6%', top: '31.0%', width: '2%', height: '4.0%', rotate: '0deg', radius: '55%' },
    purga: { left: '81.5%', top: '46.5%', width: '3.3%', height: '4.1%', rotate: '0deg', radius: '35%' },
    reparo: { left: '81.7%', top: '62.28%', width: '3.3%', height: '4.1%', rotate: '0deg', radius: '25%' },
    emerg: { left: '80%', top: '79.0%', width: '3.3%', height: '4.30%', rotate: '0deg', radius: '25%' },
  } as const;

  /**
   * Placa do nome do objetivo — cobre a placa "BATERIA" do painel.
   * Ajuste left/top/width/height/rotate para encaixar na arte.
   */
  const OBJ_PLATE = {
    left: '11.5%',
    top: '55.5%',
    width: '8.8%',
    height: '6.20%',
    rotate: '-1deg',
  };

  /** Placas em /public/ui/obj-plates/{tipo}.png */
  const OBJ_PLATE_SRC: Partial<Record<PieceType, string>> = {
    battery: '/ui/obj-plates/battery.png',
    oxygen: '/ui/obj-plates/oxygen.png',
    sample: '/ui/obj-plates/sample.png',
    crystal: '/ui/obj-plates/crystal.png',
    propulsion: '/ui/obj-plates/propulsion.png',
    neutralizer: '/ui/obj-plates/neutralizer.png',
  };

  const ledStyle = (d: (typeof DISPLAYS)[keyof typeof DISPLAYS]) => ({
    left: d.left,
    top: d.top,
    width: d.width,
    height: d.height,
    borderRadius: d.radius,
    transform: `rotate(${d.rotate})`,
    backgroundColor: '#080808',
    color: '#ffef8a',
    overflow: 'hidden' as const,
    lineHeight: 1,
    padding: 0,
    boxSizing: 'border-box' as const,
  });

  const targetIconSrc = PIECE_IMAGE[targetPiece];

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#00050a] text-white flex flex-col">


      {/* MONITOR SUPERIOR + BATERIA */}
      <div className="relative z-[5] flex-1 min-h-0 w-full bg-[#000308] flex items-center justify-center overflow-visible" style={{ alignItems: 'center' }}>
        <div className="flex h-full w-full items-center justify-center gap-2 px-1 mx-auto">
          
          {/* Bateria Nautilus-X — ajuste em BATTERY (width/height/maxWidth) */}
          <div
            className={`relative shrink-0 flex flex-col items-center justify-center energy-battery energy-fx-${energyFx}${energyPct <= 16 ? ' energy-fx-low' : ''}`}
            style={{
              /* width/height do BATTERY controlam a imagem de verdade */
              width: BATTERY.maxWidth
                ? `min(${BATTERY.width}, ${BATTERY.maxWidth})`
                : BATTERY.width,
              height: BATTERY.height,
              minHeight: BATTERY.height,
              maxHeight: 'none',
              overflow: 'visible',
              zIndex: BATTERY.zIndex,
              marginRight: BATTERY.marginRight,
              background: 'transparent',
              flexShrink: 0,
            }}
            title={`Energia: ${Math.round(energyPct)}%`}
          >
            <div
              className="relative energy-battery-body"
              style={{
                width: '100%',
                height: '100%',
                overflow: 'visible',
                background: 'transparent',
              }}
            >
              <img
                src="/ui/bateria-nautilus.png"
                alt="Bateria Nautilus-X"
                draggable={false}
                className="relative z-10 block select-none pointer-events-none"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'fill', /* respeita width E height do BATTERY */
                  display: 'block',
                }}
              />
              {/* Visor por CIMA da imagem — posições em BATTERY.gauge* */}
              <div
                className="pointer-events-none absolute z-20 overflow-hidden"
                style={{
                  left: BATTERY.gaugeLeft,
                  top: BATTERY.gaugeTop,
                  width: BATTERY.gaugeWidth,
                  height: BATTERY.gaugeHeight,
                  borderRadius: '3px',
                  border: 'none',
                  background: 'transparent',
                }}
              >
                <div
                  className="energy-liquid absolute bottom-0 left-0 right-0 transition-all duration-400 ease-out"
                  style={{
                    height: `${energyPct}%`,
                    background: `linear-gradient(to top, ${energyColor}, ${energyColor}ee)`,
                    boxShadow:
                      energyPct > 0
                        ? `0 0 14px ${energyColor}aa, inset 0 0 10px rgba(255,255,200,0.45)`
                        : 'none',
                  }}
                />
                {energyPct > 10 && (
                  <>
                    <div
                      className="absolute left-[30%] w-1 h-1 rounded-full bg-yellow-50/90"
                      style={{
                        bottom: `${Math.max(8, Math.min(80, energyPct * 0.65))}%`,
                        animation: 'energyBubble 1.8s ease-in-out infinite',
                      }}
                    />
                    <div
                      className="absolute left-[55%] w-1.5 h-1.5 rounded-full bg-amber-100/70"
                      style={{
                        bottom: `${Math.max(5, Math.min(65, energyPct * 0.5))}%`,
                        animation: 'energyBubble 1.3s ease-in-out infinite 0.35s',
                      }}
                    />
                  </>
                )}
                {energyFx === 'charge' &&
                  [0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="absolute bg-yellow-100"
                      style={{
                        width: 2,
                        height: 8 + i * 2,
                        left: `${18 + i * 14}%`,
                        bottom: `${15 + (i % 3) * 18}%`,
                        transform: `rotate(${-25 + i * 10}deg)`,
                        boxShadow: '0 0 8px 2px rgba(250,204,21,1)',
                        animation: 'energySpark 0.6s ease-out forwards',
                        animationDelay: `${i * 0.04}s`,
                      }}
                    />
                  ))}
              </div>
              {/* Conexão positiva — sobre o extremo do cabo esquerdo */}
              <img
                src="/ui/conexao-positiva.png"
                alt="Conexão positiva"
                draggable={false}
                className="pointer-events-none absolute z-40 select-none"
                style={{
                  left: BATTERY.posLeft,
                  top: BATTERY.posTop,
                  width: BATTERY.posWidth,
                  height: BATTERY.posHeight,
                  objectFit: 'fill',
                }}
              />
              {/* Conexão negativa — sobre o extremo do cabo direito */}
              <img
                src="/ui/conexao-negativa.png"
                alt="Conexão negativa"
                draggable={false}
                className="pointer-events-none absolute z-40 select-none"
                style={{
                  left: BATTERY.negLeft,
                  top: BATTERY.negTop,
                  width: BATTERY.negWidth,
                  height: BATTERY.negHeight,
                  objectFit: 'fill',
                }}
              />
            </div>
          </div>

          <div
            className="relative z-[5] overflow-hidden"
            style={{
              width: bossHud ? '58%' : '78%',
              height: '135%',
              minWidth: 'min(100%, 520px)',
            }}
          >
              {!bossHud && (
                <div
                  className="absolute z-[1] overflow-hidden bg-transparent pointer-events-none"
                  style={{
                    left: '-6.70%',
                    top: '21.05%',
                    width: '112.50%',
                    height: '54.34%',
                  }}
                >
                  <video
                    src="/videos/monitor-fundo-mar.mp4"
                    className="block h-full w-full object-cover pointer-events-none select-none"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    controls={false}
                    disablePictureInPicture
                    disableRemotePlayback
                    tabIndex={-1}
                  />
                </div>
              )}
              {bossHud && (
                <img
                  src={
                    bossHud.isRevenge
                      ? '/bosses/jaekelopterus-revenge.jpg'
                      : '/bosses/jaekelopterus.jpg'
                  }
                  alt="Scan do chefe"
                  className="absolute z-[1] bg-black"
                  style={{
                    left: '18.90%',
                    top: '21.4%',
                    width: '62.50%',
                    height: '53.80%',
                    objectFit: 'fill',
                  }}
                />
              )}

              {/* Filhotes no monitor superior durante o ataque secundário */}
              {bossHud &&
                (lastBossAttack === 'secondary' || offspringMarks.length > 0) && (
                  <div
                    className="pointer-events-none absolute z-[5] flex flex-col items-center justify-center bg-black/70"
                    style={{
                      left: '18.90%',
                      top: '21.4%',
                      width: '62.50%',
                      height: '53.80%',
                    }}
                  >
                    <img
                      src="/bosses/jaekelopterus-filhote.png"
                      alt="Filhotes atacando"
                      className="max-h-[78%] max-w-[78%] object-contain"
                      style={{
                        borderRadius: '50%',
                        filter: 'drop-shadow(0 0 12px rgba(239,68,68,0.65))',
                        animation: 'energyAlertPulse 0.9s ease-in-out infinite',
                      }}
                      draggable={false}
                    />
                    <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-red-300">
                      Filhotes atacando
                    </div>
                  </div>
                )}

              {/* Alerta de energia crítica no monitor */}
              {emergCountdown !== null && (
                <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
                  <div
                    className="mx-4 max-w-[90%] rounded-lg border-2 border-red-500/80 bg-black/85 px-4 py-3 text-center shadow-[0_0_24px_rgba(239,68,68,0.55)]"
                    style={{ animation: 'energyAlertPulse 1s ease-in-out infinite' }}
                  >
                    <div className="text-[11px] font-black uppercase tracking-wider text-red-400">
                      ⚠ Energia crítica — {Math.round(energyPct)}%
                    </div>
                    <div className="mt-1 text-sm font-bold text-amber-200">
                      Acione o botão EMERGÊNCIA
                    </div>
                    <div className="mt-2 font-mono text-2xl font-black text-red-300">
                      {emergCountdown}s
                    </div>
                    <div className="mt-1 text-[10px] text-white/50">
                      Tempo esgotado = missão falha
                    </div>
                  </div>
                </div>
              )}

              {/* Aviso no monitor: cristal tem prioridade e cumpre o tempo inteiro */}
              {(crystalHold?.crystals || lastTreasureEvent) ? (
                <div
                  className="pointer-events-none absolute z-[100] flex items-center justify-center"
                  style={{
                    left: '15.60%',
                    top: '20.05%',
                    width: '69.0%',
                    height: '57.34%',
                  }}
                >
                  <div
                    className={`flex flex-col items-center justify-center rounded-xl border-2 bg-black/92 text-center ${
                      crystalHold?.crystals
                        ? 'border-violet-400/90 shadow-[0_0_28px_rgba(167,139,250,0.55)]'
                        : 'border-amber-400/90 shadow-[0_0_28px_rgba(251,191,36,0.45)]'
                    }`}
                    style={{
                      width: '90%',
                      height: '90%',
                      animation: 'energyAlertPulse 1.2s ease-in-out infinite',
                    }}
                  >
                    {crystalHold?.crystals ? (
                      <>
                        <div className="text-4xl mb-2">💎</div>
                        <div className="text-sm font-black uppercase tracking-wider text-violet-300">
                          Cristal puro no tesouro!
                        </div>
                        <div className="mt-2 text-2xl font-black text-amber-200">
                          +{crystalHold.crystals}{' '}
                          {crystalHold.crystals === 1 ? 'Cristal' : 'Cristais'}
                        </div>
                        <div className="mt-1 text-xs text-white/70">
                          +{crystalHold.bonusMoves} jogadas · +{crystalHold.coins} dados
                        </div>
                        <div className="mt-2 text-[11px] text-white/60">
                          Marco de 500 pontos
                        </div>
                      </>
                    ) : lastTreasureEvent ? (
                      <>
                        <div className="mb-3 text-7xl">🎁</div>
                        <div className="text-2xl font-black uppercase tracking-wider text-amber-300">
                          Tesouro aberto!
                        </div>
                        <div className="mt-3 text-4xl font-black text-amber-100">
                          +{lastTreasureEvent.bonusMoves} jogadas
                        </div>
                        <div className="mt-2 text-3xl font-bold text-white/90">
                          +{lastTreasureEvent.coins} dados
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <img
                src="/ui/monitor-frame.png"
                alt=""
                draggable={false}
                className="pointer-events-none absolute inset-0 z-10 h-full w-full select-none"
                style={{ objectFit: 'fill' }}
              />
          </div>

          {bossHud && (
            <div
              className="flex min-w-0 flex-col justify-center gap-2"
              style={{
                width: '22%',
                marginLeft: '-5.05rem',
                paddingRight: '0.25rem',
              }}
            >
              <div className="flex flex-wrap items-center gap-2">
                {bossHud.isRevenge && (
                  <span className="rounded bg-red-900/80 px-2 py-0.5 text-[10px] font-black text-red-300">FÚRIA</span>
                )}
                <span className="text-sm font-bold text-red-100">Jaekelopterus</span>
                {bossHud.isRevenge && (
                  <span className="rounded border border-amber-500/50 px-1.5 text-[10px] text-amber-300">REVANCHE</span>
                )}
              </div>
              <div className="text-xs text-white/80">
                Casco do Nautilus-X:{' '}
                <span className={hullIntegrity < 50 ? 'font-bold text-red-300' : 'text-emerald-300'}>
                  {Math.round(hullIntegrity)}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/10 bg-black/60">
                <div
                  className={`h-full transition-all ${
                    hullIntegrity < 23 ? 'bg-red-500' : hullIntegrity < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, hullIntegrity))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-30 shrink-0 w-full flex flex-col items-center bg-black" style={{ paddingBottom: 15 }}>
        <div
          className="w-full border-t border-[#5a5346]"
          style={{
            height: 8,
            background: 'linear-gradient(180deg, #4a4336 0%, #2c2820 45%, #1a1814 100%)',
          }}
          aria-hidden
        />
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

        <div className="game-led absolute flex items-center justify-center font-black z-10 pointer-events-none bg-[#080808]" style={ledStyle(DISPLAYS.mov)}>
          <span className="leading-none tabular-nums" style={{ fontSize: 'clamp(10px, 2.2vw, 28px)' }}>
            {String(movesLeft).padStart(2, '0')}
          </span>
        </div>
        <div className="game-led absolute flex items-center justify-center z-10 pointer-events-none overflow-hidden bg-[#080808]" style={ledStyle(DISPLAYS.bat)}>
          {targetIconSrc ? (
            <img src={targetIconSrc} alt={PIECE_LABELS[targetPiece]} className="w-[90%] h-[90%] object-contain scale-110" />
          ) : (
            <span className="text-lg">{PIECE_LABELS[targetPiece]?.[0] ?? '?'}</span>
          )}
        </div>
        {/* Placa física do objetivo — sobre a placa BATERIA do painel */}
        {OBJ_PLATE_SRC[targetPiece] && (
          <img
            src={OBJ_PLATE_SRC[targetPiece]}
            alt={PIECE_LABELS[targetPiece]}
            draggable={false}
            className="pointer-events-none absolute z-20 select-none"
            style={{
              left: OBJ_PLATE.left,
              top: OBJ_PLATE.top,
              width: OBJ_PLATE.width,
              height: OBJ_PLATE.height,
              transform: `rotate(${OBJ_PLATE.rotate})`,
              objectFit: 'fill',
            }}
          />
        )}
        <div className="game-led absolute flex items-center justify-center font-black z-10 pointer-events-none bg-[#080808]" style={ledStyle(DISPLAYS.obj)}>
          <span className="leading-none tabular-nums" style={{ fontSize: 'clamp(9px, 1.8vw, 22px)' }}>
            {targetCollected}/{targetCount}
          </span>
        </div>
        <div className="game-led absolute flex items-center justify-center font-black z-10 pointer-events-none bg-[#080808]" style={ledStyle(DISPLAYS.pts)}>
          <span className="leading-none tabular-nums" style={{ fontSize: 'clamp(9px, 1.8vw, 22px)' }}>
            {score}
          </span>
        </div>
        <div className="game-led absolute flex items-center justify-center font-black z-10 pointer-events-none bg-[#080808]" style={ledStyle(DISPLAYS.dados)}>
          <span className="leading-none tabular-nums" style={{ fontSize: 'clamp(8px, 1.4vw, 16px)' }}>
            {progress.biologicalData}
          </span>
        </div>
        <div className="game-led absolute flex items-center justify-center font-black z-10 pointer-events-none bg-[#080808]" style={ledStyle(DISPLAYS.cristais)}>
          <span className="leading-none tabular-nums" style={{ fontSize: 'clamp(8px, 1.4vw, 16px)' }}>
            {progress.pureCrystals}
          </span>
        </div>
        {/* Purga / Reparo / Emergência: mostram Dados acumulados (atualizam ao consumir) */}
        <div className="game-led absolute flex items-center justify-center font-black z-10 pointer-events-none bg-[#080808]" style={ledStyle(DISPLAYS.purga)}>
          <span className="leading-none tabular-nums" style={{ fontSize: 'clamp(8px, 1.4vw, 16px)' }}>
            {progress.biologicalData}
          </span>
        </div>
        <div className="game-led absolute flex items-center justify-center font-black z-10 pointer-events-none bg-[#080808]" style={ledStyle(DISPLAYS.reparo)}>
          <span className="leading-none tabular-nums" style={{ fontSize: 'clamp(8px, 1.4vw, 16px)' }}>
            {progress.biologicalData}
          </span>
        </div>
        <div className="game-led absolute flex items-center justify-center font-black z-10 pointer-events-none bg-[#080808]" style={ledStyle(DISPLAYS.emerg)}>
          <span className="leading-none tabular-nums" style={{ fontSize: 'clamp(8px, 1.4vw, 16px)' }}>
            {progress.biologicalData}
          </span>
        </div>

        {([
          {
            id: 'purga',
            src: '/ui/btn-purga.jpg',
            ready: cmdPurge && !isProcessing,
            onClick: () => useEngineeringCommand('purge_blockers'),
            title: 'Purga · limpar bloqueios · 25 dados',
            label: 'Purga',
            left: '87.30%',
            top: '45.5%',
          },
          {
            id: 'reparo',
            src: '/ui/btn-reparo.jpg',
            ready: cmdRepair && !isProcessing,
            onClick: () => useEngineeringCommand('repair_hull'),
            title: 'Reparo · reparar casco · 30 dados',
            label: 'Reparo',
            left: '87.30%',
            top: '61.5%',
          },
          {
            id: 'emerg',
            src: '/ui/btn-emergencia.jpg',
            ready: cmdEmergReady,
            onClick: () => {
              if (useEngineeringCommand('extra_moves')) {
                setEmergCountdown(null);
                emergStartedRef.current = false;
              }
            },
            title: 'Emergência · +3 movimentos · 40 dados',
            label: 'Emergência',
            left: '87.60%',
            top: '79.0%',
          },
          {
            id: 'catalogo',
            src: '/ui/btn-catalogo.jpg',
            ready: true,
            onClick: () => setScreen('upgrade_menu'),
            title: 'Catálogo · Terminal de Engenharia',
            label: 'Catálogo',
            left: '88.30%',
            top: '87.50%',
          },
        ] as const).map((b) => (
          <button
            key={b.id}
            type="button"
            disabled={!b.ready}
            onClick={b.onClick}
            className={`eng-img-btn absolute z-30 ${
              b.id === 'catalogo'
                ? 'eng-img-catalog-on'
                : b.ready
                  ? 'eng-img-on'
                  : 'eng-img-off'
            }`}
            style={{ left: b.left, top: b.top, width: '2.8%', aspectRatio: '1' }}
            title={b.title}
            aria-label={b.label}
          >
            <img src={b.src} alt="" draggable={false} className="eng-img-face" />
          </button>
        ))}

        <div
          ref={boardWrapRef}
          className="absolute z-20"
          style={{
            left: `${BOARD.left}%`,
            top: `${BOARD.top}%`,
            width: `${BOARD.width}%`,
            height: `${BOARD.height}%`,
          }}
        >
          <div
            data-board-grid
            className="match3-board-grid relative w-full h-full grid"
            style={{
              gridTemplateColumns: `repeat(${currentLevelConfig.cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${currentLevelConfig.rows}, minmax(0, 1fr))`,
              gap: `${BOARD.gap}%`,
            }}
          >
            {board.map((row, r) =>
              row.map((piece, c) => {
                const isSelected =
                  selectedPiece?.row === r && selectedPiece?.col === c;
                const color = PIECE_COLORS[piece.type as PieceType];
                const hasPieceImage = Boolean(PIECE_IMAGE[piece.type as PieceType]);
                const matched = !!piece.isMatched || !!piece.isOpening;
                const isTreasure = piece.type === 'treasure';
                const isCrystalChest =
                  isTreasure && (piece.crystalReward ?? 0) > 0;

                return (
                  <button
                    key={piece.id}
                    data-cell
                    disabled={isProcessing || piece.type === 'blocked'}
                    onClick={() => {
                      unlockAudio();
                      selectPiece(r, c);
                    }}
                    className={`
                      relative aspect-square rounded-full overflow-hidden transition-transform duration-150
                      flex items-center justify-center
                      select-none cursor-pointer industrial-tile
                      ${isSelected ? 'ring-4 ring-cyan-300 scale-110 z-10 tile-selected' : ''}
                      ${piece.type === 'blocked' ? 'opacity-70 cursor-not-allowed industrial-tile-blocked' : 'hover:scale-105'}
                      ${piece.type === 'empty' ? 'invisible' : ''}
                      ${matched ? 'scale-90 opacity-90 z-20' : ''}
                      ${isCrystalChest && !matched ? 'ring-2 ring-red-500/90' : ''}
                      ${isTreasure && !isCrystalChest && !matched ? 'ring-2 ring-amber-400/80' : ''}
                    `}
                    style={{
                      backgroundColor: hasPieceImage ? 'transparent' : color,
                      boxShadow: matched
                        ? `0 0 18px 4px ${color}`
                        : isSelected
                          ? `0 0 22px 8px rgba(103,232,249,0.95), 0 0 40px 12px ${color}, inset 0 0 12px rgba(255,255,255,0.45)`
                          : isCrystalChest
                            ? '0 0 16px 4px rgba(239,68,68,0.9), 0 0 28px 6px rgba(185,28,28,0.55), inset 0 0 10px rgba(127,29,29,0.35)'
                            : isTreasure
                              ? '0 0 12px 2px rgba(245,158,11,0.55)'
                              : undefined,
                      filter: isSelected
                        ? 'brightness(1.25) saturate(1.2)'
                        : isCrystalChest
                          ? 'brightness(1.08) saturate(1.5)'
                          : undefined,
                    }}
                    title={
                      isCrystalChest
                        ? 'Baú com cristal'
                        : PIECE_LABELS[piece.type]
                    }
                  >
                    {hasPieceImage && (
                      <div
                        className="absolute rounded-full bg-black"
                        style={{ inset: '0.5%', zIndex: 0 }}
                        aria-hidden
                      />
                    )}
                    {isCrystalChest && !matched && (
                      <div
                        className="pointer-events-none absolute inset-0 z-[2] rounded-full"
                        style={{
                          background:
                            'radial-gradient(circle, rgba(220,38,38,0.25) 0%, rgba(127,29,29,0.45) 70%, rgba(69,10,10,0.35) 100%)',
                          mixBlendMode: 'multiply',
                        }}
                        aria-hidden
                      />
                    )}
                    <div className="absolute inset-0 z-[1] flex items-center justify-center">
                      {!matched && (
                        <PieceIcon
                          type={piece.type}
                          crystalChest={isCrystalChest}
                        />
                      )}
                      {matched && <MatchEffect type={piece.type} />}
                    </div>
                    {offspringMarks.some((m) => m.row === r && m.col === c) && (
                      <div
                        className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none offspring-overlay"
                        aria-hidden
                      >
                        <div className="offspring-chip relative aspect-square w-full h-full rounded-full overflow-hidden">
                          <div className="absolute rounded-full bg-black" style={{ inset: '0.5%' }} />
                          <img
                            src="/bosses/jaekelopterus-filhote.png"
                            alt="Filhote"
                            className="offspring-bug absolute inset-0 m-auto object-contain"
                            style={{ width: '70%', height: '70%', borderRadius: '50%' }}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })
            )}
            <ParticleLayer bursts={bursts} onBurstsConsumed={consumeBursts} />
          </div>
        </div>

        </div>
      </div>

      <style>{`
        @keyframes spark {
          0% { opacity: 0; transform: scaleY(0.2); }
          20% { opacity: 1; }
          70% { opacity: 1; transform: scaleY(1.1); }
          100% { opacity: 0; transform: scaleY(1.4); }
        }
        @keyframes bubblePop {
          0% { transform: translateY(0) scale(0.4); opacity: 0; }
          15% { opacity: 0.95; }
          70% { opacity: 0.7; }
          100% { transform: translateY(-36px) scale(1.35); opacity: 0; }
        }
        @keyframes shine {
          0% { transform: translateX(-100%) rotate(25deg); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateX(100%) rotate(25deg); opacity: 0; }
        }
        @keyframes thrust {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          60% { opacity: 0.85; }
          100% { transform: translateY(-28px) scale(0.35); opacity: 0; }
        }
        @keyframes coinFly {
          0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
          20% { opacity: 1; transform: translate(-50%, -8px) scale(1); }
          100% {
            transform: translate(calc(-50% + var(--dx, 0px)), var(--dy, -48px)) scale(1.1);
            opacity: 0;
          }
        }
        @keyframes glassShard {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) scale(1);
            opacity: 1;
          }
          30% { opacity: 1; }
          100% {
            transform: translate(calc(-50% + var(--sx) * 1.4), calc(-50% + var(--sy) * 1.4)) rotate(var(--sr)) scale(0.4);
            opacity: 0;
          }
        }
        @keyframes glassFlash {
          0% { opacity: 0.9; }
          40% { opacity: 0.45; }
          100% { opacity: 0; }
        }
        @keyframes toastIn {
          0% { transform: translate(-50%, -20px); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes energyBubble {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.35; }
          50% { transform: translateX(-50%) translateY(-10px); opacity: 0.9; }
        }
        @keyframes energySpark {
          0% { opacity: 0; transform: scaleY(0.2); }
          25% { opacity: 1; }
          100% { opacity: 0; transform: scaleY(1.4) translateY(-8px); }
        }
        @keyframes energyChargePulse {
          0% { filter: brightness(1); transform: scale(1); }
          40% { filter: brightness(1.35); transform: scale(1.03); }
          100% { filter: brightness(1); transform: scale(1); }
        }
        @keyframes energyDrainPulse {
          0% { filter: brightness(1); opacity: 1; }
          50% { filter: brightness(0.82); opacity: 0.92; }
          100% { filter: brightness(1); opacity: 1; }
        }
        @keyframes energyLowShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        .energy-flash {
          opacity: 0;
          background: transparent;
          pointer-events: none;
        }
        .energy-fx-charge .energy-flash {
          background: radial-gradient(ellipse at center, rgba(250,204,21,0.45), transparent 65%);
        }
        .energy-fx-drain .energy-flash {
          background: radial-gradient(ellipse at center, rgba(80,80,80,0.35), transparent 65%);
        }
        .energy-fx-charge .energy-battery-body {
          animation: energyChargePulse 0.75s ease-out;
        }
        .energy-fx-charge .energy-flash {
          animation: energyFlashOn 0.75s ease-out;
        }
        .energy-fx-drain .energy-battery-body {
          animation: energyDrainPulse 0.55s ease-out;
        }
        .energy-fx-drain .energy-flash {
          background: radial-gradient(ellipse at center, rgba(80,80,80,0.45), transparent 65%);
          animation: energyFlashOn 0.55s ease-out;
        }
        .energy-fx-low .energy-battery-body {
          animation: energyLowShake 0.45s ease-in-out infinite, energyDrainPulse 1.1s ease-in-out infinite;
        }
        .energy-fx-low .energy-liquid {
          box-shadow: 0 0 16px 4px rgba(239,68,68,0.85) !important;
          animation: energyLowLiquid 0.9s ease-in-out infinite alternate;
        }
        @keyframes energyFlashOn {
          0% { opacity: 0; }
          30% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes energyLowLiquid {
          from { filter: brightness(1); }
          to { filter: brightness(1.35); }
        }
        @keyframes offspringIn {
          0% { transform: scale(0.2) translateY(8px); opacity: 0; }
          15% { transform: scale(1.15) translateY(0); opacity: 1; }
          80% { transform: scale(1) translateY(0); opacity: 1; }
          100% { transform: scale(0.6) translateY(-6px); opacity: 0; }
        }
        .offspring-overlay {
          animation: offspringIn 2s ease-out forwards;
        }
        .offspring-chip {
          border-radius: 50%;
          overflow: hidden;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35);
        }

        .tile-selected {
          animation: tilePulse 0.9s ease-in-out infinite alternate;
        }
        @keyframes tilePulse {
          from { filter: brightness(1.15) saturate(1.15); }
          to { filter: brightness(1.4) saturate(1.35); }
        }
        .eng-img-btn {
          padding: 0;
          border: none;
          background: transparent;
          border-radius: 50%;
          cursor: pointer;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(0,0,0,0.55);
        }
        .eng-img-btn .eng-img-face {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          transition: filter 0.2s, box-shadow 0.2s, transform 0.15s;
          filter: brightness(0.95) saturate(1);
        }
        .eng-img-on .eng-img-face {
          filter: brightness(1.35) saturate(1.4);
          box-shadow: 0 0 16px 5px rgba(255, 240, 150, 0.9), 0 0 32px 8px rgba(250, 204, 21, 0.45);
          animation: engGlow 1.2s ease-in-out infinite alternate;
        }
        @keyframes engGlow {
          from { box-shadow: 0 0 12px 3px rgba(255, 240, 150, 0.7), 0 0 22px 6px rgba(250, 204, 21, 0.3); }
          to { box-shadow: 0 0 20px 7px rgba(255, 250, 200, 1), 0 0 36px 10px rgba(250, 204, 21, 0.55); }
        }
        .eng-img-on:hover .eng-img-face {
          filter: brightness(1.45) saturate(1.5);
          transform: scale(1.08);
        }
        .eng-img-on:active .eng-img-face {
          transform: scale(0.94);
          filter: brightness(1.55);
        }
        .eng-img-off {
          cursor: not-allowed;
        }
        .eng-img-off .eng-img-face {
          filter: brightness(0.95) saturate(1);
          box-shadow: none;
          opacity: 1;
        }
        .eng-btn {
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          padding: 0;
          border-radius: 6px;
        }
        .eng-btn:active:not(:disabled) {
          background: rgba(34, 211, 238, 0.18);
          box-shadow: inset 0 0 16px rgba(34, 211, 238, 0.45);
        }
        .eng-btn-ready:hover {
          background: rgba(250, 204, 21, 0.12);
          border-color: rgba(250, 204, 21, 0.35);
        }
        .eng-btn-off {
          cursor: not-allowed;
          opacity: 0.55;
        }
        .eng-btn-led {
          position: absolute;
          right: 6%;
          top: 50%;
          transform: translateY(-50%);
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #333;
          box-shadow: none;
        }
        .eng-btn-ready .eng-btn-led {
          background: #4ade80;
          box-shadow: 0 0 8px 2px rgba(74, 222, 128, 0.9);
        }
        .eng-btn-emerg.eng-btn-ready .eng-btn-led {
          background: #fbbf24;
          box-shadow: 0 0 10px 3px rgba(251, 191, 36, 0.95);
          animation: emergBlink 1s step-end infinite;
        }
        @keyframes emergBlink {
          50% { opacity: 0.35; }
        }
        .eng-btn-catalog {
          border-radius: 50%;
        }
        .eng-btn-catalog .eng-btn-led {
          right: 50%;
          top: 50%;
          transform: translate(50%, -50%);
          width: 14px;
          height: 14px;
        }

        .offspring-bug {
          object-fit: contain;
          border-radius: 50%;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.55));
        }
      `}</style>
    </div>
  );
}
