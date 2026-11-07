import { useGameStore } from '../../store/gameStore';
import { unlockAudio } from '../../systems/sounds';

// Bolhas nas laterais
const BUBBLES = [
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `L-${i}`,
    left: `${4 + (i % 4) * 3.5}%`,
    size: 4 + (i % 3) * 3,
    duration: 7 + (i % 4) * 2,
    delay: i * 0.85,
  })),
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `R-${i}`,
    left: `${83 + (i % 4) * 3.5}%`,
    size: 4 + (i % 3) * 3,
    duration: 7 + (i % 4) * 2,
    delay: 0.4 + i * 0.85,
  })),
];

export function MainMenu() {
  const { setScreen, startLevel, progress, resetGame } = useGameStore();

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      {/* Água profunda */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0284c7] via-[#0369a1] to-[#0c4a6e]" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-[#020617]/90" />

      {/* Superfície luminosa */}
      <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-sky-100/50 to-transparent pointer-events-none" />

      {/* Raios de luz centrais */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[55%] h-[90%]"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.55) 0%, rgba(186,230,253,0.22) 28%, transparent 70%)',
            filter: 'blur(14px)',
            animation: 'rayPulse 7s ease-in-out infinite',
          }}
        />
        <div
          className="absolute top-0 left-[22%] w-[16%] h-[80%]"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, transparent 60%)',
            transform: 'rotate(7deg)',
            filter: 'blur(10px)',
            animation: 'rayPulse 9s ease-in-out infinite',
          }}
        />
        <div
          className="absolute top-0 left-[62%] w-[15%] h-[75%]"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, transparent 55%)',
            transform: 'rotate(-6deg)',
            filter: 'blur(10px)',
            animation: 'rayPulse 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute top-0 left-[40%] w-[10%] h-[85%]"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, transparent 58%)',
            transform: 'rotate(2deg)',
            filter: 'blur(8px)',
            animation: 'rayPulse 6s ease-in-out infinite',
          }}
        />
      </div>

      {/* Brilho no centro da superfície */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-20 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255,255,255,0.65), transparent 70%)',
          filter: 'blur(6px)',
        }}
      />

      {/* Bolhas laterais */}
      {BUBBLES.map((b) => (
        <div
          key={b.id}
          className="absolute rounded-full bg-white/25 border border-white/30 pointer-events-none"
          style={{
            left: b.left,
            bottom: '4%',
            width: b.size,
            height: b.size,
            animation: `bubbleUp ${b.duration}s ease-out infinite`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}

      {/* Fundo suave (sem corais, sem plantas) */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#020617]/80 to-transparent pointer-events-none" />

      {/* Vinheta */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(2,6,23,0.45)_100%)]" />

      {/* === MENU === */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-lg">
        <div className="space-y-2">
          <p className="text-cyan-50 text-sm tracking-[0.3em] uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            ECO-DEEP Apresenta
          </p>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white drop-shadow-[0_2px_25px_rgba(0,0,0,0.8)]">
            Consequência
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-sky-100">
              e Fúria
            </span>
          </h1>
          <p className="text-cyan-50/80 text-sm mt-3 drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
            Um Match-3 narrativo nas profundezas do oceano
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            type="button"
            onClick={() => {
              unlockAudio();
              resetGame();
              startLevel(1);
            }}
            className="w-full py-3.5 px-6 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-bold text-lg shadow-xl shadow-cyan-950/50 transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/30"
          >
            Nova Jornada
          </button>

          <button
            type="button"
            onClick={() => setScreen('cabin')}
            className="w-full py-3 px-6 rounded-xl bg-slate-950/60 hover:bg-slate-900/80 text-white font-semibold border border-white/20 backdrop-blur-md transition-all"
          >
            Entrar no Nautilus-X
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bubbleUp {
          0%   { transform: translateY(0) scale(0.5); opacity: 0; }
          10%  { opacity: 0.6; }
          70%  { opacity: 0.3; }
          100% { transform: translateY(-90vh) scale(1.2); opacity: 0; }
        }
        @keyframes rayPulse {
          0%, 100% { opacity: 0.35; }
          50%      { opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}
