import { TILE, MAP_WIDTH, MAP_HEIGHT, type Vec2 } from './types';
import { Enemy, Gravestone, DungeonFloor } from './types';

export class DungeonFloorClass implements DungeonFloor {
  floorNumber: number;
  seed: number;
  grid: string[][];
  spawn: Vec2;
  exit: Vec2;
  enemies: Enemy[] = [];
  gravestones: Gravestone[] = [];

  constructor(floorNumber: number, seed: number) {
    this.floorNumber = floorNumber;
    this.seed = seed;
    this.grid = Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(TILE.WALL));

    const rng = new SeededRandom(this.deriveFloorSeed(seed, floorNumber));
    const rooms: number[][] = [];
    let attempts = 0;

    while (rooms.length < 6 && attempts < 60) {
      attempts++;
      const rw = 4 + Math.floor(rng.next() * 5);
      const rh = 3 + Math.floor(rng.next() * 4);
      const rx = 1 + Math.floor(rng.next() * Math.max(1, MAP_WIDTH - rw - 2));
      const ry = 1 + Math.floor(rng.next() * Math.max(1, MAP_HEIGHT - rh - 2));

      if (this.overlaps(rooms, rx, ry, rw, rh)) continue;
      rooms.push([rx, ry, rw, rh]);
      this.carveRect(rx, ry, rw, rh);
    }

    if (rooms.length === 0) {
      rooms.push([2, 2, 6, 4]);
      this.carveRect(2, 2, 6, 4);
    }

    for (let i = 1; i < rooms.length; i++) {
      const prev = this.roomCenter(rooms[i - 1]);
      const curr = this.roomCenter(rooms[i]);
      this.carveCorridor(prev, curr, Math.random() < 0.5);
    }

    this.spawn = this.roomCenter(rooms[0]);
    this.exit = this.roomCenter(rooms[rooms.length - 1]);
    this.grid[this.exit.y][this.exit.x] = TILE.EXIT;

    if (rooms.length >= 3) {
      const altarPos = this.roomCenter(rooms[Math.floor(rooms.length / 2)]);
      if (!(altarPos.x === this.spawn.x && altarPos.y === this.spawn.y) &&
          !(altarPos.x === this.exit.x && altarPos.y === this.exit.y)) {
        this.grid[altarPos.y][altarPos.x] = TILE.ALTAR;
      }
    }

    let enemySeq = 1;
    for (let i = 1; i < rooms.length; i++) {
      const center = this.roomCenter(rooms[i]);
      if (center.x === this.exit.x && center.y === this.exit.y) continue;
      const hp = 35 + floorNumber * 12 + Math.floor(rng.next() * 15);
      const atk = 8 + floorNumber * 3;
      this.enemies.push({
        id: `f${floorNumber}-e${enemySeq++}`,
        name: 'Shard Fiend',
        pos: { ...center },
        hp,
        maxHp: hp,
        atk,
        isGhost: false,
        fallenPlayerAddress: null,
        isAlive: () => true,
      });
    }
  }

  private overlaps(rooms: number[][], rx: number, ry: number, rw: number, rh: number): boolean {
    for (const r of rooms) {
      if (rx - 1 < r[0] + r[2] && rx + rw + 1 > r[0] &&
          ry - 1 < r[1] + r[3] && ry + rh + 1 > r[1]) return true;
    }
    return false;
  }

  private carveRect(rx: number, ry: number, rw: number, rh: number) {
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        if (this.inBounds(x, y)) this.grid[y][x] = TILE.FLOOR;
      }
    }
  }

  private carveCorridor(a: Vec2, b: Vec2, horizontalFirst: boolean) {
    let cx = a.x, cy = a.y;
    if (horizontalFirst) {
      while (cx !== b.x) {
        if (this.inBounds(cx, cy)) this.grid[cy][cx] = TILE.FLOOR;
        cx += Math.sign(b.x - cx);
      }
      while (cy !== b.y) {
        if (this.inBounds(cx, cy)) this.grid[cy][cx] = TILE.FLOOR;
        cy += Math.sign(b.y - cy);
      }
    } else {
      while (cy !== b.y) {
        if (this.inBounds(cx, cy)) this.grid[cy][cx] = TILE.FLOOR;
        cy += Math.sign(b.y - cy);
      }
      while (cx !== b.x) {
        if (this.inBounds(cx, cy)) this.grid[cy][cx] = TILE.FLOOR;
        cx += Math.sign(b.x - cx);
      }
    }
    if (this.inBounds(b.x, b.y)) this.grid[b.y][b.x] = TILE.FLOOR;
  }

  private roomCenter(r: number[]): Vec2 {
    return { x: r[0] + Math.floor(r[2] / 2), y: r[1] + Math.floor(r[3] / 2) };
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT;
  }

  isWalkable(x: number, y: number): boolean {
    return this.inBounds(x, y) && this.grid[y][x] !== TILE.WALL;
  }

  static deriveFloorSeed(baseSeed: number, floor: number): number {
    return baseSeed ^ (floor * 0x9E3779B97F4A7C15);
  }
}

class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
}
