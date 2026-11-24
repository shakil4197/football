import {
  BallEntity,
  Club,
  Fixture,
  LiveBannerCue,
  LiveMatchSnapshot,
  MatchEvent,
  MatchPhase,
  MatchStats,
  PenaltyKick,
  PitchParticle,
  PitchPlayerEntity,
  Player,
  PlayerMatchStat,
  SpeedOption,
} from '../types/tournament';
import { soundEngine } from './soundEngine';
import { createEmptyMatchStats } from './tournamentLogic';

// Exact 60-minute continuous match timeline (no 5-minute half-time break)
export const FIRST_HALF_END = 30 * 60; // 1800s (30 min)
export const FULL_TIME_END = 60 * 60; // 3600s (60 min total)

export const PITCH_W = 100;
export const PITCH_H = 64;
export const GOAL_Y_MIN = 25.5;
export const GOAL_Y_MAX = 38.5;

export interface MatchStatDelta {
  playerId: string;
  clubId: string;
  goals?: number;
  assists?: number;
  saves?: number;
  shots?: number;
}

export interface MatchCompletionPayload {
  fixtureId: string;
  homeScore: number;
  awayScore: number;
  homePenalties?: number;
  awayPenalties?: number;
  penaltyLog?: PenaltyKick[];
  winnerId: string | null;
  events: MatchEvent[];
  stats: MatchStats;
  matchPlayerStats: Record<string, PlayerMatchStat>;
}

export function formatMatchClock(matchSeconds: number, phase: MatchPhase): {
  clockText: string;
  countdownText: string;
  phaseText: string;
  minuteNumber: number;
} {
  const totalRemaining = Math.max(0, FULL_TIME_END - matchSeconds);
  const remMins = Math.floor(totalRemaining / 60);
  const remSecs = Math.floor(totalRemaining % 60);
  const countdownText = `${String(remMins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;

  if (phase === 'PRE_MATCH') {
    return {
      clockText: '00:00',
      countdownText: '60:00',
      phaseText: 'Pre-Match Lineups',
      minuteNumber: 0,
    };
  }
  if (phase === 'FIRST_HALF') {
    const clamped = Math.min(FIRST_HALF_END, Math.max(0, matchSeconds));
    const halfRem = Math.max(0, FIRST_HALF_END - clamped);
    const mins = Math.floor(clamped / 60);
    const secs = Math.floor(clamped % 60);
    const hRemM = Math.floor(halfRem / 60);
    const hRemS = Math.floor(halfRem % 60);
    return {
      clockText: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      countdownText,
      phaseText: `1st Half · ${String(hRemM).padStart(2, '0')}:${String(hRemS).padStart(2, '0')}`,
      minuteNumber: Math.min(30, mins + 1),
    };
  }
  if (phase === 'SECOND_HALF') {
    const clamped = Math.min(FULL_TIME_END, Math.max(FIRST_HALF_END, matchSeconds));
    const halfRem = Math.max(0, FULL_TIME_END - clamped);
    const mins = Math.floor(clamped / 60);
    const secs = Math.floor(clamped % 60);
    const hRemM = Math.floor(halfRem / 60);
    const hRemS = Math.floor(halfRem % 60);
    return {
      clockText: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      countdownText,
      phaseText: `2nd Half · ${String(hRemM).padStart(2, '0')}:${String(hRemS).padStart(2, '0')}`,
      minuteNumber: Math.min(60, mins + 1),
    };
  }
  if (phase === 'PENALTIES') {
    return {
      clockText: 'PENS',
      countdownText: '00:00',
      phaseText: 'Penalty Shootout',
      minuteNumber: 60,
    };
  }
  return {
    clockText: '60:00',
    countdownText: '00:00',
    phaseText: 'Full Time',
    minuteNumber: 60,
  };
}

function getFormationCoordinates(
  players: Player[],
  side: 'home' | 'away',
  swappedEnds: boolean
): Array<{ player: Player; x: number; y: number }> {
  const attackingRight = (side === 'home' && !swappedEnds) || (side === 'away' && swappedEnds);

  const gks = players.filter((p) => p.position === 'GK');
  const defs = players.filter((p) => p.position === 'DEF');
  const mids = players.filter((p) => p.position === 'MID');
  const fwds = players.filter((p) => p.position === 'FWD');

  const activeGK = gks.slice(0, 1);
  const activeDEF = defs.slice(0, 4);
  const activeMID = mids.slice(0, 3);
  const activeFWD = fwds.slice(0, 3);

  const usedIds = new Set([...activeGK, ...activeDEF, ...activeMID, ...activeFWD].map((p) => p.id));
  const extras = players.filter((p) => !usedIds.has(p.id));
  const ordered: Array<{ player: Player; line: 'GK' | 'DEF' | 'MID' | 'FWD' }> = [
    ...activeGK.map((p) => ({ player: p, line: 'GK' as const })),
    ...activeDEF.map((p) => ({ player: p, line: 'DEF' as const })),
    ...activeMID.map((p) => ({ player: p, line: 'MID' as const })),
    ...activeFWD.map((p) => ({ player: p, line: 'FWD' as const })),
  ];

  for (const extra of extras) {
    if (ordered.length >= 11) break;
    ordered.push({ player: extra, line: extra.position });
  }
  if (ordered.length > 0 && !ordered.some((o) => o.line === 'GK')) {
    ordered[0].line = 'GK';
  }

  const byLine = {
    GK: ordered.filter((o) => o.line === 'GK'),
    DEF: ordered.filter((o) => o.line === 'DEF'),
    MID: ordered.filter((o) => o.line === 'MID'),
    FWD: ordered.filter((o) => o.line === 'FWD'),
  };

  const result: Array<{ player: Player; x: number; y: number }> = [];

  const placeLine = (
    list: Array<{ player: Player }>,
    baseXFromOwnGoal: number,
    yPadding: number
  ) => {
    const n = list.length;
    list.forEach((item, i) => {
      const y =
        n === 1
          ? PITCH_H / 2
          : yPadding + ((PITCH_H - yPadding * 2) * i) / (n - 1);
      const x = attackingRight ? baseXFromOwnGoal : PITCH_W - baseXFromOwnGoal;
      result.push({ player: item.player, x, y });
    });
  };

  placeLine(byLine.GK, 5.2, PITCH_H / 2);
  placeLine(byLine.DEF, 21, 10);
  placeLine(byLine.MID, 38, 13);
  placeLine(byLine.FWD, 52, 14);

  return result;
}

const GOAL_TEMPLATES = [
  (s: string, a?: string) =>
    a
      ? `GOAL! ${s} lashes it into the corner after a crisp through-ball from ${a}!`
      : `GOAL! ${s} bursts into the box and buries a clinical finish!`,
  (s: string, a?: string) =>
    a
      ? `GOAL! Brilliant link-up play — ${a} squares it and ${s} fires past the keeper!`
      : `GOAL! Unstoppable strike from ${s} straight into the side netting!`,
  (s: string, a?: string) =>
    a
      ? `GOAL! ${s} meets ${a}'s incisive pass and slots it home calmly!`
      : `GOAL! ${s} curls a venomous shot beyond the outstretched gloves!`,
];

const SAVE_TEMPLATES = [
  (gk: string, shooter: string) =>
    `WHAT A SAVE! ${gk} dives at full stretch to deny ${shooter}'s fierce strike!`,
  (gk: string, shooter: string) =>
    `SUPERB STOP! ${gk} reacts lightning-fast to parry ${shooter}'s close-range effort!`,
  (gk: string, shooter: string) =>
    `DENIED! ${gk} tips ${shooter}'s curling effort away from the top corner!`,
];

const MISS_TEMPLATES = [
  (shooter: string) => `${shooter} pulls the trigger from distance, but it whistles just wide of the post.`,
  (shooter: string) => `Close! ${shooter} finds half a yard and fires narrowly past the upright.`,
];

const TACKLE_TEMPLATES = [
  (def: string, carrier: string) => `Clean sliding challenge by ${def} to dispossess ${carrier} cleanly.`,
  (def: string, carrier: string) => `${def} reads the danger and intercepts ${carrier}'s run.`,
];

export class LiveMatchEngine {
  public fixture: Fixture;
  public homeClub: Club;
  public awayClub: Club;

  public phase: MatchPhase = 'PRE_MATCH';
  public matchSeconds = 0;
  public homeScore = 0;
  public awayScore = 0;
  public homePenalties = 0;
  public awayPenalties = 0;
  public penaltyLog: PenaltyKick[] = [];

  public entities: PitchPlayerEntity[] = [];
  public ball: BallEntity;
  public particles: PitchParticle[] = [];
  public events: MatchEvent[] = [];
  public stats: MatchStats;
  public matchPlayerStats: Record<string, PlayerMatchStat> = {};
  public banner: LiveBannerCue | null = null;
  public preMatchCountdown: number | null = 9;
  public nextMatchCountdown: number | null = null;

  private eventCounter = 1;
  private resetPauseTimer = 0;
  private lastTackleCommentarySim = -100;
  private lastMissCommentarySim = -100;
  private nextShotWindowSim = 70;
  private possessionAccum = 0;
  private penaltyTimer = 0;
  private penaltyTurn: 'home' | 'away' = 'home';
  private penaltyRound = 1;
  private penaltyKicksTaken = { home: 0, away: 0 };
  private penaltyInFlight = false;
  private penaltyCurrentOutcome: {
    scored: boolean;
    kicker: PitchPlayerEntity;
    keeper: PitchPlayerEntity;
    side: 'home' | 'away';
  } | null = null;

  private onStatDelta: (delta: MatchStatDelta) => void;
  private onMatchFinished: (payload: MatchCompletionPayload) => void;
  private finishedEmitted = false;

  constructor(
    fixture: Fixture,
    homeClub: Club,
    awayClub: Club,
    onStatDelta: (delta: MatchStatDelta) => void,
    onMatchFinished: (payload: MatchCompletionPayload) => void
  ) {
    this.fixture = fixture;
    this.homeClub = homeClub;
    this.awayClub = awayClub;
    this.onStatDelta = onStatDelta;
    this.onMatchFinished = onMatchFinished;
    this.stats = createEmptyMatchStats();

    // Initialize zeroed per-match stats for all players in both squads
    [...homeClub.players, ...awayClub.players].forEach((p) => {
      this.matchPlayerStats[p.id] = { goals: 0, assists: 0, saves: 0, shots: 0 };
    });

    this.ball = this.createCenterBall();
    this.setupEntities(false);
    this.assignKickoffPossession('home');
  }

  public kickoffNow(): void {
    if (this.phase !== 'PRE_MATCH') return;
    this.phase = 'FIRST_HALF';
    this.preMatchCountdown = null;
    this.addEvent(
      'KICKOFF',
      `Kickoff! ${this.homeClub.name} get this 60-minute ${this.fixture.stageLabel} clash underway against ${this.awayClub.name}.`,
      { teamId: this.homeClub.id }
    );
    soundEngine.playWhistle('kickoff');
  }

  private recordMatchPlayerStat(
    playerId: string,
    clubId: string,
    delta: { goals?: number; assists?: number; saves?: number; shots?: number }
  ): void {
    const existing = this.matchPlayerStats[playerId] ?? {
      goals: 0,
      assists: 0,
      saves: 0,
      shots: 0,
    };
    this.matchPlayerStats[playerId] = {
      goals: existing.goals + (delta.goals ?? 0),
      assists: existing.assists + (delta.assists ?? 0),
      saves: existing.saves + (delta.saves ?? 0),
      shots: existing.shots + (delta.shots ?? 0),
    };
    this.onStatDelta({ playerId, clubId, ...delta });
  }

  private createCenterBall(): BallEntity {
    return {
      x: PITCH_W / 2,
      y: PITCH_H / 2,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      ownerId: null,
      lastTouchTeam: null,
      lastTouchPlayerId: null,
      prevTouchTeam: null,
      prevTouchPlayerId: null,
      isShot: false,
      shotTargetSide: null,
      trail: [],
    };
  }

  private setupEntities(swappedEnds: boolean): void {
    const homeCoords = getFormationCoordinates(this.homeClub.players, 'home', swappedEnds);
    const awayCoords = getFormationCoordinates(this.awayClub.players, 'away', swappedEnds);

    const makeEntity = (
      item: { player: Player; x: number; y: number },
      teamSide: 'home' | 'away',
      teamId: string
    ): PitchPlayerEntity => ({
      playerId: item.player.id,
      teamSide,
      teamId,
      name: item.player.name,
      number: item.player.number,
      position: item.player.position,
      photoUrl: item.player.photoUrl || '/player-images/default-player.svg',
      x: item.x,
      y: item.y,
      vx: 0,
      vy: 0,
      homeX: item.x,
      homeY: item.y,
      attack: item.player.attack,
      defense: item.player.defense,
      pace: item.player.pace,
      passing: item.player.passing,
      goalkeeping: item.player.goalkeeping,
      cooldown: 0,
      diveTimer: 0,
      diveDirY: 0,
    });

    this.entities = [
      ...homeCoords.map((c) => makeEntity(c, 'home', this.homeClub.id)),
      ...awayCoords.map((c) => makeEntity(c, 'away', this.awayClub.id)),
    ];
  }

  private assignKickoffPossession(side: 'home' | 'away'): void {
    const candidates = this.entities.filter(
      (e) => e.teamSide === side && e.position !== 'GK'
    );
    const striker =
      candidates.find((e) => e.position === 'FWD') ??
      candidates[candidates.length - 1];

    this.ball = this.createCenterBall();
    if (striker) {
      striker.x = PITCH_W / 2 + (side === 'home' ? -1.4 : 1.4);
      striker.y = PITCH_H / 2;
      this.ball.ownerId = striker.playerId;
      this.ball.lastTouchTeam = side;
      this.ball.lastTouchPlayerId = striker.playerId;
    }
  }

  private addEvent(
    type: MatchEvent['type'],
    text: string,
    extra: Partial<MatchEvent> = {}
  ): void {
    const { clockText, minuteNumber } = formatMatchClock(this.matchSeconds, this.phase);
    const ev: MatchEvent = {
      id: `${this.fixture.id}-ev-${this.eventCounter++}`,
      minute: minuteNumber,
      displayClock: clockText,
      type,
      text,
      ...extra,
    };
    this.events = [ev, ...this.events].slice(0, 80);
  }

  private spawnConfetti(x: number, y: number, primary: string, secondary: string): void {
    for (let i = 0; i < 38; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 8 + Math.random() * 24;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color: i % 3 === 0 ? '#EAB308' : i % 2 === 0 ? primary : secondary,
        life: 1.4 + Math.random() * 0.8,
        maxLife: 2.2,
        size: 0.55 + Math.random() * 0.65,
      });
    }
  }

  private getAttackingRight(side: 'home' | 'away'): boolean {
    const swapped = this.phase === 'SECOND_HALF';
    return (side === 'home' && !swapped) || (side === 'away' && swapped);
  }

  public step(realDt: number, speed: SpeedOption, paused: boolean): void {
    const dt = Math.min(0.05, Math.max(0.001, realDt));

    this.updateParticles(dt);

    if (this.banner && performance.now() > this.banner.expiresAt) {
      this.banner = null;
    }

    if (paused || this.phase === 'FULL_TIME') {
      return;
    }

    // Pre-Match Lineup Showcase countdown before kickoff
    if (this.phase === 'PRE_MATCH') {
      if (this.preMatchCountdown !== null) {
        this.preMatchCountdown -= dt;
        if (this.preMatchCountdown <= 0) {
          this.kickoffNow();
        }
      }
      return;
    }

    const visualScale =
      speed === 1
        ? 0.95
        : speed === 10
        ? 1.55
        : speed === 25
        ? 2.05
        : speed === 60
        ? 2.75
        : 3.65;
    const visDt = dt * visualScale;

    if (this.phase === 'PENALTIES') {
      this.stepPenalties(dt, visDt, speed);
      return;
    }

    // Advance continuous 60-minute clock
    const simDt = dt * speed;
    this.matchSeconds += simDt;

    // Seamless transition at 30:00 straight into 2nd Half (NO 5-minute half-time break)
    if (this.phase === 'FIRST_HALF' && this.matchSeconds >= FIRST_HALF_END) {
      this.phase = 'SECOND_HALF';
      this.setupEntities(true);
      this.assignKickoffPossession('away');
      this.addEvent(
        'SECOND_HALF_START',
        `Second Half underway! Teams switch ends — ${this.awayClub.name} kick off the final 30 minutes.`,
        { teamId: this.awayClub.id }
      );
      this.banner = {
        type: 'HALFTIME',
        title: 'SECOND HALF',
        subtitle: `${this.homeClub.shortCode} ${this.homeScore} – ${this.awayScore} ${this.awayClub.shortCode} · Ends Switched`,
        accentColor: '#EAB308',
        expiresAt: performance.now() + 2000,
      };
      soundEngine.playWhistle('kickoff');
      return;
    }

    if (this.phase === 'SECOND_HALF' && this.matchSeconds >= FULL_TIME_END) {
      this.matchSeconds = FULL_TIME_END;
      const isKnockout = this.fixture.stage !== 'GROUP';

      if (isKnockout && this.homeScore === this.awayScore) {
        this.startPenaltyShootout();
        return;
      }

      this.finishMatch();
      return;
    }

    if (this.resetPauseTimer > 0) {
      this.resetPauseTimer -= dt;
      return;
    }

    const subSteps = speed >= 60 ? 2 : 1;
    const subVisDt = visDt / subSteps;
    for (let s = 0; s < subSteps; s++) {
      this.stepActivePitch(subVisDt, speed);
    }
  }

  private stepActivePitch(visDt: number, speed: SpeedOption): void {
    const ball = this.ball;

    this.possessionAccum += visDt;
    if (this.possessionAccum >= 0.2) {
      this.possessionAccum = 0;
      if (ball.lastTouchTeam === 'home') this.stats.homePossessionTicks += 1;
      else if (ball.lastTouchTeam === 'away') this.stats.awayPossessionTicks += 1;
    }

    const owner = ball.ownerId
      ? this.entities.find((e) => e.playerId === ball.ownerId) ?? null
      : null;

    for (const p of this.entities) {
      if (p.cooldown > 0) p.cooldown = Math.max(0, p.cooldown - visDt);
      if (p.diveTimer > 0) p.diveTimer = Math.max(0, p.diveTimer - visDt);
    }

    const nearestBySide: Record<'home' | 'away', PitchPlayerEntity | null> = {
      home: null,
      away: null,
    };
    const nearestDist: Record<'home' | 'away', number> = { home: 999, away: 999 };

    for (const p of this.entities) {
      if (p.position === 'GK') continue;
      const d = Math.hypot(ball.x - p.x, ball.y - p.y);
      if (d < nearestDist[p.teamSide]) {
        nearestDist[p.teamSide] = d;
        nearestBySide[p.teamSide] = p;
      }
    }

    for (const p of this.entities) {
      const attackingRight = this.getAttackingRight(p.teamSide);
      const goalTargetX = attackingRight ? PITCH_W : 0;
      const ownGoalX = attackingRight ? 0 : PITCH_W;

      if (p.position === 'GK') {
        const desiredX = attackingRight ? 4.2 : PITCH_W - 4.2;
        const clampedBallY = Math.max(GOAL_Y_MIN + 0.8, Math.min(GOAL_Y_MAX - 0.8, ball.y));
        const gkSpeed = (6.5 + (p.goalkeeping / 100) * 5.2) * (p.diveTimer > 0 ? 1.55 : 1);

        const targetY =
          p.diveTimer > 0
            ? Math.max(GOAL_Y_MIN - 0.6, Math.min(GOAL_Y_MAX + 0.6, p.y + p.diveDirY * 8))
            : clampedBallY;

        const dx = desiredX - p.x;
        const dy = targetY - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.15) {
          const stepLen = Math.min(dist, gkSpeed * visDt);
          p.x += (dx / dist) * stepLen;
          p.y += (dy / dist) * stepLen;
        }
        continue;
      }

      const maxSpeed = 6.2 + (p.pace / 100) * 4.4;

      if (owner && owner.playerId === p.playerId) {
        let dirX = goalTargetX - p.x;
        let dirY = PITCH_H / 2 - p.y;

        let nearestOpp: PitchPlayerEntity | null = null;
        let minOppDist = 14;
        for (const other of this.entities) {
          if (other.teamSide !== p.teamSide && other.position !== 'GK') {
            const d = Math.hypot(other.x - p.x, other.y - p.y);
            if (d < minOppDist) {
              minOppDist = d;
              nearestOpp = other;
            }
          }
        }
        if (nearestOpp) {
          dirY += (p.y - nearestOpp.y) * 1.4;
        }

        const norm = Math.hypot(dirX, dirY) || 1;
        const dribbleSpeed = maxSpeed * 0.88;
        p.vx = (dirX / norm) * dribbleSpeed;
        p.vy = (dirY / norm) * dribbleSpeed;
        p.x = Math.max(2, Math.min(PITCH_W - 2, p.x + p.vx * visDt));
        p.y = Math.max(3, Math.min(PITCH_H - 3, p.y + p.vy * visDt));

        ball.x = p.x + (dirX / norm) * 1.35;
        ball.y = p.y + (dirY / norm) * 1.35;
        ball.vx = p.vx;
        ball.vy = p.vy;
        ball.z = 0;

        this.evaluateCarrierDecision(p, visDt, speed, goalTargetX, minOppDist, nearestOpp);
        continue;
      }

      let targetX = p.homeX;
      let targetY = p.homeY;
      const isNearestChaser = nearestBySide[p.teamSide]?.playerId === p.playerId;

      if (!owner && isNearestChaser) {
        targetX = ball.x;
        targetY = ball.y;
      } else if (owner && owner.teamSide !== p.teamSide && isNearestChaser) {
        targetX = owner.x + (ownGoalX - owner.x) * 0.08;
        targetY = owner.y;
      } else {
        const ballShiftX = (ball.x - PITCH_W / 2) * 0.42;
        const ballShiftY = (ball.y - PITCH_H / 2) * 0.34;
        const attackingBonus =
          ball.lastTouchTeam === p.teamSide
            ? (attackingRight ? 9 : -9)
            : (attackingRight ? -6 : 6);

        targetX = Math.max(8, Math.min(PITCH_W - 8, p.homeX + ballShiftX + attackingBonus));
        targetY = Math.max(5, Math.min(PITCH_H - 5, p.homeY + ballShiftY));

        if (owner && owner.teamSide === p.teamSide && p.position === 'FWD') {
          targetX = attackingRight
            ? Math.min(PITCH_W - 10, targetX + 9)
            : Math.max(10, targetX - 9);
        }
      }

      const dx = targetX - p.x;
      const dy = targetY - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.3) {
        const spd = isNearestChaser ? maxSpeed : maxSpeed * 0.82;
        const stepLen = Math.min(dist, spd * visDt);
        p.vx = (dx / dist) * spd;
        p.vy = (dy / dist) * spd;
        p.x = Math.max(2, Math.min(PITCH_W - 2, p.x + (dx / dist) * stepLen));
        p.y = Math.max(3, Math.min(PITCH_H - 3, p.y + (dy / dist) * stepLen));
      } else {
        p.vx = 0;
        p.vy = 0;
      }

      if (
        owner &&
        owner.teamSide !== p.teamSide &&
        p.cooldown <= 0 &&
        Math.hypot(owner.x - p.x, owner.y - p.y) < 2.25
      ) {
        const tackleChance =
          (0.32 + (p.defense - owner.attack) / 220) * visDt * 3.8;
        if (Math.random() < Math.max(0.04, tackleChance)) {
          owner.cooldown = 0.85;
          p.cooldown = 0.45;
          ball.ownerId = p.playerId;
          ball.prevTouchTeam = ball.lastTouchTeam;
          ball.prevTouchPlayerId = ball.lastTouchPlayerId;
          ball.lastTouchTeam = p.teamSide;
          ball.lastTouchPlayerId = p.playerId;
          ball.isShot = false;

          if (p.teamSide === 'home') this.stats.homeTackles += 1;
          else this.stats.awayTackles += 1;

          soundEngine.playKick('pass');

          if (this.matchSeconds - this.lastTackleCommentarySim > 280) {
            this.lastTackleCommentarySim = this.matchSeconds;
            const tmpl = TACKLE_TEMPLATES[Math.floor(Math.random() * TACKLE_TEMPLATES.length)];
            this.addEvent('TACKLE', tmpl(p.name, owner.name), { teamId: p.teamId });
          }
        } else {
          p.cooldown = 0.55;
        }
      }
    }

    if (!ball.ownerId) {
      ball.x += ball.vx * visDt;
      ball.y += ball.vy * visDt;

      if (ball.isShot || Math.hypot(ball.vx, ball.vy) > 18) {
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 10) ball.trail.shift();
      } else if (ball.trail.length > 0) {
        ball.trail.shift();
      }

      const drag = Math.pow(ball.isShot ? 0.82 : 0.48, visDt);
      ball.vx *= drag;
      ball.vy *= drag;

      if (ball.z > 0 || ball.vz !== 0) {
        ball.z += ball.vz * visDt;
        ball.vz -= 22 * visDt;
        if (ball.z < 0) {
          ball.z = 0;
          ball.vz = 0;
        }
      }

      if (ball.isShot && ball.shotTargetSide) {
        const defendingGK = this.entities.find(
          (e) => e.teamSide === ball.shotTargetSide && e.position === 'GK'
        );
        if (defendingGK) {
          const distToGK = Math.hypot(ball.x - defendingGK.x, ball.y - defendingGK.y);
          if (distToGK < 4.4 && defendingGK.cooldown <= 0) {
            const shooter = this.entities.find((e) => e.playerId === ball.lastTouchPlayerId);
            const shooterAttack = shooter?.attack ?? 78;
            const saveProb = Math.min(
              0.84,
              Math.max(0.32, 0.56 + (defendingGK.goalkeeping - shooterAttack) * 0.0085)
            );

            defendingGK.diveTimer = 0.65;
            defendingGK.diveDirY = ball.y >= defendingGK.y ? 1 : -1;
            defendingGK.cooldown = 0.8;

            if (Math.random() < saveProb) {
              this.handleGoalkeeperSave(defendingGK, shooter);
              return;
            }
          }
        }
      }

      const inGoalMouth = ball.y >= GOAL_Y_MIN && ball.y <= GOAL_Y_MAX;
      if (ball.x >= PITCH_W - 0.6) {
        if (inGoalMouth) {
          const scoringSide: 'home' | 'away' = this.getAttackingRight('home') ? 'home' : 'away';
          this.handleGoalScored(scoringSide);
          return;
        } else {
          this.handleOutOfBounds('right');
          return;
        }
      }
      if (ball.x <= 0.6) {
        if (inGoalMouth) {
          const scoringSide: 'home' | 'away' = this.getAttackingRight('home') ? 'away' : 'home';
          this.handleGoalScored(scoringSide);
          return;
        } else {
          this.handleOutOfBounds('left');
          return;
        }
      }

      if (ball.y < 1.5) {
        ball.y = 1.5;
        ball.vy = Math.abs(ball.vy) * 0.6;
      } else if (ball.y > PITCH_H - 1.5) {
        ball.y = PITCH_H - 1.5;
        ball.vy = -Math.abs(ball.vy) * 0.6;
      }

      for (const p of this.entities) {
        if (p.cooldown > 0) continue;
        const pickupRadius = p.position === 'GK' ? 2.8 : 2.15;
        if (Math.hypot(ball.x - p.x, ball.y - p.y) < pickupRadius) {
          if (ball.isShot && p.teamSide !== ball.lastTouchTeam) {
            if (p.position === 'GK') {
              const shooter = this.entities.find((e) => e.playerId === ball.lastTouchPlayerId);
              this.handleGoalkeeperSave(p, shooter);
              return;
            }
            ball.isShot = false;
            ball.shotTargetSide = null;
          }

          ball.ownerId = p.playerId;
          ball.isShot = false;
          ball.shotTargetSide = null;
          ball.trail = [];
          if (p.playerId !== ball.lastTouchPlayerId) {
            ball.prevTouchTeam = ball.lastTouchTeam;
            ball.prevTouchPlayerId = ball.lastTouchPlayerId;
            ball.lastTouchTeam = p.teamSide;
            ball.lastTouchPlayerId = p.playerId;
          }

          if (p.position === 'GK') {
            this.distributeFromGoalkeeper(p);
          }
          break;
        }
      }
    }
  }

  private evaluateCarrierDecision(
    carrier: PitchPlayerEntity,
    visDt: number,
    speed: SpeedOption,
    goalTargetX: number,
    minOppDist: number,
    nearestOpp: PitchPlayerEntity | null
  ): void {
    const distToGoal = Math.hypot(goalTargetX - carrier.x, PITCH_H / 2 - carrier.y);
    const shotWindowOpen = this.matchSeconds >= this.nextShotWindowSim;
    const speedShotScale =
      speed === 1 ? 0.55 : speed === 10 ? 0.95 : speed === 25 ? 1.25 : speed === 60 ? 1.65 : 2.3;

    if (shotWindowOpen && distToGoal < 28 && carrier.position !== 'GK') {
      const baseShotRate = (distToGoal < 17 ? 1.65 : 0.85) * speedShotScale;
      const attackFactor = 0.75 + (carrier.attack / 100) * 0.55;
      if (Math.random() < baseShotRate * attackFactor * visDt) {
        this.nextShotWindowSim = this.matchSeconds + 100 + Math.random() * 95;
        this.fireShot(carrier, goalTargetX);
        return;
      }
    }

    const underPressure = minOppDist < 7.5 && nearestOpp !== null;
    const passRate = (underPressure ? 2.2 : 0.85) * (0.75 + (carrier.passing / 100) * 0.45);

    if (Math.random() < passRate * visDt) {
      const attackingRight = this.getAttackingRight(carrier.teamSide);
      const teammates = this.entities.filter(
        (t) => t.teamSide === carrier.teamSide && t.playerId !== carrier.playerId && t.position !== 'GK'
      );

      let bestTarget: PitchPlayerEntity | null = null;
      let bestScore = -999;

      for (const mate of teammates) {
        const d = Math.hypot(mate.x - carrier.x, mate.y - carrier.y);
        if (d < 6 || d > 42) continue;
        const forwardGain = attackingRight ? mate.x - carrier.x : carrier.x - mate.x;
        const score = forwardGain * 1.4 - Math.abs(d - 18) * 0.35 + (Math.random() * 8 - 4);
        if (score > bestScore) {
          bestScore = score;
          bestTarget = mate;
        }
      }

      if (bestTarget) {
        this.executePass(carrier, bestTarget);
      }
    }
  }

  private executePass(passer: PitchPlayerEntity, target: PitchPlayerEntity): void {
    const ball = this.ball;
    const leadX = target.x + target.vx * 0.25;
    const leadY = target.y + target.vy * 0.25;
    const dx = leadX - passer.x;
    const dy = leadY - passer.y;
    const dist = Math.hypot(dx, dy) || 1;
    const passSpeed = Math.min(34, Math.max(19, dist * 1.25));

    const inaccuracy = ((100 - passer.passing) / 100) * 0.16;
    const angle = Math.atan2(dy, dx) + (Math.random() * 2 - 1) * inaccuracy;

    ball.ownerId = null;
    ball.vx = Math.cos(angle) * passSpeed;
    ball.vy = Math.sin(angle) * passSpeed;
    ball.vz = dist > 24 ? 5.5 : 1.2;
    ball.isShot = false;
    ball.shotTargetSide = null;
    ball.prevTouchTeam = ball.lastTouchTeam;
    ball.prevTouchPlayerId = ball.lastTouchPlayerId;
    ball.lastTouchTeam = passer.teamSide;
    ball.lastTouchPlayerId = passer.playerId;

    passer.cooldown = 0.55;

    if (passer.teamSide === 'home') this.stats.homePasses += 1;
    else this.stats.awayPasses += 1;

    soundEngine.playKick('pass');
  }

  private distributeFromGoalkeeper(gk: PitchPlayerEntity): void {
    const mates = this.entities.filter(
      (e) => e.teamSide === gk.teamSide && e.position !== 'GK'
    );
    if (mates.length === 0) return;
    const target = mates[Math.floor(Math.random() * Math.min(mates.length, 6))];
    this.executePass(gk, target);
  }

  private fireShot(shooter: PitchPlayerEntity, goalTargetX: number): void {
    const ball = this.ball;
    const targetSide: 'home' | 'away' = shooter.teamSide === 'home' ? 'away' : 'home';

    const onTargetProb = Math.min(0.84, Math.max(0.46, 0.42 + (shooter.attack / 100) * 0.44));
    const isOnTarget = Math.random() < onTargetProb;

    let aimY: number;
    if (isOnTarget) {
      aimY =
        Math.random() < 0.5
          ? GOAL_Y_MIN + 1.0 + Math.random() * 2.8
          : GOAL_Y_MAX - 1.0 - Math.random() * 2.8;
    } else {
      aimY =
        Math.random() < 0.5
          ? GOAL_Y_MIN - 2.2 - Math.random() * 3.5
          : GOAL_Y_MAX + 2.2 + Math.random() * 3.5;
    }

    const dx = goalTargetX - shooter.x;
    const dy = aimY - shooter.y;
    const dist = Math.hypot(dx, dy) || 1;
    const shotSpeed = 38 + (shooter.attack / 100) * 14;

    ball.ownerId = null;
    ball.vx = (dx / dist) * shotSpeed;
    ball.vy = (dy / dist) * shotSpeed;
    ball.vz = 5.2;
    ball.isShot = true;
    ball.shotTargetSide = targetSide;
    ball.trail = [{ x: ball.x, y: ball.y }];

    shooter.cooldown = 0.85;

    if (shooter.teamSide === 'home') {
      this.stats.homeShots += 1;
      if (isOnTarget) this.stats.homeShotsOnTarget += 1;
    } else {
      this.stats.awayShots += 1;
      if (isOnTarget) this.stats.awayShotsOnTarget += 1;
    }

    this.recordMatchPlayerStat(shooter.playerId, shooter.teamId, { shots: 1 });
    soundEngine.playKick('shot');
  }

  private handleGoalkeeperSave(
    gk: PitchPlayerEntity,
    shooter: PitchPlayerEntity | undefined
  ): void {
    const ball = this.ball;
    ball.isShot = false;
    ball.shotTargetSide = null;
    ball.trail = [];
    ball.ownerId = gk.playerId;
    ball.prevTouchTeam = ball.lastTouchTeam;
    ball.prevTouchPlayerId = ball.lastTouchPlayerId;
    ball.lastTouchTeam = gk.teamSide;
    ball.lastTouchPlayerId = gk.playerId;

    if (gk.teamSide === 'home') this.stats.homeSaves += 1;
    else this.stats.awaySaves += 1;

    this.recordMatchPlayerStat(gk.playerId, gk.teamId, { saves: 1 });

    const shooterName = shooter?.name ?? 'the forward';
    const tmpl = SAVE_TEMPLATES[Math.floor(Math.random() * SAVE_TEMPLATES.length)];
    this.addEvent('SAVE', tmpl(gk.name, shooterName), {
      teamId: gk.teamId,
      goalkeeperId: gk.playerId,
      goalkeeperName: gk.name,
    });

    this.banner = {
      type: 'SAVE',
      title: 'SUPERB SAVE',
      subtitle: `${gk.name} denies ${shooterName}`,
      accentColor: '#10B981',
      expiresAt: performance.now() + 1700,
    };

    soundEngine.playSave();
    this.distributeFromGoalkeeper(gk);
  }

  private handleOutOfBounds(edge: 'left' | 'right'): void {
    const ball = this.ball;
    if (ball.isShot && this.matchSeconds - this.lastMissCommentarySim > 190) {
      const shooter = this.entities.find((e) => e.playerId === ball.lastTouchPlayerId);
      if (shooter) {
        this.lastMissCommentarySim = this.matchSeconds;
        const tmpl = MISS_TEMPLATES[Math.floor(Math.random() * MISS_TEMPLATES.length)];
        this.addEvent('SHOT_MISS', tmpl(shooter.name), { teamId: shooter.teamId });
      }
    }

    const rightSideTeam: 'home' | 'away' = this.getAttackingRight('home') ? 'away' : 'home';
    const defendingSide: 'home' | 'away' = edge === 'right' ? rightSideTeam : rightSideTeam === 'home' ? 'away' : 'home';
    const gk = this.entities.find((e) => e.teamSide === defendingSide && e.position === 'GK');

    ball.isShot = false;
    ball.shotTargetSide = null;
    ball.trail = [];
    if (gk) {
      ball.x = gk.x;
      ball.y = gk.y;
      ball.ownerId = gk.playerId;
      ball.lastTouchTeam = gk.teamSide;
      ball.lastTouchPlayerId = gk.playerId;
      this.distributeFromGoalkeeper(gk);
    } else {
      ball.x = PITCH_W / 2;
      ball.y = PITCH_H / 2;
      ball.vx = 0;
      ball.vy = 0;
    }
  }

  private handleGoalScored(scoringSide: 'home' | 'away'): void {
    const ball = this.ball;
    const club = scoringSide === 'home' ? this.homeClub : this.awayClub;

    if (scoringSide === 'home') this.homeScore += 1;
    else this.awayScore += 1;

    let scorer = this.entities.find(
      (e) => e.playerId === ball.lastTouchPlayerId && e.teamSide === scoringSide
    );
    if (!scorer) {
      scorer =
        this.entities.find((e) => e.teamSide === scoringSide && e.position === 'FWD') ??
        this.entities.find((e) => e.teamSide === scoringSide && e.position !== 'GK');
    }

    let assister: PitchPlayerEntity | undefined;
    if (
      ball.prevTouchTeam === scoringSide &&
      ball.prevTouchPlayerId &&
      ball.prevTouchPlayerId !== scorer?.playerId
    ) {
      assister = this.entities.find((e) => e.playerId === ball.prevTouchPlayerId);
    }

    if (scorer) {
      this.recordMatchPlayerStat(scorer.playerId, club.id, { goals: 1 });
    }
    if (assister) {
      this.recordMatchPlayerStat(assister.playerId, club.id, { assists: 1 });
    }

    const scorerName = scorer?.name ?? club.name;
    const assisterName = assister?.name;
    const tmpl = GOAL_TEMPLATES[Math.floor(Math.random() * GOAL_TEMPLATES.length)];

    this.addEvent('GOAL', tmpl(scorerName, assisterName), {
      teamId: club.id,
      scorerId: scorer?.playerId,
      scorerName,
      assisterId: assister?.playerId,
      assisterName,
    });

    this.banner = {
      type: 'GOAL',
      title: `GOAL · ${club.name.toUpperCase()}`,
      subtitle: assisterName
        ? `${scorerName} · Assist: ${assisterName}`
        : `${scorerName} · ${this.homeClub.shortCode} ${this.homeScore} – ${this.awayScore} ${this.awayClub.shortCode}`,
      accentColor: '#EAB308',
      expiresAt: performance.now() + 2500,
    };

    this.spawnConfetti(
      ball.x > PITCH_W / 2 ? PITCH_W - 2 : 2,
      PITCH_H / 2,
      club.primaryColor,
      club.secondaryColor
    );

    soundEngine.playGoal();

    const concedingSide: 'home' | 'away' = scoringSide === 'home' ? 'away' : 'home';
    this.setupEntities(this.phase === 'SECOND_HALF');
    this.assignKickoffPossession(concedingSide);
    this.resetPauseTimer = 1.05;
  }

  private startPenaltyShootout(): void {
    this.phase = 'PENALTIES';
    this.homePenalties = 0;
    this.awayPenalties = 0;
    this.penaltyLog = [];
    this.penaltyTurn = 'home';
    this.penaltyRound = 1;
    this.penaltyKicksTaken = { home: 0, away: 0 };
    this.penaltyTimer = 0.8;
    this.penaltyInFlight = false;
    this.penaltyCurrentOutcome = null;

    this.addEvent(
      'PENALTY_START',
      `Level after 60 minutes (${this.homeScore}–${this.awayScore})! This clash goes to a Penalty Shootout!`
    );
    this.banner = {
      type: 'PENALTIES',
      title: 'PENALTY SHOOTOUT',
      subtitle: `${this.homeClub.name} vs ${this.awayClub.name} · Decider`,
      accentColor: '#EAB308',
      expiresAt: performance.now() + 2400,
    };
    soundEngine.playWhistle('halftime');
    this.positionForPenalty('home');
  }

  private positionForPenalty(kickingSide: 'home' | 'away'): void {
    const defendingSide: 'home' | 'away' = kickingSide === 'home' ? 'away' : 'home';
    const kickers = this.entities
      .filter((e) => e.teamSide === kickingSide && e.position !== 'GK')
      .sort((a, b) => b.attack - a.attack);
    const kicker = kickers[this.penaltyKicksTaken[kickingSide] % Math.max(1, kickers.length)];
    const keeper = this.entities.find((e) => e.teamSide === defendingSide && e.position === 'GK');

    this.entities.forEach((e, idx) => {
      e.x = 46 + (idx % 5) * 2;
      e.y = 20 + Math.floor(idx / 5) * 6;
      e.diveTimer = 0;
    });

    if (kicker) {
      kicker.x = 84;
      kicker.y = PITCH_H / 2;
    }
    if (keeper) {
      keeper.x = 96.5;
      keeper.y = PITCH_H / 2;
    }

    this.ball = this.createCenterBall();
    this.ball.x = 87.5;
    this.ball.y = PITCH_H / 2;
  }

  private stepPenalties(realDt: number, visDt: number, speed: SpeedOption): void {
    const pace = speed >= 60 ? 2.6 : speed >= 25 ? 1.6 : 1.0;

    if (this.penaltyInFlight && this.penaltyCurrentOutcome) {
      this.ball.x += this.ball.vx * visDt;
      this.ball.y += this.ball.vy * visDt;
      this.ball.trail.push({ x: this.ball.x, y: this.ball.y });
      if (this.ball.trail.length > 8) this.ball.trail.shift();

      const { keeper, kicker, scored, side } = this.penaltyCurrentOutcome;
      keeper.y += keeper.diveDirY * 14 * visDt;
      keeper.y = Math.max(GOAL_Y_MIN + 0.5, Math.min(GOAL_Y_MAX - 0.5, keeper.y));

      if (this.ball.x >= 96.5) {
        this.penaltyInFlight = false;
        const kickingClub = side === 'home' ? this.homeClub : this.awayClub;

        this.penaltyKicksTaken[side] += 1;
        if (scored) {
          if (side === 'home') this.homePenalties += 1;
          else this.awayPenalties += 1;
          this.spawnConfetti(98, PITCH_H / 2, kickingClub.primaryColor, kickingClub.secondaryColor);
          soundEngine.playGoal();
          this.addEvent(
            'PENALTY_GOAL',
            `PENALTY SCORED! ${kicker.name} (${kickingClub.shortCode}) scores past ${keeper.name}! (${this.homePenalties}–${this.awayPenalties})`,
            { teamId: kickingClub.id, scorerName: kicker.name }
          );
        } else {
          soundEngine.playSave();
          this.recordMatchPlayerStat(keeper.playerId, keeper.teamId, { saves: 1 });
          this.addEvent(
            'PENALTY_SAVE',
            `PENALTY SAVED! ${keeper.name} stops ${kicker.name}'s spot kick! (${this.homePenalties}–${this.awayPenalties})`,
            { teamId: keeper.teamId, goalkeeperName: keeper.name }
          );
        }

        this.penaltyLog = [
          ...this.penaltyLog,
          {
            round: this.penaltyRound,
            teamSide: side,
            teamId: kickingClub.id,
            kickerName: kicker.name,
            keeperName: keeper.name,
            scored,
          },
        ];

        if (this.isShootoutDecided()) {
          this.finishMatch();
          return;
        }

        if (this.penaltyTurn === 'home') {
          this.penaltyTurn = 'away';
        } else {
          this.penaltyTurn = 'home';
          this.penaltyRound += 1;
        }
        this.penaltyCurrentOutcome = null;
        this.penaltyTimer = 0.9 / pace;
        this.positionForPenalty(this.penaltyTurn);
      }
      return;
    }

    this.penaltyTimer -= realDt * pace;
    if (this.penaltyTimer <= 0) {
      const side = this.penaltyTurn;
      const defendingSide: 'home' | 'away' = side === 'home' ? 'away' : 'home';
      const kickers = this.entities
        .filter((e) => e.teamSide === side && e.position !== 'GK')
        .sort((a, b) => b.attack - a.attack);
      const kicker = kickers[this.penaltyKicksTaken[side] % Math.max(1, kickers.length)];
      const keeper = this.entities.find((e) => e.teamSide === defendingSide && e.position === 'GK')!;

      const scoreProb = Math.min(
        0.88,
        Math.max(0.58, 0.74 + (kicker.attack - keeper.goalkeeping) * 0.005)
      );
      const scored = Math.random() < scoreProb;
      const cornerDir = Math.random() < 0.5 ? -1 : 1;
      const aimY = PITCH_H / 2 + cornerDir * 4.8;

      keeper.diveTimer = 0.8;
      keeper.diveDirY = scored ? -cornerDir : cornerDir;

      const dx = 98.5 - this.ball.x;
      const dy = aimY - this.ball.y;
      const d = Math.hypot(dx, dy) || 1;
      this.ball.vx = (dx / d) * 34;
      this.ball.vy = (dy / d) * 34;
      this.ball.isShot = true;

      this.penaltyInFlight = true;
      this.penaltyCurrentOutcome = { scored, kicker, keeper, side };
      soundEngine.playKick('shot');
    }
  }

  private isShootoutDecided(): boolean {
    const hTaken = this.penaltyKicksTaken.home;
    const aTaken = this.penaltyKicksTaken.away;
    const hScore = this.homePenalties;
    const aScore = this.awayPenalties;

    if (hTaken <= 5 && aTaken <= 5) {
      const hRem = 5 - hTaken;
      const aRem = 5 - aTaken;
      if (hScore > aScore + aRem) return true;
      if (aScore > hScore + hRem) return true;
      if (hTaken === 5 && aTaken === 5 && hScore !== aScore) return true;
      return false;
    }

    return hTaken === aTaken && hScore !== aScore;
  }

  private finishMatch(): void {
    if (this.finishedEmitted) return;
    this.finishedEmitted = true;
    this.phase = 'FULL_TIME';
    this.ball.ownerId = null;
    this.ball.vx = 0;
    this.ball.vy = 0;

    let winnerId: string | null = null;
    if (this.homeScore > this.awayScore) winnerId = this.homeClub.id;
    else if (this.awayScore > this.homeScore) winnerId = this.awayClub.id;
    else if (this.homePenalties > this.awayPenalties) winnerId = this.homeClub.id;
    else if (this.awayPenalties > this.homePenalties) winnerId = this.awayClub.id;

    const winnerClub =
      winnerId === this.homeClub.id
        ? this.homeClub
        : winnerId === this.awayClub.id
        ? this.awayClub
        : null;

    const penText =
      this.penaltyLog.length > 0
        ? ` (${this.homePenalties}–${this.awayPenalties} on pens)`
        : '';

    this.addEvent(
      'FULLTIME',
      winnerClub
        ? `FULL TIME! ${this.homeClub.name} ${this.homeScore} – ${this.awayScore} ${this.awayClub.name}${penText}. ${winnerClub.name} claim victory!`
        : `FULL TIME! Honours even: ${this.homeClub.name} ${this.homeScore} – ${this.awayScore} ${this.awayClub.name}.`
    );

    if (this.fixture.stage === 'FINAL') {
      soundEngine.playChampionFanfare();
    } else {
      soundEngine.playWhistle('fulltime');
    }

    this.onMatchFinished({
      fixtureId: this.fixture.id,
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      homePenalties: this.penaltyLog.length > 0 ? this.homePenalties : undefined,
      awayPenalties: this.penaltyLog.length > 0 ? this.awayPenalties : undefined,
      penaltyLog: this.penaltyLog.length > 0 ? [...this.penaltyLog] : undefined,
      winnerId,
      events: [...this.events],
      stats: { ...this.stats },
      matchPlayerStats: { ...this.matchPlayerStats },
    });
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= Math.pow(0.25, dt);
      pt.vy *= Math.pow(0.25, dt);
      pt.life -= dt;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  public getSnapshot(nextMatchCountdown: number | null): LiveMatchSnapshot {
    return {
      fixtureId: this.fixture.id,
      phase: this.phase,
      matchSeconds: this.matchSeconds,
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      homePenalties: this.homePenalties,
      awayPenalties: this.awayPenalties,
      penaltyLog: this.penaltyLog,
      events: this.events,
      stats: { ...this.stats },
      matchPlayerStats: { ...this.matchPlayerStats },
      banner: this.banner,
      preMatchCountdown: this.preMatchCountdown,
      nextMatchCountdown,
    };
  }
}
