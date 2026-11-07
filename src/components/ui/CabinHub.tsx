import { useGameStore } from '../../store/gameStore';

export function CabinHub() {
  const {
    progress,
    oceanHealth,
    cabinMood,
    startLevel,
    setScreen,
    currentBoss,
    isGameActive,
    currentLevelConfig,
    board,
  } = useGameStore();
  const revengePending = progress.jaekelopterusRevengePending;
  /** Missão em andamento (saiu para catálogo/cabine sem terminar) */
  const canContinue =
    isGameActive &&
    !!currentLevelConfig &&
    board.length > 0;

  const statusLabel =
    cabinMood === 'critical'
      ? 'ALERTA · Ambiente hostil'
      : cabinMood === 'victory'
        ? 'ESTÁVEL · Ecossistema recuperando'
        : cabinMood === 'tense'
          ? 'OPERACIONAL · Vigilância ativa'
          : 'CALMO · Sistemas nominais';

  const statusColor =
    cabinMood === 'critical'
      ? 'text-red-300'
      : cabinMood === 'victory'
        ? 'text-emerald-300'
        : 'text-cyan-300';

  const healthColor =
    oceanHealth > 60
      ? 'bg-emerald-500'
      : oceanHealth > 30
        ? 'bg-amber-500'
        : 'bg-red-500';

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 text-white">
      {/* Fundo: interior do submarino */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: "url('/cabin/interior.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/55 to-slate-950/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(2,6,23,0.75)_100%)]" />

      {/* Estrutura metálica da cabine */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Painel superior */}
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-600/80 bg-slate-950/80 backdrop-blur-md shadow-[inset_0_1px_0_rgba(148,163,184,0.15)]">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                cabinMood === 'critical'
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-cyan-400 animate-pulse'
              }`}
            />
            <div className="min-w-0">
              <div className="text-sm font-mono font-bold text-cyan-300 truncate">
                NAUTILUS-X · Cabine
              </div>
              <div className={`text-[11px] font-mono ${statusColor}`}>
                {statusLabel}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-300 shrink-0">
            <span className="rounded-md border border-slate-600 bg-slate-900/80 px-2 py-1">
              <span className="text-slate-500 mr-1">Dados</span>🧬 {progress.biologicalData}
            </span>
            <span className="rounded-md border border-slate-600 bg-slate-900/80 px-2 py-1">
              <span className="text-slate-500 mr-1">Cristais</span>💎 {progress.pureCrystals}
            </span>
          </div>
        </header>

        <main className="flex-1 flex flex-col lg:flex-row items-stretch justify-center gap-4 p-4 md:p-6 min-h-0">
          {/* Visor / portal */}
          <section className="flex-1 flex flex-col items-center justify-center min-w-0">
            <div className="w-full max-w-2xl">
              <div className="rounded-[28px] p-2 md:p-3 bg-gradient-to-b from-slate-500 via-slate-700 to-slate-900 border-2 border-slate-500 shadow-[0_12px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.15)]">
                <div className="relative aspect-[16/10] rounded-[20px] overflow-hidden border border-cyan-900/60 bg-slate-950">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-90"
                    style={{ backgroundImage: "url('/cabin/interior.jpg')" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-900/30" />
                  {/* Reflexo do vidro */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />

                  <div className="absolute inset-0 flex flex-col items-center justify-end p-4 md:p-5">
                    <div className="w-full rounded-xl border border-slate-600/80 bg-slate-950/75 backdrop-blur-sm px-3 py-2">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-300 mb-1">
                        <span className="font-mono uppercase tracking-wider text-cyan-300/90">
                          Portal externo
                        </span>
                        <span className="font-mono">
                          Oceano {oceanHealth}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-700 ${healthColor}`}
                          style={{ width: `${oceanHealth}%` }}
                        />
                      </div>
                      {currentBoss && (
                        <p className="mt-1.5 text-red-300 text-[11px] font-bold uppercase tracking-wider">
                          Presença detectada: {currentBoss}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-slate-400 text-xs mt-2 font-mono">
                Cabine pressurizada · Nautilus-X
              </p>
            </div>
          </section>

          {/* Console de comando lateral */}
          <aside className="w-full lg:w-80 shrink-0 flex flex-col justify-center">
            <div className="rounded-2xl border border-slate-600 bg-slate-950/85 backdrop-blur-md p-4 shadow-[inset_0_1px_0_rgba(148,163,184,0.12),0_10px_30px_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold tracking-wide text-cyan-300 uppercase">
                  Console de missão
                </h2>
                <span className="text-[10px] font-mono text-slate-500">
                  NIV {progress.currentLevel}
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Operações a partir da cabine. Use o terminal de engenharia para
                instalar módulos antes de descer às profundezas.
              </p>

              {revengePending && (
                <div className="mb-3 text-center text-xs text-red-200 bg-red-950/60 border border-red-800 rounded-lg px-3 py-2">
                  ⚠️ Jaekelopterus em fúria — próximo confronto no Ninho da Fúria
                  será em modo Revanche.
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (canContinue) {
                      setScreen('match3');
                      return;
                    }
                    startLevel(progress.currentLevel);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-b from-cyan-500 to-cyan-700 hover:from-cyan-400 hover:to-cyan-600 text-white font-bold shadow-[0_3px_0_#155e75] active:translate-y-0.5 active:shadow-none transition-all"
                >
                  {canContinue
                    ? 'Continuar a Missão'
                    : revengePending && progress.currentLevel === 3
                      ? 'Enfrentar Jaekelopterus (Revanche)'
                      : `Iniciar missão (Nível ${progress.currentLevel})`}
                </button>

                <button
                  type="button"
                  onClick={() => setScreen('upgrade_menu')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-bold border border-emerald-400/40 shadow-[0_3px_0_#065f46] active:translate-y-0.5 active:shadow-none transition-all"
                >
                  Terminal de Engenharia
                </button>

                <button
                  type="button"
                  onClick={() => setScreen('main_menu')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-900 font-bold border border-amber-300/50 shadow-[0_3px_0_#b45309] active:translate-y-0.5 active:shadow-none transition-all"
                >
                  Voltar ao Menu
                </button>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
