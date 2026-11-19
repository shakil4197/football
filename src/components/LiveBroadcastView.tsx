import React, { useState } from 'react';
import {
  Pause,
  Play,
  Volume2,
  VolumeX,
  Trophy,
  GitBranch,
  Table2,
  BarChart3,
  LogOut,
  X,
} from 'lucide-react';
import {
  Club,
  Fixture,
  GroupData,
  LiveMatchSnapshot,
  SpeedOption,
  TournamentStatus,
} from '../types/tournament';
import { formatMatchClock, LiveMatchEngine } from '../engine/matchSimulation';
import { PitchCanvas } from './PitchCanvas';
import { BracketView } from './BracketView';
import { StandingsView } from './StandingsView';
import { StatsView } from './StatsView';

interface LiveBroadcastViewProps {
  engineRef: React.MutableRefObject<LiveMatchEngine | null>;
  snapshot: LiveMatchSnapshot | null;
  activeFixture: Fixture | null;
  nextFixture: Fixture | null;
  groups: GroupData[];
  fixtures: Fixture[];
  clubs: Club[];
  clubsById: Record<string, Club>;
  tournamentStatus: TournamentStatus;
  championClub: Club | null;
  speed: SpeedOption;
  paused: boolean;
  muted: boolean;
  onChangeSpeed: (s: SpeedOption) => void;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onResetTournament: () => void;
}

type OverlayModal = 'bracket' | 'standings' | 'stats' | null;

const SPEED_OPTIONS: Array<{ value: SpeedOption; label: string }> = [
  { value: 1, label: '1x' },
  { value: 10, label: '10x' },
  { value: 25, label: '25x' },
  { value: 60, label: '60x' },
];

export const LiveBroadcastView: React.FC<LiveBroadcastViewProps> = ({
  engineRef,
  snapshot,
  activeFixture,
  nextFixture,
  groups,
  fixtures,
  clubs,
  clubsById,
  tournamentStatus,
  championClub,
  speed,
  paused,
  muted,
  onChangeSpeed,
  onTogglePause,
  onToggleMute,
  onResetTournament,
}) => {
  const [openOverlay, setOpenOverlay] = useState<OverlayModal>(null);
  const [trophyImgErr, setTrophyImgErr] = useState(false);

  const isComplete = tournamentStatus === 'TOURNAMENT_COMPLETE';

  const homeClub = activeFixture?.homeTeamId ? clubsById[activeFixture.homeTeamId] : null;
  const awayClub = activeFixture?.awayTeamId ? clubsById[activeFixture.awayTeamId] : null;
  const nextHome = nextFixture?.homeTeamId ? clubsById[nextFixture.homeTeamId] : null;
  const nextAway = nextFixture?.awayTeamId ? clubsById[nextFixture.awayTeamId] : null;

  const clockInfo = snapshot
    ? formatMatchClock(snapshot.matchSeconds, snapshot.phase)
    : { clockText: '00:00', countdownText: '65:00', phaseText: '1st Half · 30:00', minuteNumber: 0 };

  const latestCommentary = snapshot?.events[0];

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col bg-[#07150F] text-white select-none">
      {/* Slim Game Top Scoreboard Bar: Country vs Country · Goal Count · 65:00 Countdown */}
      {activeFixture && homeClub && awayClub && snapshot && (
        <header className="relative z-20 shrink-0 border-b border-white/10 bg-[#0A101A]/95 px-3 py-2 md:px-5">
          <div className="mx-auto flex items-center justify-between gap-3">
            {/* Left: Compact Game Overlay Buttons (Bracket / Table / Stats) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setOpenOverlay('bracket')}
                title="Tournament Bracket"
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
              >
                <GitBranch className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">Bracket</span>
              </button>
              {groups.length > 0 && (
                <button
                  type="button"
                  onClick={() => setOpenOverlay('standings')}
                  title="Group Standings"
                  className="inline-flex min-h-[34px] items-center gap-1.5 rounded bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
                >
                  <Table2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpenOverlay('stats')}
                title="Goals & Assists"
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
              >
                <BarChart3 className="h-3.5 w-3.5 text-sky-400" />
                <span className="hidden sm:inline">Stats</span>
              </button>
            </div>

            {/* Center Focal Anchor: ARGENTINA 2 - 1 BRAZIL · 65:00 COUNTDOWN */}
            <div className="flex items-center gap-3 md:gap-6 min-w-0">
              {/* Home Nation */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl leading-none hidden sm:inline" aria-hidden="true">
                  {homeClub.flag}
                </span>
                <span
                  className="h-3.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: homeClub.primaryColor }}
                />
                <span className="truncate font-display text-base font-bold tracking-wide text-white uppercase md:text-xl">
                  {homeClub.name}
                </span>
              </div>

              {/* Goal Count & 65-Minute Countdown */}
              <div className="flex items-center gap-3 rounded-md border border-white/15 bg-[#121C2B] px-3.5 py-1 shrink-0">
                <div className="flex items-baseline gap-2 font-mono text-2xl font-bold text-white tabular-nums md:text-3xl">
                  <span>{snapshot.homeScore}</span>
                  <span className="text-slate-500 text-lg">-</span>
                  <span>{snapshot.awayScore}</span>
                </div>

                {(snapshot.phase === 'PENALTIES' || snapshot.penaltyLog.length > 0) && (
                  <span className="font-mono text-xs font-bold text-amber-400 tabular-nums">
                    ({snapshot.homePenalties}-{snapshot.awayPenalties}P)
                  </span>
                )}

                <span className="h-6 w-px bg-white/15" aria-hidden="true" />

                <div className="flex flex-col leading-tight">
                  <span className="font-mono text-base font-bold text-emerald-400 tabular-nums md:text-lg">
                    {clockInfo.countdownText}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 tabular-nums whitespace-nowrap">
                    {clockInfo.phaseText}
                  </span>
                </div>
              </div>

              {/* Away Nation */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate font-display text-base font-bold tracking-wide text-white uppercase md:text-xl">
                  {awayClub.name}
                </span>
                <span
                  className="h-3.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: awayClub.primaryColor }}
                />
                <span className="text-xl leading-none hidden sm:inline" aria-hidden="true">
                  {awayClub.flag}
                </span>
              </div>
            </div>

            {/* Right: Pause, Speed, Sound, Exit */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={isComplete}
                onClick={onTogglePause}
                title={paused ? 'Resume Match' : 'Pause Match'}
                className="flex h-[34px] w-[34px] items-center justify-center rounded bg-white/[0.06] text-white hover:bg-white/15 disabled:opacity-40 cursor-pointer"
              >
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>

              <div className="hidden lg:flex items-center rounded bg-[#121C2B] p-0.5 border border-white/10">
                {SPEED_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isComplete}
                    onClick={() => onChangeSpeed(opt.value)}
                    className={`rounded px-2 py-1 font-mono text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-40 ${
                      speed === opt.value
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={onToggleMute}
                title={muted ? 'Unmute Audio' : 'Mute Audio'}
                className="flex h-[34px] w-[34px] items-center justify-center rounded bg-white/[0.06] text-slate-200 hover:bg-white/15 cursor-pointer"
              >
                {muted ? (
                  <VolumeX className="h-4 w-4 text-slate-500" />
                ) : (
                  <Volume2 className="h-4 w-4 text-emerald-400" />
                )}
              </button>

              <button
                type="button"
                onClick={onResetTournament}
                title="Exit to Team Selection"
                className="flex h-[34px] w-[34px] items-center justify-center rounded bg-white/[0.06] text-slate-300 hover:bg-red-500/20 hover:text-red-300 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Game Viewport: ONLY the Fullscreen Football Pitch */}
      <main className="relative flex-1 min-h-0 w-full">
        <PitchCanvas engineRef={engineRef} />

        {/* Subtle Floating Match Stage Label (Top Left Corner of Apron) */}
        {activeFixture && (
          <div className="pointer-events-none absolute top-2.5 left-4 z-10 text-[11px] font-mono font-semibold text-white/60 tracking-wider uppercase">
            {activeFixture.stageLabel} · Match {activeFixture.order}/{fixtures.length}
          </div>
        )}

        {/* Transient Goal / Save / Penalty Flash Banner */}
        {snapshot?.banner && snapshot.phase !== 'HALFTIME_BREAK' && !isComplete && (
          <div className="pointer-events-none absolute inset-x-0 top-6 z-20 flex justify-center px-4">
            <div className="rounded-md border border-white/20 bg-[#080E17]/92 px-7 py-3 text-center shadow-2xl backdrop-blur-sm">
              <p
                className="font-display text-2xl font-bold tracking-wider uppercase"
                style={{ color: snapshot.banner.accentColor }}
              >
                {snapshot.banner.title}
              </p>
              <p className="text-xs font-medium text-slate-200">{snapshot.banner.subtitle}</p>
            </div>
          </div>
        )}

        {/* Half-Time 5-Minute Break Overlay */}
        {snapshot?.phase === 'HALFTIME_BREAK' && homeClub && awayClub && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
            <div className="w-full max-w-md rounded-lg border border-amber-400/40 bg-[#0D1624]/95 p-6 text-center space-y-3 shadow-2xl">
              <p className="text-xs font-bold tracking-widest text-amber-400 uppercase">
                Half-Time Break · 5 Minutes
              </p>
              <p className="font-display text-3xl font-bold text-white tabular-nums">
                {homeClub.flag} {homeClub.shortCode} {snapshot.homeScore} – {snapshot.awayScore}{' '}
                {awayClub.shortCode} {awayClub.flag}
              </p>
              <p className="font-mono text-base font-semibold text-emerald-400 tabular-nums">
                2nd Half starts in {clockInfo.clockText}
              </p>
              <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-xs tabular-nums">
                <span className="font-mono font-bold text-white">{snapshot.stats.homeShots}</span>
                <span className="text-slate-400">Shots</span>
                <span className="font-mono font-bold text-white">{snapshot.stats.awayShots}</span>
                <span className="font-mono font-bold text-white">{snapshot.stats.homeSaves}</span>
                <span className="text-slate-400">Saves</span>
                <span className="font-mono font-bold text-white">{snapshot.stats.awaySaves}</span>
              </div>
            </div>
          </div>
        )}

        {/* Next Match Auto-Advance Toast */}
        {snapshot?.phase === 'FULL_TIME' && !isComplete && snapshot.nextMatchCountdown !== null && (
          <div className="pointer-events-none absolute inset-x-0 bottom-12 z-20 flex justify-center px-4">
            <div className="rounded-md border border-emerald-400/40 bg-[#080E17]/95 px-6 py-3 text-center shadow-2xl">
              <p className="text-sm font-bold text-emerald-400 tabular-nums">
                Next match starting automatically in {Math.ceil(snapshot.nextMatchCountdown)}s
              </p>
              {nextFixture && (
                <p className="mt-0.5 text-xs text-slate-300">
                  {nextFixture.stageLabel}: {nextHome?.name ?? nextFixture.homePlaceholder} vs{' '}
                  {nextAway?.name ?? nextFixture.awayPlaceholder}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Single-Line Floating Live Commentary Bar at Bottom Edge of Field */}
        {latestCommentary && !isComplete && (
          <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center px-4">
            <div className="max-w-3xl truncate rounded bg-[#080E17]/82 px-4 py-1.5 text-xs text-slate-200 border border-white/10 backdrop-blur-sm">
              <span className="mr-2 font-mono font-bold text-amber-400 tabular-nums">
                {latestCommentary.displayClock}
              </span>
              <span>{latestCommentary.text}</span>
            </div>
          </div>
        )}

        {/* Tournament Complete Lock Screen — Exact Winner Notice, No Further Matches */}
        {isComplete && championClub && (
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-0 z-30 flex items-center justify-center bg-[#060B13]/88 p-6 backdrop-blur-sm"
          >
            <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-amber-400/50 bg-[#111927] shadow-2xl">
              <div className="relative h-48 w-full">
                {!trophyImgErr ? (
                  <img
                    src="/src/assets/images/championship_trophy_night_1795064034451.jpg"
                    alt="Championship Trophy"
                    referrerPolicy="no-referrer"
                    onError={() => setTrophyImgErr(true)}
                    className="h-full w-full object-cover object-center"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-500/20 to-[#0B111A]">
                    <Trophy className="h-16 w-16 text-amber-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#111927] via-[#111927]/40 to-transparent" />
              </div>

              <div className="relative -mt-6 px-6 pb-7 text-center space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-amber-400 uppercase">
                  <Trophy className="h-4 w-4" />
                  <span>Champion Crowned · All Matches Finished</span>
                </div>

                <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
                  Today matches end winner is {championClub.name}. Next match begain soon.
                </h1>

                <div className="flex items-center justify-center gap-2.5 text-lg font-display font-bold text-amber-300">
                  <span className="text-2xl">{championClub.flag}</span>
                  <span>{championClub.name}</span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpenOverlay('bracket')}
                    className="min-h-[42px] rounded-md bg-amber-400 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-amber-300 transition-colors cursor-pointer"
                  >
                    Final Bracket
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenOverlay('stats')}
                    className="min-h-[42px] rounded-md border border-white/15 bg-[#1A263A] px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Goals &amp; Assists
                  </button>
                  <button
                    type="button"
                    onClick={onResetTournament}
                    className="min-h-[42px] rounded-md border border-white/15 px-5 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Select New Teams
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* In-Game Modal Overlays (Bracket / Standings / Stats) — Never interrupt the live match */}
      {openOverlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setOpenOverlay(null)}
        >
          <div
            className="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-white/15 bg-[#0B111A] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-[#111927] px-5 py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpenOverlay('bracket')}
                  className={`rounded px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    openOverlay === 'bracket'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Bracket &amp; Matches
                </button>
                {groups.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setOpenOverlay('standings')}
                    className={`rounded px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                      openOverlay === 'standings'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Group Standings
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpenOverlay('stats')}
                  className={`rounded px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    openOverlay === 'stats'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Player Stats
                </button>
              </div>

              <button
                type="button"
                onClick={() => setOpenOverlay(null)}
                className="inline-flex items-center gap-1 rounded border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 cursor-pointer"
              >
                <X className="h-4 w-4" />
                Back to Field
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {openOverlay === 'bracket' && (
                <BracketView
                  fixtures={fixtures}
                  clubsById={clubsById}
                  activeFixtureId={activeFixture?.id ?? null}
                  championClub={championClub}
                  tournamentStatus={tournamentStatus}
                />
              )}
              {openOverlay === 'standings' && (
                <StandingsView groups={groups} fixtures={fixtures} clubsById={clubsById} />
              )}
              {openOverlay === 'stats' && <StatsView clubs={clubs} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
