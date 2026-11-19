import React, { useMemo, useState } from 'react';
import { Club, PlayerLeaderboardRow } from '../types/tournament';
import { getPlayerLeaderboard } from '../engine/tournamentLogic';

interface StatsViewProps {
  clubs: Club[];
}

type StatCategory = 'goals' | 'assists' | 'saves';

export const StatsView: React.FC<StatsViewProps> = ({ clubs }) => {
  const [category, setCategory] = useState<StatCategory>('goals');

  const allRows = useMemo(() => getPlayerLeaderboard(clubs), [clubs]);

  const topScorer = useMemo(
    () =>
      [...allRows].sort(
        (a, b) => b.goals - a.goals || b.assists - a.assists || a.playerName.localeCompare(b.playerName)
      )[0],
    [allRows]
  );

  const topAssister = useMemo(
    () =>
      [...allRows].sort(
        (a, b) => b.assists - a.assists || b.goals - a.goals || a.playerName.localeCompare(b.playerName)
      )[0],
    [allRows]
  );

  const topKeeper = useMemo(
    () =>
      [...allRows]
        .filter((r) => r.position === 'GK' || r.saves > 0)
        .sort((a, b) => b.saves - a.saves || a.playerName.localeCompare(b.playerName))[0],
    [allRows]
  );

  const rankedRows = useMemo(() => {
    const filtered =
      category === 'saves'
        ? allRows.filter((r) => r.position === 'GK' || r.saves > 0)
        : allRows;

    return [...filtered]
      .sort((a, b) => {
        if (category === 'goals') {
          return b.goals - a.goals || b.assists - a.assists || b.shots - a.shots;
        }
        if (category === 'assists') {
          return b.assists - a.assists || b.goals - a.goals || b.shots - a.shots;
        }
        return b.saves - a.saves || a.playerName.localeCompare(b.playerName);
      })
      .slice(0, 25);
  }, [allRows, category]);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs font-medium tracking-wider text-amber-400 uppercase">
            Tournament Leaders
          </p>
          <h1 className="font-display text-2xl font-bold text-white md:text-3xl">
            Player Statistics &amp; Awards
          </h1>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 rounded-md border border-white/10 bg-[#131C2B] p-1">
          {(
            [
              { id: 'goals', label: 'Top Scorers' },
              { id: 'assists', label: 'Top Assists' },
              { id: 'saves', label: 'Goalkeeper Saves' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategory(tab.id)}
              className={`min-h-[36px] rounded px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                category === tab.id
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3-Column Leader Spotlight Strip */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AwardSpotlightCard
          title="Golden Boot Leader"
          metricLabel="Goals"
          row={topScorer}
          value={topScorer?.goals ?? 0}
        />
        <AwardSpotlightCard
          title="Playmaker Leader"
          metricLabel="Assists"
          row={topAssister}
          value={topAssister?.assists ?? 0}
        />
        <AwardSpotlightCard
          title="Golden Glove Leader"
          metricLabel="Saves"
          row={topKeeper}
          value={topKeeper?.saves ?? 0}
        />
      </div>

      {/* Full Ranked Table */}
      <section className="rounded-lg border border-white/10 bg-[#131C2B] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="py-3 pl-5 pr-2 font-medium w-10">#</th>
                <th className="py-3 px-2 font-medium">Player</th>
                <th className="py-3 px-2 font-medium">Club</th>
                <th className="py-3 px-2 font-medium text-center w-14">Pos</th>
                <th className="py-3 px-2 font-medium text-center w-16">Goals</th>
                <th className="py-3 px-2 font-medium text-center w-16">Assists</th>
                <th className="py-3 px-2 font-medium text-center w-16">Shots</th>
                <th className="py-3 pl-2 pr-5 font-medium text-right w-16">Saves</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {rankedRows.map((row, index) => (
                <tr key={row.playerId} className="hover:bg-white/[0.02]">
                  <td className="py-3 pl-5 pr-2 font-mono text-slate-400 tabular-nums">
                    {index + 1}
                  </td>
                  <td className="py-3 px-2">
                    <span className="font-semibold text-white">{row.playerName}</span>
                    <span className="ml-2 font-mono text-[11px] text-slate-500">#{row.number}</span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-sm"
                        style={{ backgroundColor: row.clubColor }}
                      />
                      <span className="text-slate-300">{row.clubName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center font-mono text-slate-400">{row.position}</td>
                  <td
                    className={`py-3 px-2 text-center font-mono tabular-nums ${
                      category === 'goals' ? 'font-bold text-amber-400 text-sm' : 'text-slate-200'
                    }`}
                  >
                    {row.goals}
                  </td>
                  <td
                    className={`py-3 px-2 text-center font-mono tabular-nums ${
                      category === 'assists' ? 'font-bold text-emerald-400 text-sm' : 'text-slate-200'
                    }`}
                  >
                    {row.assists}
                  </td>
                  <td className="py-3 px-2 text-center font-mono text-slate-400 tabular-nums">
                    {row.shots}
                  </td>
                  <td
                    className={`py-3 pl-2 pr-5 text-right font-mono tabular-nums ${
                      category === 'saves' ? 'font-bold text-emerald-400 text-sm' : 'text-slate-300'
                    }`}
                  >
                    {row.saves}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

interface AwardSpotlightCardProps {
  title: string;
  metricLabel: string;
  row?: PlayerLeaderboardRow;
  value: number;
}

const AwardSpotlightCard: React.FC<AwardSpotlightCardProps> = ({
  title,
  metricLabel,
  row,
  value,
}) => (
  <div className="rounded-lg border border-white/10 bg-[#131C2B] p-5 flex items-center justify-between gap-4">
    <div className="min-w-0 space-y-1">
      <p className="text-xs font-medium text-slate-400">{title}</p>
      <p className="truncate font-display text-xl font-bold text-white">
        {row ? row.playerName : '—'}
      </p>
      <p className="text-xs text-slate-400">
        {row ? `${row.clubName} · #${row.number} ${row.position}` : 'Matchday data pending'}
      </p>
    </div>
    <div className="text-right shrink-0">
      <p className="font-mono text-3xl font-bold text-amber-400 tabular-nums">{value}</p>
      <p className="text-[11px] text-slate-400 uppercase">{metricLabel}</p>
    </div>
  </div>
);
