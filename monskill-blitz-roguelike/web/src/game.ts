import { TILE, MAP_WIDTH, MAP_HEIGHT, TICK_MS, DIRECTIONS, type Vec2, type Direction, type Enemy, type Gravestone, type PlayerRun, type LeaderboardEntry, type DungeonFloor, type ChainAdapter } from './types';

export class MonadBlitzRoguelike {
  public static readonly ENTRY_FEE_MON = 1.00;
  public static readonly MAX_PAYOUT_PER_RUN_MON = 5.00;

  private chainAdapter: ChainAdapter;
  private activeRunsByAddress = new Map<string, PlayerRun>();
  private gravestonesByFloorKey = new Map<string, Gravestone[]>();
  private leaderboard = new Map<string, LeaderboardEntry>();
  private floorCache = new Map<string, DungeonFloor>();
  private runCounter = 1;
  private graveCounter = 1;
  private prizePoolMon = 25.00;

  constructor(chainAdapter: ChainAdapter) {
    this.chainAdapter = chainAdapter;
  }

  getPrizePoolMon(): number { return this.prizePoolMon; }

  startRun(playerAddress: string, optionalSeed?: number): PlayerRun {
    const addr = this.normalizeAddress(playerAddress);
    if (this.activeRunsByAddress.has(addr)) {
      throw new Error(`Address already has an active run: ${addr}`);
    }

    this.prizePoolMon += MonadBlitzRoguelike.ENTRY_FEE_MON;
    const seed = optionalSeed ?? this.computeDeterministicSeed(addr, this.runCounter);
    const floor1 = this.getOrCreateFloor(seed, 1);

    const runId = `run-${this.runCounter++}`;
    const run: PlayerRun = {
      runId,
      address: addr,
      dungeonSeed: seed,
      floor: 1,
      pos: { ...floor1.spawn },
      hp: 100,
      maxHp: 100,
      atk: 22,
      score: 0,
      inventory: ['MON Shard'],
      active: true,
      payoutMon: 0,
    };

    this.activeRunsByAddress.set(addr, run);
    this.chainAdapter.onRunStarted(addr, seed, MonadBlitzRoguelike.ENTRY_FEE_MON);
    return run;
  }

  private getOrCreateFloor(seed: number, floorNumber: number): DungeonFloor {
    const key = `${seed}:${floorNumber}`;
    if (this.floorCache.has(key)) return this.floorCache.get(key)!;

    const floor = new DungeonFloorClass(floorNumber, seed);
    const persisted = this.gravestonesByFloorKey.get(key) ?? [];
    for (const g of persisted) {
      floor.gravestones.push(g);
      if (!g.ghostDefeated) {
        floor.enemies.push({
          id: `ghost-${g.id}`,
          name: `Ghost of ${this.shortAddress(g.ownerAddress)}`,
          pos: { ...g.pos },
          hp: 45 + floorNumber * 10,
          maxHp: 45 + floorNumber * 10,
          atk: 10 + floorNumber * 3,
          isGhost: true,
          fallenPlayerAddress: g.ownerAddress,
          isAlive: () => true,
        });
      }
    }
    this.floorCache.set(key, floor);
    return floor;
  }

  act(playerAddress: string, dir: Direction): string {
    const addr = this.normalizeAddress(playerAddress);
    const run = this.activeRunsByAddress.get(addr);
    if (!run || !run.active) return `No active run for ${addr}`;

    const floor = this.getOrCreateFloor(run.dungeonSeed, run.floor);
    const nx = run.pos.x + dir.dx;
    const ny = run.pos.y + dir.dy;

    const targetEnemy = floor.enemies.find(e => e.isAlive() && e.pos.x === nx && e.pos.y === ny);
    const log: string[] = [];

    if (targetEnemy) {
      targetEnemy.hp -= run.atk;
      log.push(`Hit ${targetEnemy.name} for ${run.atk} dmg (HP: ${Math.max(0, targetEnemy.hp)}/${targetEnemy.maxHp}). `);

      if (!targetEnemy.isAlive()) {
        const pts = targetEnemy.isGhost ? 250 : 100;
        run.score += pts;
        log.push(`Defeated ${targetEnemy.name} (+${pts} score)! `);
        if (targetEnemy.isGhost && targetEnemy.fallenPlayerAddress) {
          this.markGhostDefeated(run.dungeonSeed, run.floor, targetEnemy.fallenPlayerAddress);
        }
      }
    } else if (floor.isWalkable(nx, ny)) {
      run.pos.x = nx;
      run.pos.y = ny;
      log.push(`Moved to (${nx}, ${ny}). `);

      for (const g of floor.gravestones) {
        if (g.pos.x === run.pos.x && g.pos.y === run.pos.y && !g.lootClaimed && g.loot.length > 0) {
          run.inventory.push(...g.loot);
          run.score += 75;
          g.lootClaimed = true;
          log.push(`Looted gravestone of ${this.shortAddress(g.ownerAddress)}: ${g.loot.join(', ')} (+75 score)! `);
        }
      }

      const tile = floor.grid[ny][nx];
      if (tile === TILE.ALTAR) {
        run.hp = Math.min(run.maxHp, run.hp + 25);
        run.atk += 4;
        run.score += 50;
        floor.grid[ny][nx] = TILE.FLOOR;
        log.push('Used MON Altar (+25 HP, +4 ATK, +50 score)! ');
      } else if (tile === TILE.EXIT) {
        run.floor += 1;
        run.score += 150;
        const nextFloor = this.getOrCreateFloor(run.dungeonSeed, run.floor);
        run.pos = { ...nextFloor.spawn };
        log.push(`Descended to Floor ${run.floor} (+150 score)! `);
        return log.join('').trim();
      }
    } else {
      log.push('Blocked by wall. ');
    }

    // Enemy AI
    for (const e of floor.enemies) {
      if (!e.isAlive()) continue;
      const dist = Math.abs(e.pos.x - run.pos.x) + Math.abs(e.pos.y - run.pos.y);
      if (dist === 1) {
        run.hp -= e.atk;
        log.push(`${e.name} hit you for ${e.atk} dmg (Your HP: ${Math.max(0, run.hp)}/${run.maxHp}). `);
        if (run.hp <= 0) {
          this.handleDeath(run, floor, log);
          return log.join('').trim();
        }
      } else if (dist <= 6) {
        const stepX = e.pos.x + Math.sign(run.pos.x - e.pos.x);
        const stepY = e.pos.y + Math.sign(run.pos.y - e.pos.y);
        if (floor.isWalkable(stepX, stepY) && !this.isOccupied(floor, run, stepX, stepY)) {
          e.pos.x = stepX;
          e.pos.y = stepY;
        }
      }
    }

    return log.join('').trim();
  }

  private markGhostDefeated(seed: number, floorNum: number, fallenAddress: string) {
    const key = `${seed}:${floorNum}`;
    const list = this.gravestonesByFloorKey.get(key);
    if (list) {
      for (const g of list) {
        if (g.ownerAddress.toLowerCase() === fallenAddress.toLowerCase()) {
          g.ghostDefeated = true;
        }
      }
    }
  }

  private isOccupied(floor: DungeonFloor, run: PlayerRun, x: number, y: number): boolean {
    if (run.pos.x === x && run.pos.y === y) return true;
    return floor.enemies.some(e => e.isAlive() && e.pos.x === x && e.pos.y === y);
  }

  extractAndCashOut(playerAddress: string): number {
    const addr = this.normalizeAddress(playerAddress);
    const run = this.activeRunsByAddress.get(addr);
    if (!run || !run.active) throw new Error(`No active run to cash out for ${addr}`);
    run.active = false;
    this.activeRunsByAddress.delete(addr);

    run.score += 100; // extraction bonus
    const payout = this.calculateCappedPayout(run.score);
    run.payoutMon = payout;
    this.recordLeaderboardAndPay(run, payout);
    return payout;
  }

  private handleDeath(run: PlayerRun, floor: DungeonFloor, log: string[]) {
    run.active = false;
    this.activeRunsByAddress.delete(run.address);

    const droppedLoot = run.inventory.length === 0 ? ['Soul Ember'] : [...run.inventory];

    const grave: Gravestone = {
      id: `grave-${this.graveCounter++}`,
      ownerAddress: run.address,
      floor: run.floor,
      pos: { ...run.pos },
      loot: droppedLoot,
      finalScore: run.score,
      diedAt: Date.now(),
      lootClaimed: false,
      ghostDefeated: false,
    };

    floor.gravestones.push(grave);
    const key = `${run.dungeonSeed}:${run.floor}`;
    if (!this.gravestonesByFloorKey.has(key)) this.gravestonesByFloorKey.set(key, []);
    this.gravestonesByFloorKey.get(key)!.push(grave);

    // spawn ghost
    floor.enemies.push({
      id: `ghost-${grave.id}`,
      name: `Ghost of ${this.shortAddress(run.address)}`,
      pos: { ...run.pos },
      hp: 50 + run.floor * 10,
      maxHp: 50 + run.floor * 10,
      atk: 11 + run.floor * 3,
      isGhost: true,
      fallenPlayerAddress: run.address,
      isAlive: () => true,
    });

    const consolation = this.calculateCappedPayout(Math.floor(run.score / 2));
    run.payoutMon = consolation;
    this.recordLeaderboardAndPay(run, consolation);

    log.push(`YOU DIED! Gravestone ${grave.id} persisted with loot ${droppedLoot.join(', ')} and ghost spawned.`);
    this.chainAdapter.onGravestonePersisted(grave);
  }

  private calculateCappedPayout(score: number): number {
    if (score <= 0 || this.prizePoolMon <= 0) return 0;
    let raw = score / 250;
    raw = Math.min(raw, MonadBlitzRoguelike.MAX_PAYOUT_PER_RUN_MON);
    raw = Math.min(raw, this.prizePoolMon);
    return Math.max(raw, 0);
  }

  private recordLeaderboardAndPay(run: PlayerRun, payout: number) {
    this.prizePoolMon = Math.max(this.prizePoolMon - payout, 0);

    const existing = this.leaderboard.get(run.address);
    if (!existing) {
      this.leaderboard.set(run.address, {
        address: run.address,
        bestScore: run.score,
        totalPayoutMon: payout,
      });
    } else {
      existing.bestScore = Math.max(existing.bestScore, run.score);
      existing.totalPayoutMon += payout;
    }

    this.chainAdapter.onPayoutSettled(run.address, payout, run.score);
  }

  renderFloorAscii(playerAddress: string): string {
    const addr = this.normalizeAddress(playerAddress);
    const run = this.activeRunsByAddress.get(addr);
    if (!run) return 'No active run.';

    const floor = this.getOrCreateFloor(run.dungeonSeed, run.floor);
    const canvas: string[][] = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      canvas[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        canvas[y][x] = floor.grid[y][x];
      }
    }

    for (const g of floor.gravestones) {
      if (!g.lootClaimed) canvas[g.pos.y][g.pos.x] = '+';
    }
    for (const e of floor.enemies) {
      if (e.isAlive()) canvas[e.pos.y][e.pos.x] = e.isGhost ? 'G' : 'E';
    }
    canvas[run.pos.y][run.pos.x] = '@';

    const sb: string[] = [];
    sb.push(`Floor ${run.floor} | HP: ${run.hp}/${run.maxHp} | ATK: ${run.atk} | Score: ${run.score} | Loot: ${run.inventory.join(', ')}`);
    for (const row of canvas) sb.push(row.join(''));
    return sb.join('\n');
  }

  getLeaderboard(): LeaderboardEntry[] {
    return Array.from(this.leaderboard.values())
      .sort((a, b) => b.bestScore - a.bestScore);
  }

  // ---- helpers ----

  private computeDeterministicSeed(address: string, nonce: number): number {
    let hash = 0;
    const str = `${address}:${nonce}`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  private normalizeAddress(address: string): string {
    return address ? address.trim().toLowerCase() : '0x0000';
  }

  private shortAddress(address: string): string {
    const n = this.normalizeAddress(address);
    return n.length <= 10 ? n : `${n.substring(0, 6)}...${n.substring(n.length - 4)}`;
  }
}
