import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';

/**
 * Painéis industriais (arte completa).
 * Ordem dos botões laterais (cima → baixo), igual às imagens.
 * Tela inicial: Tungstênio.
 */
const MODULES = [
  {
    id: 'tungsten_plates',
    short: 'TUNGSTENIO',
    name: 'Placas de Tungstênio',
    image: '/ui/terminal/tungstenio.jpg',
    costData: 300,
    costCrystals: 3,
  },
  {
    id: 'gyro_stabilizer',
    short: 'GIROSCOPIO',
    name: 'Giroscópio Hidráulico',
    image: '/ui/terminal/giroscopio.jpg',
    costData: 250,
    costCrystals: 2,
  },
  {
    id: 'interface_shield',
    short: 'BLINDAGEM',
    name: 'Conectores Blindados',
    image: '/ui/terminal/blindagem.jpg',
    costData: 250,
    costCrystals: 2,
  },
  {
    id: 'quantum_jet',
    short: 'HIDROJATO',
    name: 'Turbo Hidrojato Quântico',
    image: '/ui/terminal/hidrojato.jpg',
    costData: 400,
    costCrystals: 5,
  },
  {
    id: 'geometry_scanner',
    short: 'SCANNER',
    name: 'Scanner Óptico de Geometria',
    image: '/ui/terminal/scanner.jpg',
    costData: 500,
    costCrystals: 6,
  },
  {
    id: 'hull_nanites',
    short: 'NANITES',
    name: 'Nanites de Casco',
    image: '/ui/terminal/nanites.jpg',
    costData: 150,
    costCrystals: 1,
  },
] as const;

/** Hotspots laterais (só o botão circular; a placa com o nome vem da arte) */
const SIDE_BTNS = [
  { left: '7.8%', top: '22.3%', width: '3.1%', height: '4.2%' },
  { left: '7.6%', top: '32.9%', width: '3.1%', height: '4.2%' },
  { left: '7.3%', top: '43.2%', width: '3.1%', height: '4.2%' },
  { left: '7.1%', top: '53.9%', width: '3.1%', height: '4.2%' },
  { left: '6.9%', top: '64.6%', width: '3.1%', height: '4.2%' },
  { left: '6.6%', top: '75.3%', width: '3.1%', height: '4.2%' },
];

/** Knobs inferiores */
const FOOTER_BTNS = {
  install: { left: '42%', top: '80%', width: '5%', height: '7%' },
  back: { left: '76%', top: '80%', width: '5%', height: '7%' },
};

/**
 * Dados e Cristais — caixas independentes (posição, largura, altura).
 * Use left OU right (não os dois). Fundo preto em cada caixa.
 */
const RESOURCE_BOXES = {
  dados: {
    left: '74.2%',
    top: '9.2%',
    width: '6%',
    height: '4.4%',
    fontSize: '1.85rem',
  },
  cristais: {
    left: '86.2%',
    top: '9.2%',
    width: '6%',
    height: '4.5%',
    fontSize: '1.85rem',
  },
};

const ACTION_DELAY_MS = 2000;

/**
 * Caixa de aviso ao acionar INSTALAR / VOLTAR.
 * Ajuste left, top, width e height livremente (percentuais da tela).
 * Se preferir só centralizar: deixe left/top vazios e use center: true.
 */
const NOTICE_BOX = {
  center: false,
  left: '35.5%',
  top: '25%',
  width: '50%',
  height: '49%',
};

/** Brilho de “aceso” — sem borda/círculo visível */
const GLOW_ON =
  '0 0 14px 6px rgba(251,191,36,0.75), 0 0 28px 10px rgba(245,158,11,0.45)';

export function UpgradeMenu() {
  const { progress, buyUpgrade, setScreen, isGameActive } = useGameStore();
  const [selectedId, setSelectedId] = useState<string>(MODULES[0].id);
  const [toast, setToast] = useState<string | null>(null);
  /** Botão lateral piscando ao acionar */
  const [sideLit, setSideLit] = useState<string | null>(null);
  /** Footer em contagem: aceso por 2s antes da ação */
  const [pendingAction, setPendingAction] = useState<'install' | 'back' | null>(
    null
  );
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const selected = MODULES.find((m) => m.id === selectedId) ?? MODULES[0];
  const owned = progress.unlockedUpgrades.includes(selected.id);
  const canBuy =
    !owned &&
    progress.biologicalData >= selected.costData &&
    progress.pureCrystals >= selected.costCrystals;

  const clearPending = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPendingAction(null);
  };

  const handleSideClick = (id: string) => {
    if (pendingAction) return; // evita troca no meio da contagem do rodapé
    setSelectedId(id);
    setSideLit(id);
    window.setTimeout(() => setSideLit((cur) => (cur === id ? null : cur)), 600);
  };

  const runInstall = () => {
    const ok = buyUpgrade(selected.id);
    setToast(
      ok
        ? `Módulo instalado: ${selected.name}`
        : owned
          ? 'Módulo já instalado.'
          : 'Recursos insuficientes (Dados / Cristais).'
    );
    window.setTimeout(() => setToast(null), 2200);
  };

  const runBack = () => {
    setScreen('cabin');
  };

  /** Acende e só depois de 2s executa */
  const armFooterAction = (action: 'install' | 'back') => {
    if (pendingAction) return;
    if (action === 'install' && (owned || !canBuy)) {
      setToast(
        owned
          ? 'Módulo já instalado.'
          : 'Recursos insuficientes (Dados / Cristais).'
      );
      window.setTimeout(() => setToast(null), 2200);
      return;
    }

    setPendingAction(action);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setPendingAction(null);
      if (action === 'install') runInstall();
      else runBack();
    }, ACTION_DELAY_MS);
  };

  const isInstallLit = pendingAction === 'install';
  const isBackLit = pendingAction === 'back';

  return (
    <div className="relative h-full w-full overflow-hidden bg-black select-none">
      <img
        key={selected.id}
        src={selected.image}
        alt={selected.name}
        className="absolute inset-0 h-full w-full object-fill"
        draggable={false}
      />

      {/* Dados — caixa independente com fundo preto */}
      <div
        className="pointer-events-none absolute z-20 flex items-center justify-center font-mono font-bold tabular-nums"
        title="Dados"
        style={{
          left: RESOURCE_BOXES.dados.left,
          top: RESOURCE_BOXES.dados.top,
          width: RESOURCE_BOXES.dados.width,
          height: RESOURCE_BOXES.dados.height,
          fontSize: RESOURCE_BOXES.dados.fontSize,
          color: '#fbbf24',
          background: '#000',
          borderRadius: 3,
        }}
      >
        {progress.biologicalData}
      </div>

      {/* Cristais — caixa independente com fundo preto */}
      <div
        className="pointer-events-none absolute z-20 flex items-center justify-center font-mono font-bold tabular-nums"
        title="Cristais"
        style={{
          left: RESOURCE_BOXES.cristais.left,
          top: RESOURCE_BOXES.cristais.top,
          width: RESOURCE_BOXES.cristais.width,
          height: RESOURCE_BOXES.cristais.height,
          fontSize: RESOURCE_BOXES.cristais.fontSize,
          color: '#fbbf24',
          background: '#000',
          borderRadius: 3,
        }}
      >
        {progress.pureCrystals}
      </div>

      {/* Botões laterais — área circular invisível; brilho só ao acionar */}
      {MODULES.map((mod, i) => {
        const pos = SIDE_BTNS[i];
        // Permanece aceso enquanto selecionado (placa do nome continua na arte)
        const lit = selectedId === mod.id;
        return (
          <button
            key={mod.id}
            type="button"
            title={mod.name}
            aria-label={mod.short}
            aria-pressed={selectedId === mod.id}
            onClick={() => handleSideClick(mod.id)}
            className="absolute z-30 border-0 bg-transparent p-0 outline-none"
            style={{
              left: pos.left,
              top: pos.top,
              width: pos.width,
              height: pos.height,
              borderRadius: '50%',
              cursor: pendingAction ? 'wait' : 'pointer',
              boxShadow: lit ? GLOW_ON : 'none',
              transition: 'box-shadow 0.15s ease',
            }}
          />
        );
      })}

      {/* INSTALAR — knob */}
      <button
        type="button"
        title={
          owned
            ? 'Módulo já instalado'
            : canBuy
              ? `Instalar ${selected.name}`
              : 'Recursos insuficientes'
        }
        aria-label="Instalar módulo"
        disabled={!!pendingAction}
        onClick={() => armFooterAction('install')}
        className="absolute z-30 border-0 bg-transparent p-0 outline-none disabled:cursor-wait"
        style={{
          left: FOOTER_BTNS.install.left,
          top: FOOTER_BTNS.install.top,
          width: FOOTER_BTNS.install.width,
          height: FOOTER_BTNS.install.height,
          borderRadius: '50%',
          cursor: pendingAction ? 'wait' : owned || !canBuy ? 'not-allowed' : 'pointer',
          /* Apagado em repouso; acende só nos 2s após o clique */
          boxShadow: isInstallLit ? GLOW_ON : 'none',
          transition: 'box-shadow 0.2s ease',
        }}
      />

      {/* VOLTAR — knob */}
      <button
        type="button"
        title="Voltar à cabine"
        aria-label="Voltar"
        disabled={!!pendingAction}
        onClick={() => armFooterAction('back')}
        className="absolute z-30 border-0 bg-transparent p-0 outline-none disabled:cursor-wait"
        style={{
          left: FOOTER_BTNS.back.left,
          top: FOOTER_BTNS.back.top,
          width: FOOTER_BTNS.back.width,
          height: FOOTER_BTNS.back.height,
          borderRadius: '50%',
          cursor: pendingAction ? 'wait' : 'pointer',
          boxShadow: isBackLit ? GLOW_ON : 'none',
          transition: 'box-shadow 0.2s ease',
        }}
      />

      {pendingAction && (
        <div
          className={
            NOTICE_BOX.center
              ? 'pointer-events-none absolute inset-0 z-40 flex items-center justify-center'
              : 'pointer-events-none absolute inset-0 z-40'
          }
        >
          {/* Caixa de aviso — posição/tamanho em NOTICE_BOX */}
          <div
            className="flex items-center justify-center rounded-xl border-2 border-amber-500/60 bg-black/90 px-6 py-8 text-center font-mono font-bold text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.35)]"
            style={
              NOTICE_BOX.center
                ? {
                    width: NOTICE_BOX.width,
                    height: NOTICE_BOX.height,
                    maxWidth: NOTICE_BOX.width,
                    maxHeight: NOTICE_BOX.height,
                  }
                : {
                    position: 'absolute',
                    left: NOTICE_BOX.left,
                    top: NOTICE_BOX.top,
                    width: NOTICE_BOX.width,
                    height: NOTICE_BOX.height,
                  }
            }
          >
            <span className="text-base sm:text-3xl tracking-wide">
              {pendingAction === 'install'
                ? 'Instalando Módulo…'
                : 'Voltando para a Cabine…'}
            </span>
          </div>
        </div>
      )}

      {toast && (
        <div className="absolute bottom-[18%] left-1/2 z-40 max-w-[80%] -translate-x-1/2 rounded-lg border border-amber-500/50 bg-black/85 px-4 py-2 text-center text-sm text-amber-100 shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
