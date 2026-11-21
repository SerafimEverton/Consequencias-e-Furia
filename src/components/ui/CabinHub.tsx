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
      <div className="absolute inset-0 bg-linear-to-b from-slate-950/75 via-slate-950/55 to-slate-950/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(2,6,23,0.75)_100%)]" />

      {/* Estrutura metálica da cabine */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Painel superior */}
        <header className="cabin-header relative flex flex-wrap items-center justify-between gap-3 border-b border-cyan-900/70 bg-slate-950/85 px-5 py-3 shadow-[inset_0_1px_0_rgba(148,163,184,0.15)] backdrop-blur-md">
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
          <div className="cabin-hud" aria-label="Recursos de bordo">
            <div className="cabin-gauge">
              <span className="cabin-gauge-icon" aria-hidden="true">🧬</span>
              <span className="cabin-gauge-copy">
                <span className="cabin-gauge-label">DADOS BIOLÓGICOS</span>
                <span className="cabin-gauge-value">{progress.biologicalData}</span>
              </span>
            </div>
            <div className="cabin-gauge cabin-gauge-crystal">
              <span className="cabin-gauge-icon" aria-hidden="true">💎</span>
              <span className="cabin-gauge-copy">
                <span className="cabin-gauge-label">CRISTAIS PUROS</span>
                <span className="cabin-gauge-value">{progress.pureCrystals}</span>
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col lg:flex-row items-stretch justify-center gap-4 p-4 md:p-6 min-h-0">
          {/* Visor / portal */}
          <section className="flex-1 flex flex-col items-center justify-center min-w-0">
            <div className="w-full max-w-2xl">
              <div className="rounded-[28px] p-2 md:p-3 bg-linear-to-b from-slate-500 via-slate-700 to-slate-900 border-2 border-slate-500 shadow-[0_12px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.15)]">
                <div className="relative aspect-16/10 rounded-[20px] overflow-hidden border border-cyan-900/60 bg-slate-950">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-90"
                    style={{ backgroundImage: "url('/cabin/interior.jpg')" }}
                  />
                  <img
                    src="/bosses/jaekelopterus-cabin.jpg"
                    alt="Jaekelopterus identificado pelo sonar"
                    className="absolute inset-0 h-full w-full object-cover object-center opacity-45 blur-md scale-105"
                    draggable={false}
                    aria-hidden="true"
                  />
                  <img
                    src="/bosses/jaekelopterus-cabin.jpg"
                    alt="Jaekelopterus identificado pelo sonar"
                    className="cabin-boss-img"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-slate-950/5 to-slate-950/20 pointer-events-none" />
                  {/* Reflexo do vidro e leitura de sonar */}
                  <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
                  <div className="cabin-boss-alert">ALERTA DE SONAR · CONTATO BIOLÓGICO</div>

                  <div className="absolute inset-0 flex flex-col items-center justify-end p-4 md:p-5">
                    <div className="w-full rounded-xl border border-slate-600/80 bg-slate-950/75 backdrop-blur-sm px-3 py-2">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-300 mb-1">
                        <span className="font-mono uppercase tracking-wider text-cyan-300/90">
                          ESTADO DO OCEANO
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
            <div className="cabin-console rounded-2xl p-4 backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <div className="cabin-console-title">
                  <span className="cabin-console-kicker">PAINEL DE COMANDO</span>
                  <h2 className="text-sm font-black tracking-wide text-white uppercase">CONSOLE DA MISSÃO</h2>
                </div>
                <span className="cabin-level-badge">NÍVEL {String(progress.currentLevel).padStart(2, '0')}</span>
              </div>

              <p className="text-base text-slate-200 mb-4 leading-relaxed">
                Missões rendem Dados e Cristais. Aqui você os investe em melhorias para o Nautilus-X.
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
                  className="w-full py-3 rounded-xl bg-linear-to-b from-cyan-500 to-cyan-700 hover:from-cyan-400 hover:to-cyan-600 text-white font-bold shadow-[0_3px_0_#155e75] active:translate-y-0.5 active:shadow-none transition-all"
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
                  className="w-full py-2.5 rounded-xl bg-linear-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-bold border border-emerald-400/40 shadow-[0_3px_0_#065f46] active:translate-y-0.5 active:shadow-none transition-all"
                >
                  Terminal de Engenharia
                </button>

                <button
                  type="button"
                  onClick={() => setScreen('main_menu')}
                  className="w-full py-2.5 rounded-xl bg-linear-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-900 font-bold border border-amber-300/50 shadow-[0_3px_0_#b45309] active:translate-y-0.5 active:shadow-none transition-all"
                >
                  Voltar ao Menu
                </button>
              </div>

              <details className="mt-3 rounded-xl border border-cyan-700/50 bg-slate-900/85 p-3 open:border-cyan-400/60">
                <summary className="cursor-pointer list-none text-sm font-black uppercase tracking-wider text-cyan-200">
                  Manual de bordo · Ajuda do jogo
                  <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-slate-400">Abrir respostas rápidas</span>
                </summary>
                <div className="mt-3 max-h-[30vh] space-y-2 overflow-y-auto pr-1 text-xs leading-relaxed text-slate-200">
                  <details className="rounded-lg border border-slate-700 bg-black/30 p-2">
                    <summary className="cursor-pointer font-bold text-cyan-100">Como funcionam as combinações?</summary>
                    <p className="mt-2">Troque peças vizinhas para alinhar 3 ou mais peças iguais na horizontal ou na vertical. O tabuleiro também aceita um bloco 2×2 de peças iguais. Cada troca consome um movimento e 9 pontos de energia, mesmo que não forme uma combinação.</p>
                  </details>
                  <details className="rounded-lg border border-slate-700 bg-black/30 p-2">
                    <summary className="cursor-pointer font-bold text-cyan-100">Posso mover a mesma peça várias vezes?</summary>
                    <p className="mt-2">Sim. Você pode voltar a selecionar e mover uma peça quantas vezes quiser enquanto ainda tiver movimentos e energia. Cada troca é entre peças vizinhas na horizontal ou na vertical e custa 1 movimento e 9 pontos de energia.</p>
                  </details>
                  <details className="rounded-lg border border-slate-700 bg-black/30 p-2">
                    <summary className="cursor-pointer font-bold text-cyan-100">O que fazem os baús e como abri-los?</summary>
                    <p className="mt-2">Baús comuns podem ser abertos sem combinar os próprios baús: combine a peça-alvo da missão ao lado de um baú para receber 15–40 Dados, 1–3 movimentos extras e 5 pontos de energia. Se alinhar 3 ou mais baús na horizontal ou na vertical, eles formam um baú especial com Cristais; combine a peça-alvo ao lado dele para coletar a recompensa. Um bloco 2×2 de baús não conta como alinhamento especial.</p>
                  </details>
                  <details className="rounded-lg border border-slate-700 bg-black/30 p-2">
                    <summary className="cursor-pointer font-bold text-cyan-100">O que acontece nos confrontos?</summary>
                    <p className="mt-2">Os ataques dos chefes podem danificar o casco. Se perder para eles, a missão seguinte será em modo revanche e os chefes terão uma ajuda extra.</p>
                  </details>
                  <details className="rounded-lg border border-slate-700 bg-black/30 p-2">
                    <summary className="cursor-pointer font-bold text-cyan-100">Para que serve o botão Emergência?</summary>
                    <p className="mt-2">Custa 40 Dados e acrescenta 3 movimentos e até 8 pontos de energia, sem ultrapassar 100. Quando a bateria chega a 4% ou menos, surge o aviso de energia crítica; após 1,5 segundo começa uma contagem de 5 segundos. Acione Emergência antes de a contagem terminar.</p>
                  </details>
                  <details className="rounded-lg border border-slate-700 bg-black/30 p-2">
                    <summary className="cursor-pointer font-bold text-cyan-100">Como funciona Reparar Casco?</summary>
                    <p className="mt-2">É preciso instalar Nanites de Casco no Terminal de Engenharia (150 Dados e 1 Cristal). Durante a missão, cada reparo custa 30 Dados e restaura 20 pontos percentuais do casco; só pode ser usado quando o casco está danificado e você tem Dados suficientes.</p>
                  </details>
                  <details className="rounded-lg border border-slate-700 bg-black/30 p-2">
                    <summary className="cursor-pointer font-bold text-cyan-100">O que significam os avisos no visor superior?</summary>
                    <p className="mt-2">O aviso vermelho indica energia crítica e pede o uso de Emergência. O painel dourado informa a abertura de um baú e mostra Dados e movimentos ganhos. O painel violeta anuncia Cristais guardados em um baú especial, gerado ao cruzar marcos de 500 pontos. Nos confrontos, a imagem/alerta do chefe ou dos filhotes sinaliza a presença e os ataques; a barra ao lado mostra a integridade do casco.</p>
                  </details>
                  <details className="rounded-lg border border-slate-700 bg-black/30 p-2">
                    <summary className="cursor-pointer font-bold text-cyan-100">Como ganho Dados e Cristais?</summary>
                    <p className="mt-2">Baús comuns dão 15–40 Dados. Ao vencer uma missão, você recebe 50 + 10 por número da fase (por exemplo: fase 1 = 60 Dados; fase 3 = 80). A cada marco de 500 pontos na partida surge um baú especial com Cristais, que só entram no inventário quando aberto com uma combinação da peça-alvo ao lado dele. Vencer uma revanche de chefe também concede 1 Cristal.</p>
                  </details>
                  <details className="rounded-lg border border-slate-700 bg-black/30 p-2">
                    <summary className="cursor-pointer font-bold text-cyan-100">Como volto à cabine?</summary>
                    <p className="mt-2">Durante a partida, use “Voltar à cabine” no canto superior direito; a missão fica pausada e você pode retomá-la pelo botão “Continuar a Missão”. Depois de vencer, você retorna à cabine. Depois de perder, aguarde a tela de Game Over e escolha “Voltar à cabine”.</p>
                  </details>
                </div>
              </details>
            </div>
          </aside>
        </main>
      </div>

      <style>{`
        .cabin-header { min-height: 76px; }
        .cabin-hud {
          position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
          z-index: 20; display: flex; gap: 10px; padding: 6px 9px;
          border: 1px solid rgba(103,232,249,.34); border-radius: 14px;
          background: linear-gradient(180deg, rgba(15,23,42,.96), rgba(2,6,23,.96));
          box-shadow: 0 0 20px rgba(34,211,238,.18), inset 0 1px 0 rgba(255,255,255,.12);
        }
        .cabin-gauge {
          display: flex; align-items: center; gap: 9px; min-width: 150px;
          padding: 5px 10px; border: 1px solid rgba(103,232,249,.28); border-radius: 10px;
          background: linear-gradient(135deg, rgba(30,41,59,.95), rgba(2,6,23,.96));
        }
        .cabin-gauge-crystal { border-color: rgba(125,211,252,.32); }
        .cabin-gauge-icon { font-size: 22px; }
        .cabin-gauge-copy { display: flex; flex-direction: column; }
        .cabin-gauge-label { color: #a5f3fc; font: 700 9px/1.2 monospace; letter-spacing: .13em; }
        .cabin-gauge-value { color: #fff; font: 900 18px/1.2 monospace; font-variant-numeric: tabular-nums; }
        .cabin-gauge-crystal .cabin-gauge-label { color: #bae6fd; }
        .cabin-level-badge {
          flex: none; padding: 8px 12px; border: 1px solid rgba(103,232,249,.85); border-radius: 10px;
          color: #e0f2fe; background: linear-gradient(180deg, #0e7490, #164e63);
          box-shadow: 0 0 16px rgba(34,211,238,.48), inset 0 1px 0 rgba(255,255,255,.22);
          font: 900 14px/1 monospace; letter-spacing: .1em; white-space: nowrap;
        }
        .cabin-console {
          border: 2px solid rgba(100,116,139,.95); background: rgba(2,6,23,.91);
          box-shadow: 0 0 0 3px rgba(15,23,42,.92), 0 0 0 4px rgba(103,232,249,.24),
            0 10px 30px rgba(0,0,0,.45), inset 0 1px 0 rgba(148,163,184,.2);
        }
        .cabin-console-title { display: flex; flex-direction: column; gap: 3px; }
        .cabin-console-kicker { color: rgba(165,243,252,.68); font: 700 9px/1.2 monospace; letter-spacing: .17em; }
        .cabin-boss-alert {
          position: absolute; left: 16px; top: 16px; z-index: 5; padding: 5px 9px;
          border: 1px solid rgba(248,113,113,.55); border-radius: 6px; color: #fecaca;
          background: rgba(2,6,23,.78); box-shadow: 0 0 16px rgba(248,113,113,.16);
          font: 700 10px/1.2 monospace; letter-spacing: .12em;
          animation: cabinAlertBlink 1.6s ease-in-out infinite;
        }
        .cabin-boss-img {
          position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain;
          opacity: .55; filter: saturate(.8) hue-rotate(-8deg) contrast(1.08);
          -webkit-mask-image: linear-gradient(to bottom, #000 54%, transparent 100%);
          mask-image: linear-gradient(to bottom, #000 54%, transparent 100%);
        }
        @keyframes cabinAlertBlink { 0%,100% { opacity: 1; } 50% { opacity: .58; } }
        @media (max-width: 760px) {
          .cabin-header { justify-content: center; padding-bottom: 10px; }
          .cabin-header > div:first-child { width: 100%; justify-content: center; }
          .cabin-hud { position: static; transform: none; width: 100%; justify-content: center; }
          .cabin-gauge { min-width: 0; flex: 1; max-width: 190px; }
          .cabin-gauge-label { font-size: 8px; }
          .cabin-boss-alert { left: 10px; top: 10px; font-size: 8px; }
        }
      `}</style>
    </div>
  );
}
