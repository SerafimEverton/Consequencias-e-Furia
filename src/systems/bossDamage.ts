import type { BossId } from '../types/game';

/** Tabela de danos — Jaekelopterus e extensível para outros chefes */
export interface BossAttackProfile {
  bossId: BossId;
  /** Intervalo em jogadas do jogador para o ataque principal */
  primaryInterval: number;
  /** Quantas peças o ataque principal afeta */
  primaryPieceCount: number;
  /** Tipo do ataque principal */
  primaryEffect: 'block' | 'destroy' | 'scramble';
  /** Dano no casco do Nautilus-X por ataque principal */
  hullDamagePrimary: number;
  /** Intervalo do ataque secundário (filhotes / oportunistas), 0 = nenhum */
  secondaryInterval: number;
  /** Peças afetadas pelo secundário */
  secondaryPieceCount: number;
  secondaryEffect: 'scramble' | 'toxic' | 'none';
  hullDamageSecondary: number;
}

export const BOSS_DAMAGE_TABLE: Record<string, BossAttackProfile> = {
  jaekelopterus_normal: {
    bossId: 'jaekelopterus',
    primaryInterval: 3,
    primaryPieceCount: 2,
    primaryEffect: 'block',
    hullDamagePrimary: 5,
    secondaryInterval: 0,
    secondaryPieceCount: 0,
    secondaryEffect: 'none',
    hullDamageSecondary: 0,
  },
  jaekelopterus_revenge: {
    bossId: 'jaekelopterus',
    primaryInterval: 3,
    primaryPieceCount: 2,
    primaryEffect: 'block',
    hullDamagePrimary: 8,
    secondaryInterval: 2,
    secondaryPieceCount: 3,
    secondaryEffect: 'scramble',
    hullDamageSecondary: 0,
  },
};

export function getBossProfile(
  bossId: BossId,
  isRevenge: boolean
): BossAttackProfile | null {
  if (bossId === 'jaekelopterus') {
    return isRevenge
      ? BOSS_DAMAGE_TABLE.jaekelopterus_revenge
      : BOSS_DAMAGE_TABLE.jaekelopterus_normal;
  }
  return null;
}

export const MAX_HULL = 100;
