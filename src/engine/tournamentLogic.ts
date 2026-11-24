import {
  Club,
  Fixture,
  GroupData,
  MatchStats,
  PlayerLeaderboardRow,
  StandingsRow,
} from '../types/tournament';

export function createEmptyMatchStats(): MatchStats {
  return {
    homePossessionTicks: 1,
    awayPossessionTicks: 1,
    homeShots: 0,
    awayShots: 0,
    homeShotsOnTarget: 0,
    awayShotsOnTarget: 0,
    homeSaves: 0,
    awaySaves: 0,
    homePasses: 0,
    awayPasses: 0,
    homeTackles: 0,
    awayTackles: 0,
  };
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function buildTournamentFromClubs(selectedClubs: Club[]): {
  groups: GroupData[];
  fixtures: Fixture[];
} {
  const count = selectedClubs.length;

  // Special Case 1: Exactly 2 countries -> Direct 60-Minute 1 vs 1 Match!
  if (count === 2) {
    return {
      groups: [],
      fixtures: [
        {
          id: 'fix-final',
          order: 1,
          stage: 'FINAL',
          stageLabel: '1 vs 1 Match',
          bracketSlot: 'FINAL',
          homeTeamId: selectedClubs[0].id,
          awayTeamId: selectedClubs[1].id,
          status: 'SCHEDULED',
          homeScore: 0,
          awayScore: 0,
          events: [],
          stats: createEmptyMatchStats(),
        },
      ],
    };
  }

  const shuffled = shuffleArray(selectedClubs);

  // Special Case 2: 3-7 countries -> Single Group A -> Semi-Finals (or Final for 3) -> Final
  if (count < 8) {
    const qualifyCount = count >= 4 ? 4 : 2;
    const group: GroupData = {
      id: 'group-A',
      name: 'Group A',
      teamIds: shuffled.map((c) => c.id),
      qualifyCount,
    };

    const fixtures: Fixture[] = [];
    let order = 1;
    for (let i = 0; i < group.teamIds.length; i++) {
      for (let j = i + 1; j < group.teamIds.length; j++) {
        fixtures.push({
          id: `fix-g-${order}`,
          order,
          stage: 'GROUP',
          stageLabel: 'Round 1 · Group A',
          groupId: group.id,
          homeTeamId: group.teamIds[i],
          awayTeamId: group.teamIds[j],
          status: 'SCHEDULED',
          homeScore: 0,
          awayScore: 0,
          events: [],
          stats: createEmptyMatchStats(),
        });
        order++;
      }
    }

    if (count >= 4) {
      fixtures.push(
        {
          id: 'fix-sf1',
          order: order++,
          stage: 'SF',
          stageLabel: 'Semi-Final 1',
          bracketSlot: 'SF1',
          homeTeamId: null,
          awayTeamId: null,
          homePlaceholder: 'Group A · 1st',
          awayPlaceholder: 'Group A · 4th',
          status: 'SCHEDULED',
          homeScore: 0,
          awayScore: 0,
          events: [],
          stats: createEmptyMatchStats(),
        },
        {
          id: 'fix-sf2',
          order: order++,
          stage: 'SF',
          stageLabel: 'Semi-Final 2',
          bracketSlot: 'SF2',
          homeTeamId: null,
          awayTeamId: null,
          homePlaceholder: 'Group A · 2nd',
          awayPlaceholder: 'Group A · 3rd',
          status: 'SCHEDULED',
          homeScore: 0,
          awayScore: 0,
          events: [],
          stats: createEmptyMatchStats(),
        }
      );
    }

    fixtures.push({
      id: 'fix-final',
      order: order++,
      stage: 'FINAL',
      stageLabel: 'Championship Final',
      bracketSlot: 'FINAL',
      homeTeamId: null,
      awayTeamId: null,
      homePlaceholder: count >= 4 ? 'Winner SF 1' : 'Group A · 1st',
      awayPlaceholder: count >= 4 ? 'Winner SF 2' : 'Group A · 2nd',
      status: 'SCHEDULED',
      homeScore: 0,
      awayScore: 0,
      events: [],
      stats: createEmptyMatchStats(),
    });

    return { groups: [group], fixtures };
  }

  // Standard Full Cup: 8-20+ countries -> Groups -> Quarter-Finals -> Semi-Finals -> Final
  const numGroups = count >= 12 ? 4 : 2;
  const qualifyCount = numGroups === 4 ? 2 : 4;
  const groupLetters = ['A', 'B', 'C', 'D'].slice(0, numGroups);

  const groups: GroupData[] = groupLetters.map((letter) => ({
    id: `group-${letter}`,
    name: `Group ${letter}`,
    teamIds: [],
    qualifyCount,
  }));

  shuffled.forEach((club, index) => {
    groups[index % numGroups].teamIds.push(club.id);
  });

  const perGroupPairs: Array<Array<{ groupId: string; groupName: string; home: string; away: string }>> =
    groups.map((g) => {
      const pairs: Array<{ groupId: string; groupName: string; home: string; away: string }> = [];
      for (let i = 0; i < g.teamIds.length; i++) {
        for (let j = i + 1; j < g.teamIds.length; j++) {
          const flip = (i + j) % 2 === 1;
          pairs.push({
            groupId: g.id,
            groupName: g.name,
            home: flip ? g.teamIds[j] : g.teamIds[i],
            away: flip ? g.teamIds[i] : g.teamIds[j],
          });
        }
      }
      return pairs;
    });

  const maxRounds = Math.max(...perGroupPairs.map((list) => list.length));
  const fixtures: Fixture[] = [];
  let order = 1;

  for (let r = 0; r < maxRounds; r++) {
    for (let gIdx = 0; gIdx < perGroupPairs.length; gIdx++) {
      const pair = perGroupPairs[gIdx][r];
      if (!pair) continue;
      fixtures.push({
        id: `fix-g-${order}`,
        order,
        stage: 'GROUP',
        stageLabel: `Round 1 · ${pair.groupName}`,
        groupId: pair.groupId,
        homeTeamId: pair.home,
        awayTeamId: pair.away,
        status: 'SCHEDULED',
        homeScore: 0,
        awayScore: 0,
        events: [],
        stats: createEmptyMatchStats(),
      });
      order++;
    }
  }

  const qfLabels =
    numGroups === 4
      ? [
          { slot: 'QF1' as const, home: 'Group A · 1st', away: 'Group B · 2nd' },
          { slot: 'QF2' as const, home: 'Group C · 1st', away: 'Group D · 2nd' },
          { slot: 'QF3' as const, home: 'Group B · 1st', away: 'Group A · 2nd' },
          { slot: 'QF4' as const, home: 'Group D · 1st', away: 'Group C · 2nd' },
        ]
      : [
          { slot: 'QF1' as const, home: 'Group A · 1st', away: 'Group B · 4th' },
          { slot: 'QF2' as const, home: 'Group B · 2nd', away: 'Group A · 3rd' },
          { slot: 'QF3' as const, home: 'Group B · 1st', away: 'Group A · 4th' },
          { slot: 'QF4' as const, home: 'Group A · 2nd', away: 'Group B · 3rd' },
        ];

  qfLabels.forEach((qf, idx) => {
    fixtures.push({
      id: `fix-${qf.slot.toLowerCase()}`,
      order: order++,
      stage: 'QF',
      stageLabel: `Quarter-Final ${idx + 1}`,
      bracketSlot: qf.slot,
      homeTeamId: null,
      awayTeamId: null,
      homePlaceholder: qf.home,
      awayPlaceholder: qf.away,
      status: 'SCHEDULED',
      homeScore: 0,
      awayScore: 0,
      events: [],
      stats: createEmptyMatchStats(),
    });
  });

  fixtures.push(
    {
      id: 'fix-sf1',
      order: order++,
      stage: 'SF',
      stageLabel: 'Semi-Final 1',
      bracketSlot: 'SF1',
      homeTeamId: null,
      awayTeamId: null,
      homePlaceholder: 'Winner QF 1',
      awayPlaceholder: 'Winner QF 2',
      status: 'SCHEDULED',
      homeScore: 0,
      awayScore: 0,
      events: [],
      stats: createEmptyMatchStats(),
    },
    {
      id: 'fix-sf2',
      order: order++,
      stage: 'SF',
      stageLabel: 'Semi-Final 2',
      bracketSlot: 'SF2',
      homeTeamId: null,
      awayTeamId: null,
      homePlaceholder: 'Winner QF 3',
      awayPlaceholder: 'Winner QF 4',
      status: 'SCHEDULED',
      homeScore: 0,
      awayScore: 0,
      events: [],
      stats: createEmptyMatchStats(),
    },
    {
      id: 'fix-final',
      order: order++,
      stage: 'FINAL',
      stageLabel: 'Championship Final',
      bracketSlot: 'FINAL',
      homeTeamId: null,
      awayTeamId: null,
      homePlaceholder: 'Winner SF 1',
      awayPlaceholder: 'Winner SF 2',
      status: 'SCHEDULED',
      homeScore: 0,
      awayScore: 0,
      events: [],
      stats: createEmptyMatchStats(),
    }
  );

  return { groups, fixtures };
}

export function calculateStandings(
  group: GroupData,
  fixtures: Fixture[],
  clubsById: Record<string, Club>
): StandingsRow[] {
  const table: Record<string, StandingsRow> = {};

  group.teamIds.forEach((teamId) => {
    const club = clubsById[teamId];
    table[teamId] = {
      teamId,
      teamName: club?.name ?? 'Unknown Nation',
      shortCode: club?.shortCode ?? 'NAT',
      primaryColor: club?.primaryColor ?? '#64748B',
      secondaryColor: club?.secondaryColor ?? '#F8FAFC',
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
      qualified: false,
    };
  });

  fixtures
    .filter((f) => f.stage === 'GROUP' && f.groupId === group.id && f.status === 'COMPLETED')
    .forEach((f) => {
      if (!f.homeTeamId || !f.awayTeamId) return;
      const home = table[f.homeTeamId];
      const away = table[f.awayTeamId];
      if (!home || !away) return;

      home.played += 1;
      away.played += 1;
      home.gf += f.homeScore;
      home.ga += f.awayScore;
      away.gf += f.awayScore;
      away.ga += f.homeScore;

      if (f.homeScore > f.awayScore) {
        home.won += 1;
        home.points += 3;
        away.lost += 1;
      } else if (f.awayScore > f.homeScore) {
        away.won += 1;
        away.points += 3;
        home.lost += 1;
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.points += 1;
        away.points += 1;
      }

      home.gd = home.gf - home.ga;
      away.gd = away.gf - away.ga;
    });

  const sorted = Object.values(table).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.teamName.localeCompare(b.teamName);
  });

  return sorted.map((row, idx) => ({
    ...row,
    qualified: idx < group.qualifyCount,
  }));
}

export function advanceBracketIfReady(
  groups: GroupData[],
  fixtures: Fixture[],
  clubsById: Record<string, Club>
): Fixture[] {
  const updated = fixtures.map((f) => ({ ...f }));

  const groupMatches = updated.filter((f) => f.stage === 'GROUP');
  const allGroupsDone = groupMatches.length > 0 && groupMatches.every((f) => f.status === 'COMPLETED');

  const qf1 = updated.find((f) => f.bracketSlot === 'QF1');
  const sf1 = updated.find((f) => f.bracketSlot === 'SF1');
  const sf2 = updated.find((f) => f.bracketSlot === 'SF2');
  const finalMatch = updated.find((f) => f.bracketSlot === 'FINAL');

  const assign = (slot: Fixture['bracketSlot'], homeId: string | undefined, awayId: string | undefined) => {
    const target = updated.find((f) => f.bracketSlot === slot);
    if (target && homeId && awayId) {
      target.homeTeamId = homeId;
      target.awayTeamId = awayId;
    }
  };

  if (allGroupsDone) {
    const standingsByGroup: Record<string, StandingsRow[]> = {};
    groups.forEach((g) => {
      standingsByGroup[g.id] = calculateStandings(g, updated, clubsById);
    });

    if (qf1 && !qf1.homeTeamId) {
      if (groups.length === 4) {
        const A = standingsByGroup['group-A'] ?? [];
        const B = standingsByGroup['group-B'] ?? [];
        const C = standingsByGroup['group-C'] ?? [];
        const D = standingsByGroup['group-D'] ?? [];
        assign('QF1', A[0]?.teamId, B[1]?.teamId);
        assign('QF2', C[0]?.teamId, D[1]?.teamId);
        assign('QF3', B[0]?.teamId, A[1]?.teamId);
        assign('QF4', D[0]?.teamId, C[1]?.teamId);
      } else if (groups.length === 2) {
        const A = standingsByGroup['group-A'] ?? [];
        const B = standingsByGroup['group-B'] ?? [];
        assign('QF1', A[0]?.teamId, B[3]?.teamId);
        assign('QF2', B[1]?.teamId, A[2]?.teamId);
        assign('QF3', B[0]?.teamId, A[3]?.teamId);
        assign('QF4', A[1]?.teamId, B[2]?.teamId);
      }
    } else if (!qf1 && sf1 && !sf1.homeTeamId && groups.length === 1) {
      const A = standingsByGroup['group-A'] ?? [];
      assign('SF1', A[0]?.teamId, A[3]?.teamId);
      assign('SF2', A[1]?.teamId, A[2]?.teamId);
    } else if (!qf1 && !sf1 && finalMatch && !finalMatch.homeTeamId && groups.length === 1) {
      const A = standingsByGroup['group-A'] ?? [];
      assign('FINAL', A[0]?.teamId, A[1]?.teamId);
    }
  }

  const getWinner = (slot: Fixture['bracketSlot']) =>
    updated.find((f) => f.bracketSlot === slot && f.status === 'COMPLETED')?.winnerId ?? null;

  if (qf1 && sf1) {
    const w1 = getWinner('QF1');
    const w2 = getWinner('QF2');
    if (w1 && !sf1.homeTeamId) sf1.homeTeamId = w1;
    if (w2 && !sf1.awayTeamId) sf1.awayTeamId = w2;
  }

  if (qf1 && sf2) {
    const w3 = getWinner('QF3');
    const w4 = getWinner('QF4');
    if (w3 && !sf2.homeTeamId) sf2.homeTeamId = w3;
    if (w4 && !sf2.awayTeamId) sf2.awayTeamId = w4;
  }

  if (sf1 && finalMatch) {
    const ws1 = getWinner('SF1');
    const ws2 = getWinner('SF2');
    if (ws1 && !finalMatch.homeTeamId) finalMatch.homeTeamId = ws1;
    if (ws2 && !finalMatch.awayTeamId) finalMatch.awayTeamId = ws2;
  }

  return updated;
}

export function getPlayerLeaderboard(clubs: Club[]): PlayerLeaderboardRow[] {
  const rows: PlayerLeaderboardRow[] = [];
  clubs
    .filter((c) => c.selected)
    .forEach((club) => {
      club.players.forEach((p) => {
        rows.push({
          playerId: p.id,
          playerName: p.name,
          number: p.number,
          position: p.position,
          photoUrl: p.photoUrl,
          clubId: club.id,
          clubName: club.name,
          clubShortCode: club.shortCode,
          clubColor: club.primaryColor,
          goals: p.goals,
          assists: p.assists,
          saves: p.saves,
          shots: p.shots,
          matchesPlayed: p.matchesPlayed,
        });
      });
    });
  return rows;
}
