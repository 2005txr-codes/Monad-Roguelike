export const TILE = { WALL: '#', FLOOR: '.', ALTAR: 'A', EXIT: '>' } as const;
export const MAP_WIDTH = 28;
export const MAP_HEIGHT = 18;
export const TICK_MS = 100;

export interface Vec2 { x: number; y: number; }
export interface Direction { dx: number; dy: number; }

export const DIRECTIONS: Record<string, Direction> = {
  UP: { dx: 0, dy: -1 },
  DOWN: { dx: 0, dy: 1 },
  LEFT: { dx: -1, dy: 0 },
  RIGHT: { dx: 1, dy: 0 },
};

export interface Enemy {
  id: string;
  name: string;
  pos: Vec2;
  hp: number;
  maxHp: number;
  atk: number;
  isGhost: boolean;
  fallenPlayerAddress: string | null;
  isAlive(): boolean;
}

export interface Gravestone {
  id: string;
  ownerAddress: string;
  floor: number;
  pos: Vec2;
  loot: string[];
  finalScore: number;
  diedAt: number;
  lootClaimed: boolean;
  ghostDefeated: boolean;
}

export interface PlayerRun {
  runId: string;
  address: string;
  dungeonSeed: number;
  floor: number;
  pos: Vec2;
  hp: number;
  maxHp: number;
  atk: number;
  score: number;
  inventory: string[];
  active: boolean;
  payoutMon: number;
}

export interface LeaderboardEntry {
  address: string;
  bestScore: number;
  totalPayoutMon: number;
}

export interface DungeonFloor {
  floorNumber: number;
  seed: number;
  grid: string[][];
  spawn: Vec2;
  exit: Vec2;
  enemies: Enemy[];
  gravestones: Gravestone[];
}

export interface ChainAdapter {
  onRunStarted(address: string, seed: number, feeMon: number): void;
  onGravestonePersisted(g: Gravestone): void;
  onPayoutSettled(address: string, amountMon: number, score: number): void;
}