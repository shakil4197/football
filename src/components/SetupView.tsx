import React, { useMemo, useState } from 'react';
import { Check, Pencil, Plus, RotateCcw, Trash2, X, Play, ImagePlus } from 'lucide-react';
import { Club, Player, PlayerPosition } from '../types/tournament';
import { computeClubRatings } from '../data/defaultClubs';

interface SetupViewProps {
  clubs: Club[];
  onToggleClub: (clubId: string) => void;
  onClearSelection: () => void;
  onSelectPresetCount: (count: number) => void;
  onAddClub: () => void;
  onDeleteClub: (clubId: string) => void;
  onUpdateClub: (clubId: string, patch: Partial<Club>) => void;
  onUpdatePlayer: (clubId: string, playerId: string, patch: Partial<Player>) => void;
  onAddPlayer: (clubId: string) => void;
  onDeletePlayer: (clubId: string, playerId: string) => void;
  onResetDefaults: () => void;
  onStartTournament: () => void;
}

const POSITIONS: PlayerPosition[] = ['GK', 'DEF', 'MID', 'FWD'];

export const SetupView: React.FC<SetupViewProps> = ({
  clubs,
  onToggleClub,
  onClearSelection,
  onSelectPresetCount,
  onAddClub,
  onDeleteClub,
  onUpdateClub,
  onUpdatePlayer,
  onAddPlayer,
  onDeletePlayer,
  onResetDefaults,
  onStartTournament,
}) => {
  const [editingClubId, setEditingClubId] = useState<string | null>(null);
  const [bgError, setBgError] = useState(false);

  const selectedClubs = useMemo(() => clubs.filter((c) => c.selected), [clubs]);
  const selectedCount = selectedClubs.length;
  const canStart = selectedCount >= 2;

  const editingClub = useMemo(
    () => (editingClubId ? clubs.find((c) => c.id === editingClubId) ?? null : null),
    [clubs, editingClubId]
  );

  const formatSummary = useMemo(() => {
    if (selectedCount < 2)
      return 'Select 2 countries for a 1 vs 1 Match, or 8–20 countries for a Full Tournament (60 Min/Match)';
    if (selectedCount === 2) {
      return `1 vs 1 Match · ${selectedClubs[0].name} vs ${selectedClubs[1].name} · Full 60 Min (No Halftime Break)`;
    }
    if (selectedCount < 8) {
      return `${selectedCount} Nations · Group Stage → ${selectedCount >= 4 ? 'Semi-Finals → ' : ''}Final · 60 Min/Match`;
    }
    const numGroups = selectedCount >= 12 ? 4 : 2;
    return `${selectedCount} Nations · ${numGroups} Groups → Quarter-Finals → Semi-Finals → Final · 60 Min/Match`;
  }, [selectedClubs, selectedCount]);

  const handlePhotoUpload = (clubId: string, playerId: string, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdatePlayer(clubId, playerId, { photoUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col bg-[#080E17] text-white select-none">
      {/* Full-bleed Floodlit Stadium Background */}
      {!bgError ? (
        <img
          src="/src/assets/images/stadium_floodlight_hero_1795064036449.jpg"
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          onError={() => setBgError(true)}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30"
        />
      ) : null}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#080E17]/90 via-[#080E17]/82 to-[#080E17]/96"
      />

      {/* Game Header Strip */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
        <div className="flex items-baseline gap-4">
          <h1 className="font-display text-2xl font-bold tracking-wider text-white uppercase md:text-3xl">
            Floodlight Cup
          </h1>
          <span className="text-xs font-medium text-amber-400">
            1 vs 1 or 8–20 Team Tournament · 60-Min Matches
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectPresetCount(2)}
            className="min-h-[34px] rounded border border-white/15 bg-[#131C2B]/90 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-emerald-400/50 hover:text-white transition-colors cursor-pointer"
          >
            1 vs 1
          </button>
          <button
            type="button"
            onClick={() => onSelectPresetCount(8)}
            className="min-h-[34px] rounded border border-white/15 bg-[#131C2B]/90 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-emerald-400/50 hover:text-white transition-colors cursor-pointer"
          >
            Pick 8
          </button>
          <button
            type="button"
            onClick={() => onSelectPresetCount(16)}
            className="min-h-[34px] rounded border border-white/15 bg-[#131C2B]/90 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-emerald-400/50 hover:text-white transition-colors cursor-pointer"
          >
            Pick 16
          </button>
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={onClearSelection}
              className="min-h-[34px] rounded border border-white/10 bg-transparent px-3 py-1 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Clear ({selectedCount})
            </button>
          )}
          <button
            type="button"
            onClick={onAddClub}
            disabled={clubs.length >= 24}
            className="inline-flex min-h-[34px] items-center gap-1 rounded border border-white/15 bg-[#131C2B]/90 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-[#1A263A] disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Team
          </button>
          <button
            type="button"
            onClick={onResetDefaults}
            title="Restore default 20 national teams"
            className="inline-flex min-h-[34px] items-center gap-1 rounded border border-white/10 px-2.5 py-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </header>

      {/* Main 20-Country Selection Grid */}
      <main className="relative z-10 flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto max-w-[1380px] grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {clubs.map((club) => {
            const ratings = computeClubRatings(club);
            const isSelected = club.selected;

            return (
              <div
                key={club.id}
                onClick={() => onToggleClub(club.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleClub(club.id);
                  }
                }}
                className={`group relative flex flex-col justify-between rounded-lg border p-3.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  isSelected
                    ? 'border-emerald-400 bg-[#142638]/95 shadow-[0_0_24px_rgba(16,185,129,0.16)]'
                    : 'border-white/10 bg-[#111927]/85 hover:border-white/30 hover:bg-[#162133]/95'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl leading-none" aria-hidden="true">
                      {club.flag}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-bold tracking-wide text-white uppercase">
                        {club.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full border border-white/30"
                          style={{ backgroundColor: club.primaryColor }}
                        />
                        <span>{club.shortCode}</span>
                        <span>·</span>
                        <span className="text-amber-400 font-semibold tabular-nums">
                          OVR {ratings.overall}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-400 text-slate-950'
                        : 'border-white/20 bg-black/25 text-transparent'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/[0.08] pt-2.5 text-[11px]">
                  <span className="font-mono text-slate-400 tabular-nums">
                    A{ratings.attack} · M{ratings.midfield} · D{ratings.defense}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingClubId(club.id);
                    }}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                  >
                    <Pencil className="h-3 w-3" />
                    Squad
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Bottom Fixed Game Start Bar */}
      <footer className="relative z-10 border-t border-white/10 bg-[#0B121E]/95 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono font-bold text-emerald-400 tabular-nums">
                {selectedCount} SELECTED
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300 truncate">{formatSummary}</span>
            </div>
            {selectedCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                {selectedClubs.slice(0, 12).map((c) => (
                  <span key={c.id} className="inline-flex items-center gap-1 text-slate-200">
                    <span>{c.flag}</span>
                    <span className="font-mono text-[11px]">{c.shortCode}</span>
                  </span>
                ))}
                {selectedCount > 12 && (
                  <span className="font-mono text-[11px] text-slate-400">
                    +{selectedCount - 12} more
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!canStart}
            onClick={onStartTournament}
            className="inline-flex min-h-[48px] items-center gap-2.5 rounded-md bg-emerald-500 px-8 py-3 font-display text-lg font-bold tracking-wider text-slate-950 uppercase transition-all hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer shadow-[0_0_24px_rgba(16,185,129,0.28)] disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <Play className="h-5 w-5 fill-current" />
            {selectedCount === 2
              ? `Start 1 vs 1 (${selectedClubs[0].shortCode} vs ${selectedClubs[1].shortCode})`
              : selectedCount >= 3
              ? `Start Tournament (${selectedCount} Teams)`
              : 'Select Teams to Start'}
          </button>
        </div>
      </footer>

      {/* Squad Editor Modal with Player Photo Preview & Upload */}
      {editingClub && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setEditingClubId(null)}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-white/15 bg-[#111927]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{editingClub.flag}</span>
                <div>
                  <h2 className="font-display text-xl font-bold text-white uppercase">
                    {editingClub.name} Squad Editor
                  </h2>
                  <p className="text-xs text-slate-400">
                    Photos load from /player-images/ · Click any photo icon to upload a custom player image
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onAddPlayer(editingClub.id)}
                  className="inline-flex min-h-[34px] items-center gap-1 rounded border border-white/15 bg-[#1A263A] px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Player
                </button>
                {clubs.length > 8 && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteClub(editingClub.id);
                      setEditingClubId(null);
                    }}
                    className="inline-flex min-h-[34px] items-center gap-1 rounded border border-red-500/30 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/15 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditingClubId(null)}
                  className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <label className="mb-1 block text-[11px] text-slate-400">Team Name</label>
                  <input
                    type="text"
                    value={editingClub.name}
                    onChange={(e) => onUpdateClub(editingClub.id, { name: e.target.value })}
                    className="w-full rounded border border-white/15 bg-[#080E17] px-3 py-1.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="mb-1 block text-[11px] text-slate-400">Code</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={editingClub.shortCode}
                    onChange={(e) =>
                      onUpdateClub(editingClub.id, {
                        shortCode: e.target.value.toUpperCase().slice(0, 3),
                      })
                    }
                    className="w-full rounded border border-white/15 bg-[#080E17] px-3 py-1.5 font-mono text-sm uppercase text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[11px] text-slate-400">Kit Main</label>
                  <input
                    type="color"
                    value={editingClub.primaryColor}
                    onChange={(e) => onUpdateClub(editingClub.id, { primaryColor: e.target.value })}
                    className="h-[34px] w-full cursor-pointer rounded border border-white/15 bg-[#080E17] p-0.5"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[11px] text-slate-400">Kit Trim</label>
                  <input
                    type="color"
                    value={editingClub.secondaryColor}
                    onChange={(e) =>
                      onUpdateClub(editingClub.id, { secondaryColor: e.target.value })
                    }
                    className="h-[34px] w-full cursor-pointer rounded border border-white/15 bg-[#080E17] p-0.5"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="py-2 pr-2 font-medium w-14">Photo</th>
                      <th className="py-2 pr-2 font-medium w-12">#</th>
                      <th className="py-2 pr-2 font-medium min-w-[140px]">Player Name</th>
                      <th className="py-2 pr-2 font-medium w-20">Pos</th>
                      <th className="py-2 px-1 text-center font-medium w-14">ATK</th>
                      <th className="py-2 px-1 text-center font-medium w-14">DEF</th>
                      <th className="py-2 px-1 text-center font-medium w-14">PAC</th>
                      <th className="py-2 px-1 text-center font-medium w-14">PAS</th>
                      <th className="py-2 px-1 text-center font-medium w-14">GK</th>
                      <th className="py-2 pl-1 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {editingClub.players.map((player) => (
                      <tr key={player.id}>
                        <td className="py-1.5 pr-2">
                          <label
                            title="Upload custom photo"
                            className="relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full overflow-hidden border border-white/20 bg-[#080E17] group/photo"
                          >
                            <img
                              src={player.photoUrl || '/player-images/default-player.svg'}
                              alt={player.name}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  '/player-images/default-player.svg';
                              }}
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/photo:opacity-100 transition-opacity">
                              <ImagePlus className="h-3.5 w-3.5 text-white" />
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handlePhotoUpload(editingClub.id, player.id, e.target.files?.[0])
                              }
                            />
                          </label>
                        </td>
                        <td className="py-1.5 pr-2">
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={player.number}
                            onChange={(e) =>
                              onUpdatePlayer(editingClub.id, player.id, {
                                number: Math.max(1, Math.min(99, Number(e.target.value) || 1)),
                              })
                            }
                            className="w-11 rounded border border-white/10 bg-[#080E17] px-1.5 py-1 text-center font-mono text-xs text-white tabular-nums"
                          />
                        </td>
                        <td className="py-1.5 pr-2">
                          <input
                            type="text"
                            value={player.name}
                            onChange={(e) =>
                              onUpdatePlayer(editingClub.id, player.id, { name: e.target.value })
                            }
                            className="w-full rounded border border-white/10 bg-[#080E17] px-2 py-1 text-xs text-white"
                          />
                        </td>
                        <td className="py-1.5 pr-2">
                          <select
                            value={player.position}
                            onChange={(e) =>
                              onUpdatePlayer(editingClub.id, player.id, {
                                position: e.target.value as PlayerPosition,
                              })
                            }
                            className="w-full rounded border border-white/10 bg-[#080E17] px-1.5 py-1 font-mono text-xs text-white"
                          >
                            {POSITIONS.map((pos) => (
                              <option key={pos} value={pos}>
                                {pos}
                              </option>
                            ))}
                          </select>
                        </td>
                        {(['attack', 'defense', 'pace', 'passing', 'goalkeeping'] as const).map(
                          (statKey) => (
                            <td key={statKey} className="py-1.5 px-1 text-center">
                              <input
                                type="number"
                                min={40}
                                max={99}
                                value={player[statKey]}
                                onChange={(e) =>
                                  onUpdatePlayer(editingClub.id, player.id, {
                                    [statKey]: Math.max(
                                      40,
                                      Math.min(99, Number(e.target.value) || 40)
                                    ),
                                  })
                                }
                                className="w-12 rounded border border-white/10 bg-[#080E17] px-1 py-1 text-center font-mono text-xs text-slate-200 tabular-nums"
                              />
                            </td>
                          )
                        )}
                        <td className="py-1.5 pl-1 text-right">
                          {editingClub.players.length > 7 && (
                            <button
                              type="button"
                              onClick={() => onDeletePlayer(editingClub.id, player.id)}
                              className="rounded p-1 text-slate-500 hover:text-red-400 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end border-t border-white/10 px-5 py-3">
              <button
                type="button"
                onClick={() => setEditingClubId(null)}
                className="min-h-[38px] rounded-md bg-emerald-500 px-5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
              >
                Save Squad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
