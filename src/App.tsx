import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Club,
  Fixture,
  GroupData,
  LiveMatchSnapshot,
  Player,
  SpeedOption,
  TournamentStatus,
} from './types/tournament';
import {
  createCustomClub,
  createDefaultClubs,
  getPlayerPhotoPath,
  resetClubTournamentStats,
} from './data/defaultClubs';
import {
  advanceBracketIfReady,
  buildTournamentFromClubs,
} from './engine/tournamentLogic';
import {
  LiveMatchEngine,
  MatchCompletionPayload,
  MatchStatDelta,
} from './engine/matchSimulation';
import { soundEngine } from './engine/soundEngine';
import { SetupView } from './components/SetupView';
import { LiveBroadcastView } from './components/LiveBroadcastView';

const STORAGE_KEY = 'floodlight_cup_nations_v3';

function loadInitialClubs(): Club[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Club[];
      if (Array.isArray(parsed) && parsed.length >= 20 && parsed[0]?.flag) {
        return resetClubTournamentStats(
          parsed.map((club) => ({
            ...club,
            players: club.players.map((p) => ({
              ...p,
              photoUrl: p.photoUrl || getPlayerPhotoPath(club.shortCode, p.number, p.name),
            })),
          }))
        );
      }
    }
  } catch {
    // Fallback to default 20 nations with /player-images/ portraits
  }
  return createDefaultClubs();
}

export default function App() {
  const [clubs, setClubs] = useState<Club[]>(loadInitialClubs);
  const [tournamentStatus, setTournamentStatus] = useState<TournamentStatus>('SETUP');
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [activeFixtureId, setActiveFixtureId] = useState<string | null>(null);
  const [championId, setChampionId] = useState<string | null>(null);

  // Default 1x real-time (full 60 real minutes, no 5-min halftime break)
  const [speed, setSpeed] = useState<SpeedOption>(1);
  const [paused, setPaused] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);

  const [snapshot, setSnapshot] = useState<LiveMatchSnapshot | null>(null);

  const engineRef = useRef<LiveMatchEngine | null>(null);
  const clubsRef = useRef<Club[]>(clubs);
  const groupsRef = useRef<GroupData[]>(groups);
  const fixturesRef = useRef<Fixture[]>(fixtures);
  const speedRef = useRef<SpeedOption>(speed);
  const pausedRef = useRef<boolean>(paused);
  const statusRef = useRef<TournamentStatus>(tournamentStatus);
  const nextCountdownRef = useRef<number | null>(null);
  const pendingNextFixtureIdRef = useRef<string | null>(null);

  clubsRef.current = clubs;
  groupsRef.current = groups;
  fixturesRef.current = fixtures;
  speedRef.current = speed;
  pausedRef.current = paused;
  statusRef.current = tournamentStatus;

  useEffect(() => {
    try {
      const cleaned = resetClubTournamentStats(clubs);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    } catch {
      // Ignore storage quota issues (e.g., large uploaded data URLs)
    }
  }, [clubs]);

  const clubsById = useMemo(() => {
    const map: Record<string, Club> = {};
    clubs.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [clubs]);

  const activeFixture = useMemo(
    () => fixtures.find((f) => f.id === activeFixtureId) ?? null,
    [fixtures, activeFixtureId]
  );

  const nextFixture = useMemo(() => {
    if (tournamentStatus === 'TOURNAMENT_COMPLETE') return null;
    return (
      fixtures.find((f) => f.status === 'SCHEDULED' && f.id !== activeFixtureId) ?? null
    );
  }, [fixtures, activeFixtureId, tournamentStatus]);

  const championClub = championId ? clubsById[championId] ?? null : null;

  const handleStatDelta = useCallback((delta: MatchStatDelta) => {
    setClubs((prev) =>
      prev.map((club) => {
        if (club.id !== delta.clubId) return club;
        return {
          ...club,
          players: club.players.map((p) => {
            if (p.id !== delta.playerId) return p;
            return {
              ...p,
              goals: p.goals + (delta.goals ?? 0),
              assists: p.assists + (delta.assists ?? 0),
              saves: p.saves + (delta.saves ?? 0),
              shots: p.shots + (delta.shots ?? 0),
            };
          }),
        };
      })
    );
  }, []);

  const launchFixture = useCallback(
    (fixtureToRun: Fixture, currentClubs: Club[]) => {
      if (!fixtureToRun.homeTeamId || !fixtureToRun.awayTeamId) return;
      const home = currentClubs.find((c) => c.id === fixtureToRun.homeTeamId);
      const away = currentClubs.find((c) => c.id === fixtureToRun.awayTeamId);
      if (!home || !away) return;

      const stageToStatus: Record<Fixture['stage'], TournamentStatus> = {
        GROUP: 'GROUP_STAGE',
        QF: 'QUARTER_FINALS',
        SF: 'SEMI_FINALS',
        FINAL: 'FINAL',
      };
      const nextStatus = stageToStatus[fixtureToRun.stage];
      setTournamentStatus(nextStatus);
      statusRef.current = nextStatus;

      setActiveFixtureId(fixtureToRun.id);
      setFixtures((prev) => {
        const mapped = prev.map((f) =>
          f.id === fixtureToRun.id ? { ...f, status: 'LIVE' as const } : f
        );
        fixturesRef.current = mapped;
        return mapped;
      });

      const handleMatchFinished = (payload: MatchCompletionPayload) => {
        setClubs((prev) =>
          prev.map((club) => {
            if (club.id !== home.id && club.id !== away.id) return club;
            return {
              ...club,
              players: club.players.map((p) => ({
                ...p,
                matchesPlayed: p.matchesPlayed + 1,
              })),
            };
          })
        );

        const latestMap: Record<string, Club> = {};
        clubsRef.current.forEach((c) => {
          latestMap[c.id] = c;
        });

        const committed = fixturesRef.current.map((f) =>
          f.id === payload.fixtureId
            ? {
                ...f,
                status: 'COMPLETED' as const,
                homeScore: payload.homeScore,
                awayScore: payload.awayScore,
                homePenalties: payload.homePenalties,
                awayPenalties: payload.awayPenalties,
                penaltyLog: payload.penaltyLog,
                winnerId: payload.winnerId,
                events: payload.events,
                stats: payload.stats,
              }
            : f
        );

        const progressed = advanceBracketIfReady(groupsRef.current, committed, latestMap);
        fixturesRef.current = progressed;
        setFixtures(progressed);

        // If 1 vs 1 match OR Tournament Final has ended -> Stop permanently, never auto-restart
        const completedMatch = progressed.find((f) => f.id === payload.fixtureId);
        if (completedMatch?.stage === 'FINAL' || progressed.length === 1) {
          setChampionId(payload.winnerId);
          setTournamentStatus('TOURNAMENT_COMPLETE');
          statusRef.current = 'TOURNAMENT_COMPLETE';
          nextCountdownRef.current = null;
          pendingNextFixtureIdRef.current = null;
          return;
        }

        // Tournament non-final match: Display Post-Match Player Report (photos, goals, assists) for 12s, then auto-start next match lineups
        const upcoming = progressed.find(
          (f) => f.status === 'SCHEDULED' && f.homeTeamId && f.awayTeamId
        );
        if (upcoming) {
          pendingNextFixtureIdRef.current = upcoming.id;
          nextCountdownRef.current = speedRef.current >= 60 ? 6.0 : 12.0;
        } else {
          pendingNextFixtureIdRef.current = null;
          nextCountdownRef.current = null;
        }
      };

      const engine = new LiveMatchEngine(
        fixtureToRun,
        home,
        away,
        handleStatDelta,
        handleMatchFinished
      );
      engineRef.current = engine;
      setSnapshot(engine.getSnapshot(null));
    },
    [handleStatDelta]
  );

  // Master 60fps simulation loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let lastUiSync = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const engine = engineRef.current;
      if (engine && statusRef.current !== 'SETUP') {
        engine.step(dt, speedRef.current, pausedRef.current);

        if (
          statusRef.current !== 'TOURNAMENT_COMPLETE' &&
          !pausedRef.current &&
          nextCountdownRef.current !== null &&
          pendingNextFixtureIdRef.current
        ) {
          nextCountdownRef.current -= dt;
          if (nextCountdownRef.current <= 0) {
            const nextId = pendingNextFixtureIdRef.current;
            nextCountdownRef.current = null;
            pendingNextFixtureIdRef.current = null;
            const nextFx = fixturesRef.current.find((f) => f.id === nextId);
            if (nextFx) {
              launchFixture(nextFx, clubsRef.current);
            }
          }
        }

        if (now - lastUiSync >= 100) {
          lastUiSync = now;
          if (engineRef.current) {
            setSnapshot(engineRef.current.getSnapshot(nextCountdownRef.current));
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [launchFixture]);

  const handleToggleClub = (clubId: string) => {
    setClubs((prev) =>
      prev.map((c) => (c.id === clubId ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleClearSelection = () => {
    setClubs((prev) => prev.map((c) => ({ ...c, selected: false })));
  };

  const handleSelectPresetCount = (count: number) => {
    setClubs((prev) =>
      prev.map((c, idx) => ({
        ...c,
        selected: idx < count,
      }))
    );
  };

  const handleAddClub = () => {
    setClubs((prev) => {
      if (prev.length >= 24) return prev;
      return [...prev, createCustomClub(prev.length)];
    });
  };

  const handleDeleteClub = (clubId: string) => {
    setClubs((prev) => (prev.length <= 8 ? prev : prev.filter((c) => c.id !== clubId)));
  };

  const handleUpdateClub = (clubId: string, patch: Partial<Club>) => {
    setClubs((prev) => prev.map((c) => (c.id === clubId ? { ...c, ...patch } : c)));
  };

  const handleUpdatePlayer = (clubId: string, playerId: string, patch: Partial<Player>) => {
    setClubs((prev) =>
      prev.map((club) => {
        if (club.id !== clubId) return club;
        return {
          ...club,
          players: club.players.map((p) => (p.id === playerId ? { ...p, ...patch } : p)),
        };
      })
    );
  };

  const handleAddPlayer = (clubId: string) => {
    setClubs((prev) =>
      prev.map((club) => {
        if (club.id !== clubId) return club;
        const nextNum = club.players.reduce((max, p) => Math.max(max, p.number), 0) + 1;
        const newPlayer: Player = {
          id: `${club.id}-custom-${Date.now()}`,
          name: `Player ${nextNum}`,
          number: Math.min(99, nextNum),
          position: 'MID',
          photoUrl: '/player-images/default-player.svg',
          attack: 80,
          defense: 76,
          pace: 79,
          passing: 80,
          goalkeeping: 35,
          goals: 0,
          assists: 0,
          saves: 0,
          shots: 0,
          matchesPlayed: 0,
        };
        return { ...club, players: [...club.players, newPlayer] };
      })
    );
  };

  const handleDeletePlayer = (clubId: string, playerId: string) => {
    setClubs((prev) =>
      prev.map((club) => {
        if (club.id !== clubId || club.players.length <= 7) return club;
        return {
          ...club,
          players: club.players.filter((p) => p.id !== playerId),
        };
      })
    );
  };

  const handleResetDefaults = () => {
    setClubs(createDefaultClubs());
  };

  const handleStartTournament = () => {
    const activeClubs = clubs.filter((c) => c.selected);
    if (activeClubs.length < 2) return;

    soundEngine.unlock();
    soundEngine.startAmbience();
    const cleanedClubs = resetClubTournamentStats(clubs);
    setClubs(cleanedClubs);
    clubsRef.current = cleanedClubs;

    const { groups: drawnGroups, fixtures: drawnFixtures } = buildTournamentFromClubs(
      cleanedClubs.filter((c) => c.selected)
    );

    setGroups(drawnGroups);
    groupsRef.current = drawnGroups;
    setFixtures(drawnFixtures);
    fixturesRef.current = drawnFixtures;
    setChampionId(null);
    setPaused(false);
    pausedRef.current = false;
    nextCountdownRef.current = null;
    pendingNextFixtureIdRef.current = null;

    if (drawnFixtures[0]) {
      launchFixture(drawnFixtures[0], cleanedClubs);
    }
  };

  const handleKickoffNow = () => {
    soundEngine.unlock();
    if (engineRef.current) {
      engineRef.current.kickoffNow();
      setSnapshot(engineRef.current.getSnapshot(nextCountdownRef.current));
    }
  };

  const handleAdvanceNextNow = () => {
    const nextId = pendingNextFixtureIdRef.current;
    if (!nextId) return;
    nextCountdownRef.current = null;
    pendingNextFixtureIdRef.current = null;
    const nextFx = fixturesRef.current.find((f) => f.id === nextId);
    if (nextFx) {
      launchFixture(nextFx, clubsRef.current);
    }
  };

  const handleResetTournament = () => {
    soundEngine.stopAmbience();
    engineRef.current = null;
    nextCountdownRef.current = null;
    pendingNextFixtureIdRef.current = null;
    setSnapshot(null);
    setActiveFixtureId(null);
    setChampionId(null);
    setGroups([]);
    setFixtures([]);
    setPaused(false);
    setTournamentStatus('SETUP');
    statusRef.current = 'SETUP';
    setClubs((prev) => resetClubTournamentStats(prev));
  };

  const handleToggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    soundEngine.setMuted(nextMuted);
    if (!nextMuted) soundEngine.unlock();
  };

  if (tournamentStatus === 'SETUP') {
    return (
      <SetupView
        clubs={clubs}
        onToggleClub={handleToggleClub}
        onClearSelection={handleClearSelection}
        onSelectPresetCount={handleSelectPresetCount}
        onAddClub={handleAddClub}
        onDeleteClub={handleDeleteClub}
        onUpdateClub={handleUpdateClub}
        onUpdatePlayer={handleUpdatePlayer}
        onAddPlayer={handleAddPlayer}
        onDeletePlayer={handleDeletePlayer}
        onResetDefaults={handleResetDefaults}
        onStartTournament={handleStartTournament}
      />
    );
  }

  return (
    <LiveBroadcastView
      engineRef={engineRef}
      snapshot={snapshot}
      activeFixture={activeFixture}
      nextFixture={nextFixture}
      groups={groups}
      fixtures={fixtures}
      clubs={clubs}
      clubsById={clubsById}
      tournamentStatus={tournamentStatus}
      championClub={championClub}
      speed={speed}
      paused={paused}
      muted={muted}
      onChangeSpeed={setSpeed}
      onTogglePause={() => setPaused((p) => !p)}
      onToggleMute={handleToggleMute}
      onKickoffNow={handleKickoffNow}
      onAdvanceNextNow={handleAdvanceNextNow}
      onResetTournament={handleResetTournament}
    />
  );
}
