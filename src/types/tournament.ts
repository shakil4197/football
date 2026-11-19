export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface Player {
  id: string;
  name: string;
  number: number;
  position: PlayerPosition;
  attack: number;
  defense: number;
  pace: number;
  passing: number;
  goalkeeping: number;
  goals: number;
  assists: number;
  saves: number;
  shots: number;
  matchesPlayed: number;
}

export interface Club {
  id: string;
  name: string;
  shortCode: string;
  flag: string;
  primaryColor: string;
  secondaryColor: string;
  selected: boolean;
  players: Player[];
}

export interface ClubRatings {
  overall: number;
  attack: number;
  midfield: number;
  defense: number;
  goalkeeping: number;
}

export type MatchStage = 'GROUP' | 'QF' | 'SF' | 'FINAL';

export type MatchPhase =
  | 'PRE_MATCH'
  | 'FIRST_HALF'
  | 'HALFTIME_BREAK'
  | 'SECOND_HALF'
  | 'PENALTIES'
  | 'FULL_TIME';

export type MatchEventType =
  | 'KICKOFF'
  | 'GOAL'
  | 'SAVE'
  | 'SHOT_MISS'
  | 'TACKLE'
  | 'PASS_KEY'
  | 'HALFTIME'
  | 'SECOND_HALF_START'
  | 'PENALTY_START'
  | 'PENALTY_GOAL'
  | 'PENALTY_SAVE'
  | 'FULLTIME';

export interface MatchEvent {
  id: string;
  minute: number;
  displayClock: string;
  type: MatchEventType;
  teamId?: string;
  scorerId?: string;
  scorerName?: string;
  assisterId?: string;
  assisterName?: string;
  goalkeeperId?: string;
  goalkeeperName?: string;
  text: string;
}

export interface MatchStats {
  homePossessionTicks: number;
  awayPossessionTicks: number;
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  homeSaves: number;
  awaySaves: number;
  homePasses: number;
  awayPasses: number;
  homeTackles: number;
  awayTackles: number;
}

export interface PenaltyKick {
  round: number;
  teamSide: 'home' | 'away';
  teamId: string;
  kickerName: string;
  keeperName: string;
  scored: boolean;
}

export interface Fixture {
  id: string;
  order: number;
  stage: MatchStage;
  stageLabel: string;
  groupId?: string;
  bracketSlot?: 'QF1' | 'QF2' | 'QF3' | 'QF4' | 'SF1' | 'SF2' | 'FINAL';
  homeTeamId: string | null;
  awayTeamId: string | null;
  homePlaceholder?: string;
  awayPlaceholder?: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
  homeScore: number;
  awayScore: number;
  homePenalties?: number;
  awayPenalties?: number;
  penaltyLog?: PenaltyKick[];
  winnerId?: string | null;
  events: MatchEvent[];
  stats: MatchStats;
}

export interface GroupData {
  id: string;
  name: string;
  teamIds: string[];
  qualifyCount: number;
}

export interface StandingsRow {
  teamId: string;
  teamName: string;
  shortCode: string;
  primaryColor: string;
  secondaryColor: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  qualified: boolean;
}

export type TournamentStatus =
  | 'SETUP'
  | 'GROUP_STAGE'
  | 'QUARTER_FINALS'
  | 'SEMI_FINALS'
  | 'FINAL'
  | 'TOURNAMENT_COMPLETE';

export type ActiveTab = 'setup' | 'pitch' | 'bracket' | 'standings' | 'stats';

export type SpeedOption = 1 | 10 | 25 | 60 | 150;

export interface PitchPlayerEntity {
  playerId: string;
  teamSide: 'home' | 'away';
  teamId: string;
  name: string;
  number: number;
  position: PlayerPosition;
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeX: number;
  homeY: number;
  attack: number;
  defense: number;
  pace: number;
  passing: number;
  goalkeeping: number;
  cooldown: number;
  diveTimer: number;
  diveDirY: number;
}

export interface BallEntity {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  ownerId: string | null;
  lastTouchTeam: 'home' | 'away' | null;
  lastTouchPlayerId: string | null;
  prevTouchTeam: 'home' | 'away' | null;
  prevTouchPlayerId: string | null;
  isShot: boolean;
  shotTargetSide: 'home' | 'away' | null;
  trail: Array<{ x: number; y: number }>;
}

export interface PitchParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface LiveBannerCue {
  type: 'GOAL' | 'SAVE' | 'HALFTIME' | 'PENALTIES' | 'FULLTIME';
  title: string;
  subtitle: string;
  accentColor: string;
  expiresAt: number;
}

export interface LiveMatchSnapshot {
  fixtureId: string;
  phase: MatchPhase;
  matchSeconds: number; // 0 to 3900 (0-1800 1st Half, 1800-2100 Break, 2100-3900 2nd Half)
  homeScore: number;
  awayScore: number;
  homePenalties: number;
  awayPenalties: number;
  penaltyLog: PenaltyKick[];
  events: MatchEvent[];
  stats: MatchStats;
  banner: LiveBannerCue | null;
  nextMatchCountdown: number | null;
}

export interface PlayerLeaderboardRow {
  playerId: string;
  playerName: string;
  number: number;
  position: PlayerPosition;
  clubId: string;
  clubName: string;
  clubShortCode: string;
  clubColor: string;
  goals: number;
  assists: number;
  saves: number;
  shots: number;
  matchesPlayed: number;
}
