import { useEffect, useRef, useCallback } from 'react';
import { PIECE_COLORS } from '../../types/game';
import type { PieceType } from '../../types/game';

export type ParticleBurst = {
  id: string;
  x: number; // px relative to layer
  y: number;
  color: string;
  kind: 'match' | 'boss' | 'treasure' | 'spark';
  count?: number;
};

type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shape: 'circle' | 'square' | 'spark';
};

type Props = {
  bursts: ParticleBurst[];
  onBurstsConsumed?: () => void;
  className?: string;
};

let pid = 0;

function spawnFromBurst(burst: ParticleBurst): Particle[] {
  const n = burst.count ?? (burst.kind === 'boss' ? 28 : burst.kind === 'treasure' ? 22 : 14);
  const list: Particle[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n + Math.random() * 0.5;
    const speed =
      burst.kind === 'boss'
        ? 2.5 + Math.random() * 4
        : burst.kind === 'treasure'
          ? 1.5 + Math.random() * 3.5
          : 1.2 + Math.random() * 2.8;
    const maxLife = burst.kind === 'boss' ? 45 + Math.random() * 25 : 30 + Math.random() * 25;
    list.push({
      id: pid++,
      x: burst.x + (Math.random() - 0.5) * 8,
      y: burst.y + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (burst.kind === 'treasure' ? 1.5 : 0.5),
      life: maxLife,
      maxLife,
      size:
        burst.kind === 'spark'
          ? 2 + Math.random() * 2
          : 3 + Math.random() * 4,
      color: burst.color,
      shape:
        burst.kind === 'boss'
          ? Math.random() > 0.5
            ? 'square'
            : 'spark'
          : burst.kind === 'treasure'
            ? 'spark'
            : 'circle',
    });
  }
  return list;
}

export function ParticleLayer({ bursts, onBurstsConsumed, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    sizeRef.current = { w: rect.width, h: rect.height };
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  // Ingest new bursts
  useEffect(() => {
    if (!bursts.length) return;
    for (const b of bursts) {
      particlesRef.current.push(...spawnFromBurst(b));
    }
    onBurstsConsumed?.();
  }, [bursts, onBurstsConsumed]);

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [resize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tick = () => {
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);

      const next: Particle[] = [];
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.vx *= 0.99;
        p.life -= 1;
        if (p.life <= 0) continue;

        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;

        if (p.shape === 'spark') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((1 - alpha) * 4);
          ctx.fillRect(-p.size * 1.5, -p.size * 0.3, p.size * 3, p.size * 0.6);
          ctx.restore();
        } else if (p.shape === 'square') {
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
          ctx.fill();
        }
        next.push(p);
      }
      particlesRef.current = next;
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-30 ${className ?? ''}`}
      aria-hidden
    />
  );
}

/** Cor sugerida por tipo de peça */
export function colorForPiece(type: PieceType): string {
  return PIECE_COLORS[type] || '#ffffff';
}
