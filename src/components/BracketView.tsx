import React from 'react';
import { Trophy } from 'lucide-react';
import { Club, Fixture, TournamentStatus } from '../types/tournament';

interface BracketViewProps {
  fixtures: Fixture[];
  clubsById: Record<string, Club>;
  activeFixtureId: string | null;
  championClub: Club | null;
  tournamentStatus: TournamentStatus;
}

export const BracketView: React.FC<BracketViewProps> = ({
  fixtures,
  clubsById,
  activeFixtureId,
  championClub,
  tournamentStatus,
}) => {
  const qfs = fixtures.filter((f) => f.stage === 'QF');
  const sfs = fixtures.filter((f) => f.stage === 'SF');
  const finalMatch = fixtures.find((f) => f.stage === 'FINAL');
  const groupFixtures = fixtures.filter((f) => f.stage === 'GROUP');

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs font-medium tracking-wider text-amber-400 uppercase">
            Knockout Progression
          </p>
          <h1 className="font-display text-2xl font-bold text-white md:text-3xl">
            Tournament Bracket &amp; Match Schedule
          </h1>
        </div>
        {tournamentStatus === 'TOURNAMENT_COMPLETE' && championClub && (
          <p className="text-sm font-semibold text-amber-400">
            Today matches end winner is {championClub.name}. Next match begain soon.
          </p>
        )}
      </div>

      {/* Visual Knockout Bracket Tree */}
      <section className="overflow-x-auto pb-2">
        <div className="min-w-[920px] grid grid-cols-12 gap-6 items-center">
          {/* Column 1: Quarter-Finals (4 matches) */}
          <div className="col-span-4 space-y-4">
            <h2 className="font-display text-sm font-semibold tracking-wider text-slate-400 uppercase">
              Quarter-Finals
            </h2>
            <div className="space-y-4">
              {qfs.map((fx) => (
                <BracketMatchCard
                  key={fx.id}
                  fixture={fx}
                  clubsById={clubsById}
                  isLive={fx.id === activeFixtureId && fx.status === 'LIVE'}
                />
              ))}
            </div>
          </div>

          {/* Column 2: Semi-Finals (2 matches) */}
          <div className="col-span-3 space-y-4">
            <h2 className="font-display text-sm font-semibold tracking-wider text-slate-400 uppercase">
              Semi-Finals
            </h2>
            <div className="space-y-24 py-12">
              {sfs.map((fx) => (
                <BracketMatchCard
                  key={fx.id}
                  fixture={fx}
                  clubsById={clubsById}
                  isLive={fx.id === activeFixtureId && fx.status === 'LIVE'}
                />
              ))}
            </div>
          </div>

          {/* Column 3: Championship Final */}
          <div className="col-span-3 space-y-4">
            <h2 className="font-display text-sm font-semibold tracking-wider text-amber-400 uppercase">
              Championship Final
            </h2>
            {finalMatch && (
              <BracketMatchCard
                fixture={finalMatch}
                clubsById={clubsById}
                isLive={finalMatch.id === activeFixtureId && finalMatch.status === 'LIVE'}
                highlightGold
              />
            )}
          </div>

          {/* Column 4: Champion Podium */}
          <div className="col-span-2 space-y-4">
            <h2 className="font-display text-sm font-semibold tracking-wider text-amber-400 uppercase">
              Champion
            </h2>
            <div
              className={`rounded-lg border p-5 text-center space-y-3 ${
                championClub
                  ? 'border-amber-400/50 bg-amber-500/10'
                  : 'border-white/10 bg-[#131C2B]'
              }`}
            >
              <Trophy
                className={`mx-auto h-8 w-8 ${
                  championClub ? 'text-amber-400' : 'text-slate-600'
                }`}
              />
              {championClub ? (
                <div className="space-y-1.5">
                  <span
                    className="mx-auto flex h-10 w-10 items-center justify-center rounded font-display text-sm font-bold border border-white/20"
                    style={{
                      backgroundColor: championClub.primaryColor,
                      color: championClub.secondaryColor,
                    }}
                  >
                    {championClub.shortCode}
                  </span>
                  <p className="font-display text-base font-bold text-white">{championClub.name}</p>
                  <p className="text-xs text-amber-300">Cup Winner</p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Awaiting Final Winner</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Round 1 Group Stage Fixture Schedule */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-white">
            Round 1 · Group Stage Fixtures
          </h2>
          <span className="font-mono text-xs text-slate-400 tabular-nums">
            {groupFixtures.filter((f) => f.status === 'COMPLETED').length} / {groupFixtures.length}{' '}
            Played
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {groupFixtures.map((fx) => {
            const home = fx.homeTeamId ? clubsById[fx.homeTeamId] : null;
            const away = fx.awayTeamId ? clubsById[fx.awayTeamId] : null;
            const isLive = fx.id === activeFixtureId && fx.status === 'LIVE';

            return (
              <div
                key={fx.id}
                className={`rounded-lg border px-4 py-3 space-y-2 ${
                  isLive
                    ? 'border-emerald-400/50 bg-[#182538]'
                    : 'border-white/10 bg-[#131C2B]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    #{fx.order} · {fx.stageLabel}
                  </span>
                  <span
                    className={`font-semibold ${
                      isLive
                        ? 'text-emerald-400'
                        : fx.status === 'COMPLETED'
                        ? 'text-slate-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {isLive ? 'LIVE NOW' : fx.status === 'COMPLETED' ? 'Full Time' : 'Scheduled'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: home?.primaryColor ?? '#475569' }}
                    />
                    <span className="truncate font-medium text-white">
                      {home?.name ?? 'TBD'}
                    </span>
                  </div>

                  <span className="font-mono text-sm font-bold text-white tabular-nums px-2 shrink-0">
                    {fx.status === 'SCHEDULED' ? 'vs' : `${fx.homeScore} – ${fx.awayScore}`}
                  </span>

                  <div className="flex items-center justify-end gap-2 min-w-0 flex-1 text-right">
                    <span className="truncate font-medium text-white">
                      {away?.name ?? 'TBD'}
                    </span>
                    <span
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: away?.primaryColor ?? '#475569' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

interface BracketMatchCardProps {
  fixture: Fixture;
  clubsById: Record<string, Club>;
  isLive: boolean;
  highlightGold?: boolean;
}

const BracketMatchCard: React.FC<BracketMatchCardProps> = ({
  fixture,
  clubsById,
  isLive,
  highlightGold,
}) => {
  const home = fixture.homeTeamId ? clubsById[fixture.homeTeamId] : null;
  const away = fixture.awayTeamId ? clubsById[fixture.awayTeamId] : null;
  const hasPens =
    fixture.homePenalties !== undefined && fixture.awayPenalties !== undefined;

  const homeWon = fixture.status === 'COMPLETED' && fixture.winnerId === fixture.homeTeamId;
  const awayWon = fixture.status === 'COMPLETED' && fixture.winnerId === fixture.awayTeamId;

  return (
    <div
      className={`rounded-lg border overflow-hidden ${
        isLive
          ? 'border-emerald-400/60 bg-[#182538]'
          : highlightGold
          ? 'border-amber-400/40 bg-[#162033]'
          : 'border-white/10 bg-[#131C2B]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/[0.07] px-3 py-1.5 text-[11px] text-slate-400">
        <span>{fixture.stageLabel}</span>
        <span className={isLive ? 'font-semibold text-emerald-400' : ''}>
          {isLive
            ? 'LIVE'
            : fixture.status === 'COMPLETED'
            ? hasPens
              ? 'FT · PENS'
              : 'FT'
            : 'Upcoming'}
        </span>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {/* Home Row */}
        <div
          className={`flex items-center justify-between gap-2 px-3 py-2.5 text-sm ${
            homeWon ? 'bg-emerald-500/10 text-white font-semibold' : 'text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-sm border border-white/15"
              style={{ backgroundColor: home?.primaryColor ?? '#334155' }}
            />
            <span className={`truncate ${home ? '' : 'text-slate-500 italic text-xs'}`}>
              {home?.name ?? fixture.homePlaceholder ?? 'TBD'}
            </span>
          </div>
          <span className="font-mono text-sm font-bold tabular-nums shrink-0">
            {fixture.status === 'SCHEDULED'
              ? '–'
              : `${fixture.homeScore}${hasPens ? ` (${fixture.homePenalties})` : ''}`}
          </span>
        </div>

        {/* Away Row */}
        <div
          className={`flex items-center justify-between gap-2 px-3 py-2.5 text-sm ${
            awayWon ? 'bg-emerald-500/10 text-white font-semibold' : 'text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-sm border border-white/15"
              style={{ backgroundColor: away?.primaryColor ?? '#334155' }}
            />
            <span className={`truncate ${away ? '' : 'text-slate-500 italic text-xs'}`}>
              {away?.name ?? fixture.awayPlaceholder ?? 'TBD'}
            </span>
          </div>
          <span className="font-mono text-sm font-bold tabular-nums shrink-0">
            {fixture.status === 'SCHEDULED'
              ? '–'
              : `${fixture.awayScore}${hasPens ? ` (${fixture.awayPenalties})` : ''}`}
          </span>
        </div>
      </div>
    </div>
  );
};
