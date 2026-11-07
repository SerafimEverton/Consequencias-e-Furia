import { create } from 'zustand';
import type {
  GameState,
  Piece,
  PieceType,
  LevelConfig,
  PlayerProgress,
  TreasureEvent,
  BossHudInfo,
} from '../types/game';
import {
  playMatchSound,
  playTreasureSound,
  playSwapSound,
  playEnergyDrainSound,
  playEnergyChargeSound,
  playEnergyLowSound,
  playEnergyEmptySound,
} from '../systems/sounds';
import { getBossProfile, MAX_HULL } from '../systems/bossDamage';

/** Capacidade da bateria do Nautilus-X */
export const MAX_ENERGY = 100;
/** Consumo por movimento válido no tabuleiro */
export const ENERGY_PER_MOVE = 9; // +50% vs 6
/** Recarga por peça de bateria combinada */
export const ENERGY_PER_BATTERY_MATCH = 6; // -25% vs 8
/** Recarga extra ao abrir tesouro */
export const ENERGY_PER_TREASURE = 5; // ~-25% vs 6

const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Resgate de Blue Cove',
    description: 'Estabilize os sistemas do Nautilus-X durante o maremoto.',
    rows: 8,
    cols: 8,
    targetPiece: 'oxygen',
    targetCount: 30,
    maxMoves: 30,
    boss: null,
    isRevenge: false,
    revengeMultiplier: 1,
    backgroundTheme: 'fossa',
  },
  {
    id: 2,
    name: 'A Fossa dos Fósseis',
    description: 'Colete amostras enquanto investiga a chuva de cadáveres.',
    rows: 8,
    cols: 8,
    targetPiece: 'sample',
    targetCount: 38,
    maxMoves: 28,
    boss: null,
    isRevenge: false,
    revengeMultiplier: 1,
    backgroundTheme: 'fossa',
  },
  {
    id: 3,
    name: 'Ninho da Fúria',
    description: 'Primeiro confronto: Jaekelopterus.',
    rows: 8,
    cols: 8,
    targetPiece: 'battery',
    targetCount: 45,
    maxMoves: 25,
    boss: 'jaekelopterus',
    isRevenge: false,
    revengeMultiplier: 1,
    backgroundTheme: 'fossa',
  },
  {
    id: 4,
    name: 'Ninho da Fúria (Revanche)',
    description: 'O escorpião retornou com seus filhotes. Meta dobrada.',
    rows: 8,
    cols: 8,
    targetPiece: 'battery',
    targetCount: 90,
    maxMoves: 30,
    boss: 'jaekelopterus',
    isRevenge: true,
    revengeMultiplier: 2,
    backgroundTheme: 'fossa',
  },
  {
    id: 5,
    name: 'Canal das Correntes',
    description: 'Após o escorpião, avance pelas correntes instáveis.',
    rows: 8,
    cols: 8,
    targetPiece: 'propulsion',
    targetCount: 42,
    maxMoves: 28,
    boss: null,
    isRevenge: false,
    revengeMultiplier: 1,
    backgroundTheme: 'open_sea',
  },
];

const PLAYABLE_TYPES: PieceType[] = [
  'oxygen',
  'battery',
  'sample',
  'crystal',
  'propulsion',
];

function createId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function randomPieceType(): PieceType {
  if (Math.random() < 0.05) return 'treasure';
  return PLAYABLE_TYPES[Math.floor(Math.random() * PLAYABLE_TYPES.length)];
}

function isPlayable(type: PieceType): boolean {
  return type !== 'blocked' && type !== 'empty' && type !== 'toxic';
}

function generateBoard(rows: number, cols: number): Piece[][] {
  const board: Piece[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: Piece[] = [];
    for (let c = 0; c < cols; c++) {
      let type: PieceType =
        PLAYABLE_TYPES[Math.floor(Math.random() * PLAYABLE_TYPES.length)];
      let attempts = 0;

      while (attempts < 10) {
        let conflict = false;
        if (c >= 2 && row[c - 1].type === type && row[c - 2].type === type) {
          conflict = true;
        }
        if (
          r >= 2 &&
          board[r - 1][c].type === type &&
          board[r - 2][c].type === type
        ) {
          conflict = true;
        }
        if (
          r >= 1 &&
          c >= 1 &&
          row[c - 1].type === type &&
          board[r - 1][c].type === type &&
          board[r - 1][c - 1].type === type
        ) {
          conflict = true;
        }
        if (!conflict) break;
        type = PLAYABLE_TYPES[Math.floor(Math.random() * PLAYABLE_TYPES.length)];
        attempts++;
      }

      row.push({ id: createId(), type, row: r, col: c });
    }
    board.push(row);
  }

  const tr = Math.floor(Math.random() * rows);
  const tc = Math.floor(Math.random() * cols);
  board[tr][tc] = {
    id: createId(),
    type: 'treasure',
    row: tr,
    col: tc,
    isSpecial: true,
  };

  return board;
}

function findMatches(board: Piece[][]): { row: number; col: number }[] {
  const matches: { row: number; col: number }[] = [];
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  for (let r = 0; r < rows; r++) {
    let count = 1;
    for (let c = 1; c <= cols; c++) {
      const current = c < cols ? board[r][c].type : null;
      const prev = board[r][c - 1].type;
      if (
        current &&
        current === prev &&
        isPlayable(prev) &&
        prev !== 'treasure'
      ) {
        count++;
      } else {
        if (count >= 3) {
          for (let k = 0; k < count; k++) {
            matches.push({ row: r, col: c - 1 - k });
          }
        }
        count = 1;
      }
    }
  }

  for (let c = 0; c < cols; c++) {
    let count = 1;
    for (let r = 1; r <= rows; r++) {
      const current = r < rows ? board[r][c].type : null;
      const prev = board[r - 1][c].type;
      if (
        current &&
        current === prev &&
        isPlayable(prev) &&
        prev !== 'treasure'
      ) {
        count++;
      } else {
        if (count >= 3) {
          for (let k = 0; k < count; k++) {
            matches.push({ row: r - 1 - k, col: c });
          }
        }
        count = 1;
      }
    }
  }

  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const t = board[r][c].type;
      if (
        isPlayable(t) &&
        t !== 'treasure' &&
        board[r][c + 1].type === t &&
        board[r + 1][c].type === t &&
        board[r + 1][c + 1].type === t
      ) {
        matches.push(
          { row: r, col: c },
          { row: r, col: c + 1 },
          { row: r + 1, col: c },
          { row: r + 1, col: c + 1 }
        );
      }
    }
  }

  return Array.from(
    new Map(matches.map((m) => [`${m.row}-${m.col}`, m])).values()
  );
}

/**
 * Baús alinhados em linha reta (só horizontal ou vertical).
 * 3 ou mais → um único baú com cristal (não é match normal; 2x2 não conta).
 */
function findTreasureLineGroups(
  board: Piece[][]
): { cells: { row: number; col: number }[]; keep: { row: number; col: number } }[] {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const groups: {
    cells: { row: number; col: number }[];
    keep: { row: number; col: number };
  }[] = [];
  const claimed = new Set<string>();

  // Horizontal
  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      if (board[r][c].type !== 'treasure') {
        c++;
        continue;
      }
      let end = c + 1;
      while (end < cols && board[r][end].type === 'treasure') end++;
      const len = end - c;
      if (len >= 3) {
        const cells: { row: number; col: number }[] = [];
        for (let k = c; k < end; k++) cells.push({ row: r, col: k });
        const mid = cells[Math.floor(cells.length / 2)];
        const key = cells.map((x) => `${x.row}-${x.col}`).join('|');
        if (!claimed.has(key)) {
          cells.forEach((x) => claimed.add(`${x.row}-${x.col}`));
          groups.push({ cells, keep: mid });
        }
      }
      c = end;
    }
  }

  // Vertical
  for (let c = 0; c < cols; c++) {
    let r = 0;
    while (r < rows) {
      if (board[r][c].type !== 'treasure') {
        r++;
        continue;
      }
      let end = r + 1;
      while (end < rows && board[end][c].type === 'treasure') end++;
      const len = end - r;
      if (len >= 3) {
        const cells: { row: number; col: number }[] = [];
        for (let k = r; k < end; k++) cells.push({ row: k, col: c });
        // Evita processar célula já usada em linha horizontal
        if (cells.some((x) => claimed.has(`${x.row}-${x.col}`))) {
          r = end;
          continue;
        }
        const mid = cells[Math.floor(cells.length / 2)];
        cells.forEach((x) => claimed.add(`${x.row}-${x.col}`));
        groups.push({ cells, keep: mid });
      }
      r = end;
    }
  }

  return groups;
}

/** Bloqueios adjacentes a um match são destruídos */
function findAdjacentBlockers(
  board: Piece[][],
  matches: { row: number; col: number }[]
): { row: number; col: number }[] {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const result: { row: number; col: number }[] = [];
  const seen = new Set<string>();

  for (const { row, col } of matches) {
    const neighbors = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ];
    for (const [nr, nc] of neighbors) {
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const key = `${nr}-${nc}`;
      if (seen.has(key)) continue;
      if (board[nr][nc].type === 'blocked') {
        seen.add(key);
        result.push({ row: nr, col: nc });
      }
    }
  }
  return result;
}

function findTriggeredTreasures(
  board: Piece[][],
  matches: { row: number; col: number }[],
  targetPiece: PieceType
): { row: number; col: number }[] {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const matchSet = new Set(matches.map((m) => `${m.row}-${m.col}`));
  const hasTarget = matches.some(
    (m) => board[m.row][m.col].type === targetPiece
  );
  if (!hasTarget) return [];

  const treasures: { row: number; col: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].type !== 'treasure') continue;
      const neighbors = [
        [r - 1, c],
        [r + 1, c],
        [r, c - 1],
        [r, c + 1],
      ];
      const adjacent = neighbors.some(
        ([nr, nc]) =>
          nr >= 0 &&
          nr < rows &&
          nc >= 0 &&
          nc < cols &&
          matchSet.has(`${nr}-${nc}`)
      );
      if (adjacent) treasures.push({ row: r, col: c });
    }
  }
  return treasures;
}

const MAX_BLOCKERS_ON_BOARD = 8;

function countBlockers(board: Piece[][]): number {
  let n = 0;
  for (const row of board) {
    for (const p of row) {
      if (p.type === 'blocked') n++;
    }
  }
  return n;
}

/** Opção B: não prioriza peça da missão; evita tesouro */
function pickRandomPlayableCells(
  board: Piece[][],
  count: number,
  avoidType?: PieceType
): { row: number; col: number }[] {
  const preferred: { row: number; col: number }[] = [];
  const fallback: { row: number; col: number }[] = [];

  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      const t = board[r][c].type;
      if (!isPlayable(t) || t === 'treasure') continue;
      if (avoidType && t === avoidType) {
        fallback.push({ row: r, col: c });
      } else {
        preferred.push({ row: r, col: c });
      }
    }
  }

  const shuffle = (arr: { row: number; col: number }[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  shuffle(preferred);
  shuffle(fallback);
  return [...preferred, ...fallback].slice(0, count);
}

function applyGravity(board: Piece[][]): Piece[][] {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = board.map((row) => row.map((p) => ({ ...p })));

  for (let c = 0; c < cols; c++) {
    let emptyRow = rows - 1;
    for (let r = rows - 1; r >= 0; r--) {
      if (newBoard[r][c].type !== 'empty') {
        if (r !== emptyRow) {
          newBoard[emptyRow][c] = {
            ...newBoard[r][c],
            row: emptyRow,
            col: c,
            isMatched: false,
            isOpening: false,
          };
          newBoard[r][c] = {
            id: createId(),
            type: 'empty',
            row: r,
            col: c,
          };
        }
        emptyRow--;
      }
    }
    for (let r = emptyRow; r >= 0; r--) {
      newBoard[r][c] = {
        id: createId(),
        type: randomPieceType(),
        row: r,
        col: c,
      };
    }
  }
  return newBoard;
}

/**
 * Aplica ataques do chefe após uma jogada do jogador (fim da cascata).
 */
function applyBossAttacks(
  board: Piece[][],
  config: LevelConfig,
  primaryCounter: number,
  secondaryCounter: number,
  hull: number
): {
  board: Piece[][];
  primaryCounter: number;
  secondaryCounter: number;
  hull: number;
  lastAttack: 'primary' | 'secondary' | null;
  secondaryTargets: { row: number; col: number }[];
} {
  const profile = getBossProfile(config.boss, config.isRevenge);
  if (!profile) {
    return {
      board,
      primaryCounter,
      secondaryCounter,
      hull,
      lastAttack: null,
      secondaryTargets: [],
    };
  }

  let b = board.map((row) => row.map((p) => ({ ...p })));
  let pCount = primaryCounter + 1;
  let sCount = secondaryCounter + 1;
  let h = hull;
  let lastAttack: 'primary' | 'secondary' | null = null;
  let secondaryTargets: { row: number; col: number }[] = [];

  // Secundário primeiro (filhotes) — revanche
  if (
    profile.secondaryInterval > 0 &&
    sCount >= profile.secondaryInterval &&
    profile.secondaryEffect === 'scramble'
  ) {
    const targets = pickRandomPlayableCells(
      b,
      profile.secondaryPieceCount,
      config.targetPiece
    );
    secondaryTargets = targets;
    for (const { row, col } of targets) {
      const newType =
        PLAYABLE_TYPES[Math.floor(Math.random() * PLAYABLE_TYPES.length)];
      b[row][col] = {
        ...b[row][col],
        id: createId(),
        type: newType,
      };
    }
    h = Math.max(0, h - profile.hullDamageSecondary);
    sCount = 0;
    lastAttack = 'secondary';
  }

  // Primário — esmagar / bloquear (limite + evita peça da missão)
  if (pCount >= profile.primaryInterval) {
    if (profile.primaryEffect === 'block') {
      const freeSlots = Math.max(0, MAX_BLOCKERS_ON_BOARD - countBlockers(b));
      const toPlace = Math.min(profile.primaryPieceCount, freeSlots);
      if (toPlace > 0) {
        const targets = pickRandomPlayableCells(
          b,
          toPlace,
          config.targetPiece
        );
        for (const { row, col } of targets) {
          b[row][col] = {
            id: createId(),
            type: 'blocked',
            row,
            col,
          };
        }
        h = Math.max(0, h - profile.hullDamagePrimary);
        lastAttack = 'primary';
      }
      // Consome o intervalo mesmo se o tabuleiro já estiver no limite
      pCount = 0;
    } else {
      const targets = pickRandomPlayableCells(
        b,
        profile.primaryPieceCount,
        config.targetPiece
      );
      for (const { row, col } of targets) {
        if (profile.primaryEffect === 'destroy') {
          b[row][col] = {
            id: createId(),
            type: 'empty',
            row,
            col,
          };
        }
      }
      if (profile.primaryEffect === 'destroy') {
        b = applyGravity(b);
      }
      h = Math.max(0, h - profile.hullDamagePrimary);
      pCount = 0;
      lastAttack = 'primary';
    }
  }

  return {
    board: b,
    primaryCounter: pCount,
    secondaryCounter: sCount,
    hull: h,
    lastAttack,
    secondaryTargets,
  };
}

const initialProgress: PlayerProgress = {
  currentLevel: 1,
  highestLevel: 1,
  biologicalData: 0,
  pureCrystals: 0,
  unlockedUpgrades: [],
  diaryEntries: [],
  totalWins: 0,
  totalLosses: 0,
  jaekelopterusRevengePending: false,
  scoreCrystalTier: 0,
};

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'main_menu',
  progress: { ...initialProgress },
  board: [],
  score: 0,
  movesLeft: 0,
  targetCollected: 0,
  currentLevelConfig: null,
  selectedPiece: null,
  isProcessing: false,
  isGameActive: false,
  oceanHealth: 30,
  cabinMood: 'tense',
  currentBoss: null,
  lastTreasureEvent: null,
  bossPrimaryCounter: 0,
  bossSecondaryCounter: 0,
  hullIntegrity: MAX_HULL,
  lastBossAttack: null,
  offspringMarks: [],
  energy: MAX_ENERGY,

  setScreen: (screen) => set({ screen }),

  clearTreasureEvent: () => set({ lastTreasureEvent: null }),

  clearOffspringMarks: () => set({ offspringMarks: [] }),

  getBossHud: (): BossHudInfo | null => {
    const state = get();
    const config = state.currentLevelConfig;
    if (!config?.boss) return null;
    const profile = getBossProfile(config.boss, config.isRevenge);
    if (!profile) return null;
    return {
      bossId: config.boss,
      isRevenge: config.isRevenge,
      movesUntilPrimary: Math.max(
        0,
        profile.primaryInterval - state.bossPrimaryCounter
      ),
      movesUntilSecondary:
        profile.secondaryInterval > 0
          ? Math.max(0, profile.secondaryInterval - state.bossSecondaryCounter)
          : null,
      lastAttack: state.lastBossAttack,
      hull: state.hullIntegrity,
      maxHull: MAX_HULL,
    };
  },

  startLevel: (levelId, isRevenge = false) => {
    const { progress } = get();
    let config = LEVELS.find((l) => l.id === levelId);

    // Auto-revanche do Jaekelopterus
    if (
      levelId === 3 &&
      (isRevenge || progress.jaekelopterusRevengePending)
    ) {
      config = LEVELS.find((l) => l.id === 4) ?? config;
    }

    if (!config) {
      config = {
        id: levelId,
        name: `Nível ${levelId}`,
        description: 'Missão de exploração.',
        rows: 8,
        cols: 8,
        targetPiece: 'oxygen',
        targetCount: 30 + levelId * 5,
        maxMoves: 30,
        boss: null,
        isRevenge: false,
        revengeMultiplier: 1,
        backgroundTheme: 'fossa',
      };
    }

    if (isRevenge && !config.isRevenge && config.boss === 'jaekelopterus') {
      config = LEVELS.find((l) => l.id === 4) ?? {
        ...config,
        isRevenge: true,
        targetCount: config.targetCount * 2,
        name: `${config.name} (Revanche)`,
      };
    }

    const board = generateBoard(config.rows, config.cols);

    set({
      screen: 'match3',
      board,
      score: 0,
      movesLeft: config.maxMoves,
      targetCollected: 0,
      currentLevelConfig: config,
      selectedPiece: null,
      isProcessing: false,
      isGameActive: true,
      currentBoss: config.boss,
      cabinMood: config.isRevenge ? 'critical' : config.boss ? 'tense' : 'calm',
      lastTreasureEvent: null,
      bossPrimaryCounter: 0,
      bossSecondaryCounter: 0,
      hullIntegrity: MAX_HULL,
      lastBossAttack: null,
      offspringMarks: [],
      energy: MAX_ENERGY,
      // Pontuação zera no nível; o marco de 500 também precisa zerar
      // (cristais já coletados em pureCrystals permanecem)
      progress: {
        ...progress,
        scoreCrystalTier: 0,
      },
    });
  },

  selectPiece: (row, col) => {
    const { selectedPiece, isProcessing, isGameActive, board } = get();
    if (isProcessing || !isGameActive) return;
    if (board[row]?.[col]?.type === 'blocked') return;

    if (!selectedPiece) {
      set({ selectedPiece: { row, col } });
      return;
    }

    if (selectedPiece.row === row && selectedPiece.col === col) {
      set({ selectedPiece: null });
      return;
    }

    const dr = Math.abs(selectedPiece.row - row);
    const dc = Math.abs(selectedPiece.col - col);
    if (dr + dc !== 1) {
      set({ selectedPiece: { row, col } });
      return;
    }

    // Não trocar com bloqueado
    if (board[row][col].type === 'blocked') return;

    get().swapPieces(selectedPiece.row, selectedPiece.col, row, col);
  },

  swapPieces: (r1, c1, r2, c2) => {
    const { board, movesLeft, currentLevelConfig, energy } = get();
    if (!currentLevelConfig) return;
    // Sem energia suficiente não troca
    if (energy < ENERGY_PER_MOVE) {
      playEnergyEmptySound();
      return;
    }

    const newBoard = board.map((row) => row.map((p) => ({ ...p })));
    const temp = { ...newBoard[r1][c1] };
    newBoard[r1][c1] = { ...newBoard[r2][c2], row: r1, col: c1 };
    newBoard[r2][c2] = { ...temp, row: r2, col: c2 };

    const nextEnergy = Math.max(0, energy - ENERGY_PER_MOVE);
    set({
      board: newBoard,
      selectedPiece: null,
      movesLeft: movesLeft - 1,
      energy: nextEnergy,
      isProcessing: true,
      lastBossAttack: null,
    });

    playSwapSound();
    playEnergyDrainSound();
    if (nextEnergy > 0 && nextEnergy <= 16) {
      playEnergyLowSound();
    }
    setTimeout(() => get().processMatches(), 180);
  },

  processMatches: () => {
    const state = get();
    let board = state.board.map((row) => row.map((p) => ({ ...p })));
    let score = state.score;
    let targetCollected = state.targetCollected;
    let movesLeft = state.movesLeft;
    let energy = state.energy;
    let progress = { ...state.progress };
    const config = state.currentLevelConfig;

    if (!config) {
      set({ isProcessing: false });
      return;
    }

    const matches = findMatches(board);

    if (matches.length === 0) {
      // 3+ baús em linha H/V → 1 baú com cristal (efeito igual a combinação normal)
      const treasureGroups = findTreasureLineGroups(board);
      if (treasureGroups.length > 0) {
        let crystalEvent: TreasureEvent | null = null;
        for (const g of treasureGroups) {
          let reward = 1;
          for (const { row, col } of g.cells) {
            reward += board[row][col].crystalReward ?? 0;
          }
          reward = Math.max(1, reward);
          for (const { row, col } of g.cells) {
            if (row === g.keep.row && col === g.keep.col) {
              // Permanece: baú com cristal
              board[row][col] = {
                ...board[row][col],
                id: createId(),
                type: 'treasure',
                isMatched: false,
                isOpening: false,
                crystalReward: reward,
              };
            } else {
              // Demais posições: mesmo efeito de combinação (animação → gravidade)
              board[row][col] = {
                ...board[row][col],
                isMatched: true,
              };
              score += 10;
            }
          }
          crystalEvent = {
            id: createId(),
            row: g.keep.row,
            col: g.keep.col,
            bonusMoves: 0,
            coins: 0,
            crystals: reward,
          };
        }
        playMatchSound('treasure');
        playTreasureSound();

        set({
          board,
          score,
          isProcessing: true,
          // Força aviso de cristal no monitor
          lastTreasureEvent: crystalEvent,
        });

        setTimeout(() => {
          let cleared = get().board.map((row) =>
            row.map((p) =>
              p.isMatched
                ? {
                    id: createId(),
                    type: 'empty' as PieceType,
                    row: p.row,
                    col: p.col,
                  }
                : { ...p, isMatched: false, isOpening: false }
            )
          );
          cleared = applyGravity(cleared);
          set({ board: cleared });
          setTimeout(() => get().processMatches(), 320);
        }, 1100);
        return;
      }

      // Fim da cascata → ataque do chefe
      let primaryCounter = state.bossPrimaryCounter;
      let secondaryCounter = state.bossSecondaryCounter;
      let hull = state.hullIntegrity;
      let lastAttack: 'primary' | 'secondary' | null = null;
      let nextBoard = board;

      let offspringMarks = state.offspringMarks;
      if (config.boss && state.isGameActive) {
        const result = applyBossAttacks(
          board,
          config,
          primaryCounter,
          secondaryCounter,
          hull
        );
        nextBoard = result.board;
        primaryCounter = result.primaryCounter;
        secondaryCounter = result.secondaryCounter;
        hull = result.hull;
        lastAttack = result.lastAttack;
        if (result.secondaryTargets.length > 0) {
          offspringMarks = result.secondaryTargets.map((t) => ({
            ...t,
            id: createId(),
          }));
        }
      }

      set({
        board: nextBoard,
        isProcessing: false,
        bossPrimaryCounter: primaryCounter,
        bossSecondaryCounter: secondaryCounter,
        hullIntegrity: hull,
        lastBossAttack: lastAttack,
        offspringMarks,
      });

      if (hull <= 0) {
        get().endLevel(false);
        return;
      }
      if (targetCollected >= config.targetCount) {
        get().endLevel(true);
      } else if (movesLeft <= 0) {
        get().endLevel(false);
      }
      return;
    }

    const matchedTypes = new Set<string>();
    let batteryMatched = 0;
    for (const { row, col } of matches) {
      const piece = board[row][col];
      if (piece.type === config.targetPiece) {
        targetCollected += 1;
        // Objetivo da fase: +1 ponto (não o valor normal)
        score += 1;
      } else {
        score += 10;
      }
      if (piece.type === 'battery') {
        batteryMatched += 1;
      }
      board[row][col] = { ...piece, isMatched: true };
      matchedTypes.add(piece.type);
    }
    matchedTypes.forEach((t) => playMatchSound(t));
    // Recarrega energia ao combinar baterias
    if (batteryMatched > 0) {
      energy = Math.min(
        MAX_ENERGY,
        energy + batteryMatched * ENERGY_PER_BATTERY_MATCH
      );
      playEnergyChargeSound(Math.min(3, Math.ceil(batteryMatched / 2)));
    }

    // Bloqueios adjacentes ao match
    const blockers = findAdjacentBlockers(board, matches);
    for (const { row, col } of blockers) {
      board[row][col] = { ...board[row][col], isMatched: true };
      score += 5;
    }

    const triggered = findTriggeredTreasures(
      board,
      matches,
      config.targetPiece
    );

    let treasureEvent: TreasureEvent | null = null;
    for (const { row, col } of triggered) {
      const bonusMoves = 1 + Math.floor(Math.random() * 3);
      const coins = 15 + Math.floor(Math.random() * 26);
      const chestCrystals = board[row][col].crystalReward ?? 0;
      movesLeft += bonusMoves;
      energy = Math.min(MAX_ENERGY, energy + ENERGY_PER_TREASURE);
      playEnergyChargeSound(1);
      score += coins * 2;
      progress = {
        ...progress,
        biologicalData: progress.biologicalData + coins,
        pureCrystals: progress.pureCrystals + chestCrystals,
      };
      board[row][col] = {
        ...board[row][col],
        isMatched: true,
        isOpening: true,
        crystalReward: undefined,
      };
      playTreasureSound();
      treasureEvent = {
        id: createId(),
        row,
        col,
        bonusMoves,
        coins,
        crystals: chestCrystals > 0 ? chestCrystals : undefined,
      };
    }

    // A cada 500 pts: baú especial + aviso no monitor (cristal só no inventário ao abrir)
    const tier = Math.floor(score / 500);
    const prevTier = progress.scoreCrystalTier ?? 0;
    const crystalsInChest = Math.max(0, tier - prevTier);
    if (crystalsInChest > 0) {
      const candidates: { row: number; col: number }[] = [];
      for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < board[r].length; c++) {
          const p = board[r][c];
          if (
            p.type !== 'blocked' &&
            p.type !== 'empty' &&
            p.type !== 'toxic' &&
            p.type !== 'treasure' &&
            !p.isMatched &&
            !p.isOpening
          ) {
            candidates.push({ row: r, col: c });
          }
        }
      }
      let spawnRow = -1;
      let spawnCol = -1;
      if (candidates.length > 0) {
        const pick =
          candidates[Math.floor(Math.random() * candidates.length)];
        spawnRow = pick.row;
        spawnCol = pick.col;
        board[spawnRow][spawnCol] = {
          ...board[spawnRow][spawnCol],
          id: createId(),
          type: 'treasure',
          isMatched: false,
          isOpening: false,
          crystalReward: crystalsInChest,
        };
      }
      // Marco usado — cristal ainda NÃO vai ao inventário
      progress = {
        ...progress,
        scoreCrystalTier: tier,
      };
      // Aviso sempre ao atingir o múltiplo de 500
      treasureEvent = {
        id: createId(),
        row: spawnRow,
        col: spawnCol,
        bonusMoves: treasureEvent?.bonusMoves ?? 0,
        coins: treasureEvent?.coins ?? 0,
        crystals: crystalsInChest,
      };
    }

    set({
      board,
      score,
      targetCollected,
      movesLeft,
      energy,
      progress,
      // Cristal nunca é sobrescrito por tesouro normal / cascade
      ...(treasureEvent
        ? {
            lastTreasureEvent: (() => {
              const prev = get().lastTreasureEvent;
              if (prev?.crystals && !treasureEvent.crystals) return prev;
              return treasureEvent;
            })(),
          }
        : {}),
    });

    setTimeout(() => {
      let cleared = get().board.map((row) =>
        row.map((p) =>
          p.isMatched || p.isOpening
            ? {
                id: createId(),
                type: 'empty' as PieceType,
                row: p.row,
                col: p.col,
              }
            : { ...p, isMatched: false, isOpening: false }
        )
      );
      cleared = applyGravity(cleared);
      set({ board: cleared });
      setTimeout(() => get().processMatches(), 320);
    }, 1100);
  },

  endLevel: (won) => {
    const { progress, currentLevelConfig, oceanHealth, hullIntegrity } = get();
    if (!currentLevelConfig) return;

    if (won) {
      const dataGain = 50 + currentLevelConfig.id * 10;
      const crystalGain = currentLevelConfig.isRevenge ? 1 : 0;

      // Revanche NÃO vem após vitória — só após derrota no 1º confronto
      // Nível 4 é só config de revanche; após vencer o chefe (3 ou 4), avança para 5
      let nextLevel: number;
      if (currentLevelConfig.boss === 'jaekelopterus') {
        nextLevel = 5; // pós-chefe
      } else if (currentLevelConfig.id === 4) {
        nextLevel = 5;
      } else {
        nextLevel = Math.max(progress.currentLevel, currentLevelConfig.id + 1);
      }

      set({
        isGameActive: false,
        oceanHealth: Math.min(100, oceanHealth + 8),
        cabinMood: 'victory',
        progress: {
          ...progress,
          currentLevel: nextLevel,
          highestLevel: Math.max(progress.highestLevel, nextLevel),
          biologicalData: progress.biologicalData + dataGain,
          pureCrystals: progress.pureCrystals + crystalGain,
          totalWins: progress.totalWins + 1,
          jaekelopterusRevengePending:
            currentLevelConfig.boss === 'jaekelopterus'
              ? false
              : progress.jaekelopterusRevengePending,
        },
        screen: 'cabin',
        lastTreasureEvent: null,
        lastBossAttack: null,
      });
    } else {
      // Derrota no 1º confronto do escorpião → marca revanche
      const isBossLoss =
        currentLevelConfig.boss === 'jaekelopterus' &&
        !currentLevelConfig.isRevenge;
      const isRevengeLoss =
        currentLevelConfig.boss === 'jaekelopterus' &&
        currentLevelConfig.isRevenge;
      const prevLevel = Math.max(1, currentLevelConfig.id - 1);

      set({
        isGameActive: false,
        oceanHealth: Math.max(0, oceanHealth - 12),
        cabinMood: 'critical',
        progress: {
          ...progress,
          // Mantém nível 3 para retentar; revanche só se perdeu o normal
          currentLevel: isBossLoss || isRevengeLoss ? 3 : prevLevel,
          totalLosses: progress.totalLosses + 1,
          jaekelopterusRevengePending:
            isBossLoss || isRevengeLoss
              ? true
              : progress.jaekelopterusRevengePending,
        },
        screen: 'cabin',
        lastTreasureEvent: null,
        lastBossAttack: null,
        hullIntegrity: hullIntegrity,
      });
    }
  },

  buyUpgrade: (upgradeId) => {
    const { progress } = get();
    if (progress.unlockedUpgrades.includes(upgradeId)) return false;

    // Custos alinhados ao Terminal — itens iniciais só em Dados
    // Custos alinhados às placas do Terminal (arte industrial)
    const COSTS: Record<string, { data: number; crystals: number }> = {
      tungsten_plates: { data: 300, crystals: 3 },
      gyro_stabilizer: { data: 250, crystals: 2 },
      interface_shield: { data: 250, crystals: 2 },
      quantum_jet: { data: 400, crystals: 5 },
      geometry_scanner: { data: 500, crystals: 6 },
      hull_nanites: { data: 150, crystals: 1 },
      // legado (se ainda referenciado)
      emergency_purge: { data: 50, crystals: 0 },
      electro_fuselage: { data: 120, crystals: 0 },
    };
    const cost = COSTS[upgradeId] ?? { data: 0, crystals: 0 };
    if (
      progress.biologicalData < cost.data ||
      progress.pureCrystals < cost.crystals
    ) {
      return false;
    }

    set({
      progress: {
        ...progress,
        biologicalData: progress.biologicalData - cost.data,
        pureCrystals: progress.pureCrystals - cost.crystals,
        unlockedUpgrades: [...progress.unlockedUpgrades, upgradeId],
      },
    });
    return true;
  },

  /** Comandos táticos no tabuleiro (Terminal de Engenharia em missão) */
  useEngineeringCommand: (commandId: string) => {
    const state = get();
    if (!state.isGameActive || state.isProcessing) return false;
    const { progress, board, hullIntegrity } = state;

    if (commandId === 'purge_blockers') {
      const canPurge =
        progress.unlockedUpgrades.includes('electro_fuselage') ||
        progress.unlockedUpgrades.includes('emergency_purge');
      if (!canPurge) return false;
      if (progress.biologicalData < 25) return false;
      if (progress.biologicalData < 25) return false;
      let removed = 0;
      const next = board.map((row) =>
        row.map((p) => {
          if (p.type === 'blocked' && removed < 3) {
            removed++;
            return {
              id: createId(),
              type: 'empty' as PieceType,
              row: p.row,
              col: p.col,
            };
          }
          return { ...p };
        })
      );
      if (removed === 0) return false;
      const withGravity = applyGravity(next);
      set({
        board: withGravity,
        progress: {
          ...progress,
          biologicalData: progress.biologicalData - 25,
        },
      });
      setTimeout(() => get().processMatches(), 200);
      return true;
    }

    if (commandId === 'repair_hull') {
      if (!progress.unlockedUpgrades.includes('hull_nanites')) return false;
      if (progress.biologicalData < 30) return false;
      if (hullIntegrity >= 100) return false;
      set({
        hullIntegrity: Math.min(100, hullIntegrity + 20),
        progress: {
          ...progress,
          biologicalData: progress.biologicalData - 30,
        },
      });
      return true;
    }

    if (commandId === 'extra_moves') {
      // Emergência: sempre exige mínimo de 40 dados
      if (progress.biologicalData < 40) return false;
      set({
        movesLeft: state.movesLeft + 3,
        energy: Math.min(MAX_ENERGY, state.energy + 8),
        progress: {
          ...progress,
          biologicalData: progress.biologicalData - 40,
        },
      });
      playEnergyChargeSound(2);
      return true;
    }

    return false;
  },

  resetGame: () => {
    set({
      screen: 'main_menu',
      progress: { ...initialProgress },
      board: [],
      score: 0,
      movesLeft: 0,
      targetCollected: 0,
      currentLevelConfig: null,
      selectedPiece: null,
      isProcessing: false,
      isGameActive: false,
      oceanHealth: 30,
      cabinMood: 'tense',
      currentBoss: null,
      lastTreasureEvent: null,
      bossPrimaryCounter: 0,
      bossSecondaryCounter: 0,
      hullIntegrity: MAX_HULL,
      lastBossAttack: null,
      offspringMarks: [],
      energy: MAX_ENERGY,
    });
  },
}));
