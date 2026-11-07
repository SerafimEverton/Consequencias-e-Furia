// ============================================
// CONSEQUÊNCIA E FÚRIA - Tipos do Jogo
// ============================================

export type PieceType =
  | 'oxygen'
  | 'battery'
  | 'sample'
  | 'crystal'
  | 'propulsion'
  | 'neutralizer'
  | 'treasure'
  | 'blocked'
  | 'toxic'
  | 'empty';

export interface Piece {
  id: string;
  type: PieceType;
  row: number;
  col: number;
  isMatched?: boolean;
  isSpecial?: boolean;
  isOpening?: boolean;
  /** Cristais guardados neste baú — só entram no inventário ao abrir */
  crystalReward?: number;
}

export type GameScreen =
  | 'main_menu'
  | 'cabin'
  | 'match3'
  | 'upgrade_menu'
  | 'diary'
  | 'cutscene'
  | 'game_over'
  | 'victory';

export type BossId =
  | 'jaekelopterus'
  | 'dunkleosteus'
  | 'mosasaurus'
  | 'megalodon'
  | 'sea_serpent'
  | 'kraken'
  | 'leviathan'
  | null;

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  rows: number;
  cols: number;
  targetPiece: PieceType;
  targetCount: number;
  maxMoves: number;
  boss: BossId;
  isRevenge: boolean;
  revengeMultiplier: number;
  backgroundTheme: 'fossa' | 'volcano' | 'open_sea' | 'abyss' | 'chemical_cloud';
}

export interface PlayerProgress {
  currentLevel: number;
  highestLevel: number;
  biologicalData: number;
  pureCrystals: number;
  unlockedUpgrades: string[];
  diaryEntries: string[];
  totalWins: number;
  totalLosses: number;
  /** Próximo confronto com Jaekelopterus será revanche */
  jaekelopterusRevengePending: boolean;
  /** Último marco de 500 pts já convertido em cristal de tesouro */
  scoreCrystalTier: number;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  category: 'defense' | 'propulsion' | 'lab';
  costData: number;
  costCrystals: number;
  effect: string;
  unlocked: boolean;
  level: number;
  maxLevel: number;
}

export interface TreasureEvent {
  id: string;
  row: number;
  col: number;
  bonusMoves: number;
  coins: number;
  /** Cristais no baú (1 a cada 500 pts cruzados neste resgate) */
  crystals?: number;
}

export interface BossHudInfo {
  bossId: BossId;
  isRevenge: boolean;
  movesUntilPrimary: number;
  movesUntilSecondary: number | null;
  lastAttack: 'primary' | 'secondary' | null;
  hull: number;
  maxHull: number;
}

export interface GameState {
  screen: GameScreen;
  progress: PlayerProgress;
  board: Piece[][];
  score: number;
  movesLeft: number;
  targetCollected: number;
  currentLevelConfig: LevelConfig | null;
  selectedPiece: { row: number; col: number } | null;
  isProcessing: boolean;
  isGameActive: boolean;
  oceanHealth: number;
  cabinMood: 'calm' | 'tense' | 'critical' | 'victory';
  currentBoss: BossId;
  lastTreasureEvent: TreasureEvent | null;

  /** Contadores do chefe */
  bossPrimaryCounter: number;
  bossSecondaryCounter: number;
  hullIntegrity: number;
  lastBossAttack: 'primary' | 'secondary' | null;
  /** Células onde filhotes aparecem temporariamente */
  offspringMarks: { row: number; col: number; id: string }[];
  /** Energia da bateria Nautilus-X (0–100) */
  energy: number;

  setScreen: (screen: GameScreen) => void;
  startLevel: (levelId: number, isRevenge?: boolean) => void;
  selectPiece: (row: number, col: number) => void;
  swapPieces: (r1: number, c1: number, r2: number, c2: number) => void;
  processMatches: () => void;
  endLevel: (won: boolean) => void;
  buyUpgrade: (upgradeId: string) => boolean;
  resetGame: () => void;
  clearTreasureEvent: () => void;
  getBossHud: () => BossHudInfo | null;
  useEngineeringCommand: (commandId: string) => boolean;
  clearOffspringMarks: () => void;
}

export const PIECE_COLORS: Record<PieceType, string> = {
  oxygen: '#38bdf8',
  battery: '#facc15',
  sample: '#4ade80',
  crystal: '#c084fc',
  propulsion: '#fb923c',
  neutralizer: '#22d3ee',
  treasure: '#f59e0b',
  blocked: '#64748b',
  toxic: '#991b1b',
  empty: 'transparent',
};

export const PIECE_LABELS: Record<PieceType, string> = {
  oxygen: 'Oxigênio',
  battery: 'Bateria',
  sample: 'Amostra',
  crystal: 'Cristal',
  propulsion: 'Propulsão',
  neutralizer: 'Neutralizador',
  treasure: 'Tesouro',
  blocked: 'Bloqueado',
  toxic: 'Tóxico',
  empty: '',
};
