import React from 'react';
import { Club, Fixture, GroupData } from '../types/tournament';
import { calculateStandings } from '../engine/tournamentLogic';

interface StandingsViewProps {
  groups: GroupData[];
  fixtures: Fixture[];
  clubsById: Record<string, Club>;
}

export const StandingsView: React.FC<StandingsViewProps> = ({
  groups,
  fixtures,
  clubsById,
}) => {
  return (
    <div className="mx-auto max-w-[1440px] px-6 py-6 space-y-6">
      <div className="border-b border-white/10 pb-4">
        <p className="text-xs font-medium tracking-wider text-amber-400 uppercase">
          Round 1 · Group Tables
        </p>
        <h1 className="font-display text-2xl font-bold text-white md:text-3xl">
          Tournament Standings
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Updated automatically after every 60-minute group match · Tiebreakers: Points, Goal Difference, Goals Scored
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {groups.map((group) => {
          const rows = calculateStandings(group, fixtures, clubsById);
          return (
            <section
              key={group.id}
              className="rounded-lg border border-white/10 bg-[#131C2B] overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                <h2 className="font-display text-lg font-bold text-white">{group.name}</h2>
                <span className="text-xs text-emerald-400">
                  Top {group.qualifyCount} advance to Quarter-Finals
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="py-2.5 pl-5 pr-2 font-medium w-8">#</th>
                      <th className="py-2.5 px-2 font-medium">Club</th>
                      <th className="py-2.5 px-2 font-medium text-center w-9">MP</th>
                      <th className="py-2.5 px-2 font-medium text-center w-9">W</th>
                      <th className="py-2.5 px-2 font-medium text-center w-9">D</th>
                      <th className="py-2.5 px-2 font-medium text-center w-9">L</th>
                      <th className="py-2.5 px-2 font-medium text-center w-10">GF</th>
                      <th className="py-2.5 px-2 font-medium text-center w-10">GA</th>
                      <th className="py-2.5 px-2 font-medium text-center w-10">GD</th>
                      <th className="py-2.5 pl-2 pr-5 font-semibold text-right w-12 text-white">
                        PTS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {rows.map((row, idx) => (
                      <tr
                        key={row.teamId}
                        className={
                          idx === group.qualifyCount - 1 && rows.length > group.qualifyCount
                            ? 'border-b border-emerald-500/40'
                            : ''
                        }
                      >
                        <td className="py-3 pl-5 pr-2 font-mono tabular-nums">
                          <span className={row.qualified ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded font-display text-[10px] font-bold border border-white/15"
                              style={{
                                backgroundColor: row.primaryColor,
                                color: row.secondaryColor,
                              }}
                            >
                              {row.shortCode}
                            </span>
                            <span className="font-semibold text-white">{row.teamName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-slate-300 tabular-nums">
                          {row.played}
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-slate-300 tabular-nums">
                          {row.won}
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-slate-400 tabular-nums">
                          {row.drawn}
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-slate-400 tabular-nums">
                          {row.lost}
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-slate-300 tabular-nums">
                          {row.gf}
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-slate-300 tabular-nums">
                          {row.ga}
                        </td>
                        <td className="py-3 px-2 text-center font-mono tabular-nums">
                          <span
                            className={
                              row.gd > 0
                                ? 'text-emerald-400'
                                : row.gd < 0
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }
                          >
                            {row.gd > 0 ? `+${row.gd}` : row.gd}
                          </span>
                        </td>
                        <td className="py-3 pl-2 pr-5 text-right font-mono text-sm font-bold text-white tabular-nums">
                          {row.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
