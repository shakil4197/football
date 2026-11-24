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
  FastForward,
} from 'lucide-react';
import {
  Club,
  Fixture,
  GroupData,
  LiveMatchSnapshot,
  SpeedOption,
  TournamentStatus,
} from '../types/tournament';
import { computeClubRatings, computePlayerOverall } from '../data/defaultClubs';
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
  onKickoffNow: () => void;
  onAdvanceNextNow: () => void;
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
  onKickoffNow,
  onAdvanceNextNow,
  onResetTournament,
}) => {
  const [openOverlay, setOpenOverlay] = useState<OverlayModal>(null);

  const isComplete = tournamentStatus === 'TOURNAMENT_COMPLETE';
  const isOneVsOne = fixtures.length === 1;

  const homeClub = activeFixture?.homeTeamId ? clubsById[activeFixture.homeTeamId] : null;
  const awayClub = activeFixture?.awayTeamId ? clubsById[activeFixture.awayTeamId] : null;
  const nextHome = nextFixture?.homeTeamId ? clubsById[nextFixture.homeTeamId] : null;
  const nextAway = nextFixture?.awayTeamId ? clubsById[nextFixture.awayTeamId] : null;

  const clockInfo = snapshot
    ? formatMatchClock(snapshot.matchSeconds, snapshot.phase)
    : { clockText: '00:00', countdownText: '60:00', phaseText: 'Pre-Match', minuteNumber: 0 };

  const latestCommentary = snapshot?.events[0];

  const homeRatings = homeClub ? computeClubRatings(homeClub) : null;
  const awayRatings = awayClub ? computeClubRatings(awayClub) : null;

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col bg-[#07150F] text-white select-none">
      {/* Slim Top Game Scoreboard Bar: Country vs Country · Goal Count · 60:00 Countdown */}
      {activeFixture && homeClub && awayClub && snapshot && (
        <header className="relative z-20 shrink-0 border-b border-white/10 bg-[#0A101A]/95 px-3 py-2 md:px-5">
          <div className="mx-auto flex items-center justify-between gap-3">
            {/* Left: Compact Game Overlay Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {!isOneVsOne && (
                <button
                  type="button"
                  onClick={() => setOpenOverlay('bracket')}
                  title="Tournament Bracket"
                  className="inline-flex min-h-[34px] items-center gap-1.5 rounded bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
                >
                  <GitBranch className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Bracket</span>
                </button>
              )}
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

            {/* Center Focal Anchor: COUNTRY 2 - 1 COUNTRY · 60:00 COUNTDOWN */}
            <div className="flex items-center gap-3 md:gap-6 min-w-0">
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

            {/* Right: Pause, Speed, Audio, Exit */}
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

      {/* Main Game Viewport: Fullscreen Football Pitch + Pre/Post Match Overlays */}
      <main className="relative flex-1 min-h-0 w-full">
        <PitchCanvas engineRef={engineRef} />

        {/* Subtle Match Stage Label */}
        {activeFixture && snapshot?.phase !== 'PRE_MATCH' && snapshot?.phase !== 'FULL_TIME' && (
          <div className="pointer-events-none absolute top-2.5 left-4 z-10 text-[11px] font-mono font-semibold text-white/60 tracking-wider uppercase">
            {isOneVsOne ? '1 vs 1 Match · 60 Min' : `${activeFixture.stageLabel} · Match ${activeFixture.order}/${fixtures.length}`}
          </div>
        )}

        {/* Transient Goal / Save / 2nd Half Flash Banner */}
        {snapshot?.banner &&
          snapshot.phase !== 'PRE_MATCH' &&
          snapshot.phase !== 'FULL_TIME' &&
          !isComplete && (
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

        {/* Single-Line Floating Live Commentary Bar */}
        {latestCommentary &&
          snapshot?.phase !== 'PRE_MATCH' &&
          snapshot?.phase !== 'FULL_TIME' &&
          !isComplete && (
            <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center px-4">
              <div className="max-w-3xl truncate rounded bg-[#080E17]/82 px-4 py-1.5 text-xs text-slate-200 border border-white/10 backdrop-blur-sm">
                <span className="mr-2 font-mono font-bold text-amber-400 tabular-nums">
                  {latestCommentary.displayClock}
                </span>
                <span>{latestCommentary.text}</span>
              </div>
            </div>
          )}

        {/* PRE-MATCH LINEUP SHOWCASE — Shown before EVERY match (1v1 & every tournament match) */}
        {snapshot?.phase === 'PRE_MATCH' && homeClub && awayClub && (
          <div className="absolute inset-0 z-30 flex flex-col bg-[#070D16]/94 backdrop-blur-sm overflow-hidden">
            {/* Top Matchup Banner */}
            <div className="shrink-0 border-b border-white/10 bg-[#0D1624] px-6 py-4">
              <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold tracking-widest text-amber-400 uppercase">
                    {isOneVsOne
                      ? '1 vs 1 Match · Starting Lineups'
                      : `${activeFixture?.stageLabel} · Match ${activeFixture?.order} of ${fixtures.length} · Starting Lineups`}
                  </p>
                  <h2 className="font-display text-2xl font-bold text-white uppercase md:text-3xl">
                    {homeClub.flag} {homeClub.name} vs {awayClub.name} {awayClub.flag}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  {snapshot.preMatchCountdown !== null && (
                    <span className="font-mono text-sm font-semibold text-emerald-400 tabular-nums">
                      Kickoff in {Math.max(1, Math.ceil(snapshot.preMatchCountdown))}s
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={onKickoffNow}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-md bg-emerald-500 px-5 py-2 font-display text-sm font-bold tracking-wider text-slate-950 uppercase hover:bg-emerald-400 transition-colors cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Kick Off Now
                  </button>
                </div>
              </div>
            </div>

            {/* Both Teams Full 11-Player Details: Photo, Name, Position, Skill Points */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="mx-auto max-w-6xl grid grid-cols-1 gap-5 lg:grid-cols-2">
                {[
                  { club: homeClub, ratings: homeRatings },
                  { club: awayClub, ratings: awayRatings },
                ].map(({ club, ratings }) => (
                  <section
                    key={club.id}
                    className="rounded-lg border border-white/10 bg-[#111A29] overflow-hidden"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#152134]">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl leading-none">{club.flag}</span>
                        <div>
                          <h3 className="font-display text-lg font-bold text-white uppercase">
                            {club.name}
                          </h3>
                          {ratings && (
                            <p className="font-mono text-[11px] text-slate-400 tabular-nums">
                              ATK {ratings.attack} · MID {ratings.midfield} · DEF {ratings.defense} · GK {ratings.goalkeeping}
                            </p>
                          )}
                        </div>
                      </div>
                      {ratings && (
                        <div className="text-right">
                          <span className="font-mono text-xl font-bold text-amber-400 tabular-nums">
                            {ratings.overall}
                          </span>
                          <span className="block text-[10px] text-slate-400 uppercase">Team OVR</span>
                        </div>
                      )}
                    </div>

                    <div className="divide-y divide-white/[0.06]">
                      {club.players.slice(0, 11).map((p) => {
                        const ovr = computePlayerOverall(p);
                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between gap-3 px-4 py-2"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={p.photoUrl || '/player-images/default-player.svg'}
                                alt={p.name}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    '/player-images/default-player.svg';
                                }}
                                className="h-9 w-9 shrink-0 rounded-full object-cover border-2 bg-[#0B111A]"
                                style={{ borderColor: club.primaryColor }}
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">
                                  <span className="mr-1.5 font-mono text-xs text-slate-400 tabular-nums">
                                    #{p.number}
                                  </span>
                                  {p.name}
                                </p>
                                <p className="font-mono text-[11px] text-slate-400 tabular-nums">
                                  {p.position} · ATK {p.attack} · DEF {p.defense} · PAC {p.pace} · PAS {p.passing}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <span className="font-mono text-sm font-bold text-amber-400 tabular-nums">
                                {ovr}
                              </span>
                              <span className="block text-[10px] text-slate-500 uppercase">
                                SKILL
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* POST-MATCH PLAYER REPORT — Shown after EVERY match (1v1 stops here; Tournament shows & advances; Final stops with winner notice) */}
        {snapshot?.phase === 'FULL_TIME' && homeClub && awayClub && (
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-0 z-30 flex flex-col bg-[#070D16]/95 backdrop-blur-sm overflow-hidden"
          >
            {/* Header: Final Score & Winner Notice (if 1v1 or Tournament Final) */}
            <div className="shrink-0 border-b border-white/10 bg-[#0D1624] px-6 py-4">
              <div className="mx-auto max-w-6xl space-y-3">
                {isComplete && championClub && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-400/50 bg-amber-500/10 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-6 w-6 shrink-0 text-amber-400" />
                      <div>
                        <p className="text-[11px] font-bold tracking-widest text-amber-400 uppercase">
                          {isOneVsOne ? '1 vs 1 Match Complete' : 'Tournament Complete · All Matches Ended'}
                        </p>
                        <h1 className="font-display text-xl font-bold text-white md:text-2xl">
                          Today matches end winner is {championClub.name}. Next match begain soon.
                        </h1>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="font-display text-2xl font-bold text-white uppercase md:text-3xl tabular-nums">
                      {homeClub.flag} {homeClub.name} {snapshot.homeScore} – {snapshot.awayScore}{' '}
                      {awayClub.name} {awayClub.flag}
                    </span>
                    {snapshot.penaltyLog.length > 0 && (
                      <span className="font-mono text-sm font-bold text-amber-400 tabular-nums">
                        ({snapshot.homePenalties}–{snapshot.awayPenalties} Pens)
                      </span>
                    )}
                    <span className="text-xs font-mono text-slate-400 uppercase">
                      Full Time · 60:00
                    </span>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {!isComplete && snapshot.nextMatchCountdown !== null && (
                      <>
                        <span className="font-mono text-xs font-semibold text-emerald-400 tabular-nums">
                          Next match in {Math.max(1, Math.ceil(snapshot.nextMatchCountdown))}s
                          {nextFixture
                            ? ` · ${nextHome?.shortCode ?? nextFixture.homePlaceholder} vs ${nextAway?.shortCode ?? nextFixture.awayPlaceholder}`
                            : ''}
                        </span>
                        <button
                          type="button"
                          onClick={onAdvanceNextNow}
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md bg-emerald-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer"
                        >
                          <FastForward className="h-3.5 w-3.5" />
                          Next Match Now
                        </button>
                      </>
                    )}

                    {isComplete && (
                      <>
                        {!isOneVsOne && (
                          <button
                            type="button"
                            onClick={() => setOpenOverlay('bracket')}
                            className="min-h-[38px] rounded-md bg-amber-400 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-300 transition-colors cursor-pointer"
                          >
                            Final Bracket
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setOpenOverlay('stats')}
                          className="min-h-[38px] rounded-md border border-white/15 bg-[#1A263A] px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          Full Stats
                        </button>
                        <button
                          type="button"
                          onClick={onResetTournament}
                          className="min-h-[38px] rounded-md border border-white/15 px-4 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          Select New Teams
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Both Teams Full 11-Player Post-Match Report: Photo, Name, Goals, Assists */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="mx-auto max-w-6xl grid grid-cols-1 gap-5 lg:grid-cols-2">
                {[homeClub, awayClub].map((club) => (
                  <section
                    key={club.id}
                    className="rounded-lg border border-white/10 bg-[#111A29] overflow-hidden"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#152134]">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl leading-none">{club.flag}</span>
                        <h3 className="font-display text-lg font-bold text-white uppercase">
                          {club.name} · Match Stats
                        </h3>
                      </div>
                      <div className="flex items-center gap-5 text-[11px] font-mono text-slate-400 uppercase pr-1">
                        <span>Goals</span>
                        <span>Assists</span>
                      </div>
                    </div>

                    <div className="divide-y divide-white/[0.06]">
                      {club.players.slice(0, 11).map((p) => {
                        const ms = snapshot.matchPlayerStats[p.id] ?? {
                          goals: 0,
                          assists: 0,
                          saves: 0,
                          shots: 0,
                        };
                        const contributed = ms.goals > 0 || ms.assists > 0;
                        return (
                          <div
                            key={p.id}
                            className={`flex items-center justify-between gap-3 px-4 py-2 ${
                              contributed ? 'bg-amber-500/[0.06]' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={p.photoUrl || '/player-images/default-player.svg'}
                                alt={p.name}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    '/player-images/default-player.svg';
                                }}
                                className="h-9 w-9 shrink-0 rounded-full object-cover border-2 bg-[#0B111A]"
                                style={{ borderColor: club.primaryColor }}
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">
                                  <span className="mr-1.5 font-mono text-xs text-slate-400 tabular-nums">
                                    #{p.number}
                                  </span>
                                  {p.name}
                                </p>
                                <p className="font-mono text-[11px] text-slate-400">
                                  {p.position}
                                  {p.position === 'GK' && ms.saves > 0 ? ` · ${ms.saves} Saves` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-8 shrink-0 pr-2 font-mono text-sm tabular-nums">
                              <span
                                className={`w-8 text-center font-bold ${
                                  ms.goals > 0 ? 'text-amber-400 text-base' : 'text-slate-500'
                                }`}
                              >
                                {ms.goals}
                              </span>
                              <span
                                className={`w-8 text-center font-bold ${
                                  ms.assists > 0 ? 'text-emerald-400 text-base' : 'text-slate-500'
                                }`}
                              >
                                {ms.assists}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* In-Game Modal Overlays (Bracket / Standings / Stats) */}
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
                {!isOneVsOne && (
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
                )}
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
