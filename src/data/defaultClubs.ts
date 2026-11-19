import { Club, ClubRatings, Player, PlayerPosition } from '../types/tournament';

interface RawNationSeed {
  id: string;
  name: string;
  shortCode: string;
  flag: string;
  primaryColor: string;
  secondaryColor: string;
  tier: number;
  roster: Array<{
    name: string;
    number: number;
    position: PlayerPosition;
    boost?: number;
  }>;
}

function buildPlayer(
  clubId: string,
  index: number,
  name: string,
  number: number,
  position: PlayerPosition,
  tier: number,
  boost = 0
): Player {
  const base = Math.min(95, Math.max(66, tier + boost));
  const jitter = ((index * 7 + clubId.length * 3) % 5) - 2;
  const clamp = (val: number) => Math.max(45, Math.min(98, Math.round(val)));

  if (position === 'GK') {
    return {
      id: `${clubId}-p${index + 1}`,
      name,
      number,
      position,
      attack: clamp(base - 30 + jitter),
      defense: clamp(base - 8 + jitter),
      pace: clamp(base - 18 + jitter),
      passing: clamp(base - 10 + jitter),
      goalkeeping: clamp(base + 5 + jitter),
      goals: 0,
      assists: 0,
      saves: 0,
      shots: 0,
      matchesPlayed: 0,
    };
  }

  if (position === 'DEF') {
    return {
      id: `${clubId}-p${index + 1}`,
      name,
      number,
      position,
      attack: clamp(base - 15 + jitter),
      defense: clamp(base + 5 + jitter),
      pace: clamp(base - 2 + jitter),
      passing: clamp(base - 3 + jitter),
      goalkeeping: clamp(32 + jitter),
      goals: 0,
      assists: 0,
      saves: 0,
      shots: 0,
      matchesPlayed: 0,
    };
  }

  if (position === 'MID') {
    return {
      id: `${clubId}-p${index + 1}`,
      name,
      number,
      position,
      attack: clamp(base + jitter),
      defense: clamp(base - 2 + jitter),
      pace: clamp(base + 1 + jitter),
      passing: clamp(base + 6 + jitter),
      goalkeeping: clamp(30 + jitter),
      goals: 0,
      assists: 0,
      saves: 0,
      shots: 0,
      matchesPlayed: 0,
    };
  }

  return {
    id: `${clubId}-p${index + 1}`,
    name,
    number,
    position,
    attack: clamp(base + 6 + jitter),
    defense: clamp(base - 20 + jitter),
    pace: clamp(base + 4 + jitter),
    passing: clamp(base - 1 + jitter),
    goalkeeping: clamp(28 + jitter),
    goals: 0,
    assists: 0,
    saves: 0,
    shots: 0,
    matchesPlayed: 0,
  };
}

const RAW_NATIONS: RawNationSeed[] = [
  {
    id: 'nat-arg',
    name: 'Argentina',
    shortCode: 'ARG',
    flag: '🇦🇷',
    primaryColor: '#38BDF8',
    secondaryColor: '#FFFFFF',
    tier: 88,
    roster: [
      { name: 'E. Martinez', number: 23, position: 'GK', boost: 5 },
      { name: 'N. Molina', number: 26, position: 'DEF', boost: 1 },
      { name: 'C. Romero', number: 13, position: 'DEF', boost: 4 },
      { name: 'L. Martinez', number: 25, position: 'DEF', boost: 3 },
      { name: 'N. Tagliafico', number: 3, position: 'DEF', boost: 1 },
      { name: 'R. De Paul', number: 7, position: 'MID', boost: 3 },
      { name: 'E. Fernandez', number: 24, position: 'MID', boost: 3 },
      { name: 'A. Mac Allister', number: 20, position: 'MID', boost: 4 },
      { name: 'L. Messi', number: 10, position: 'FWD', boost: 7 },
      { name: 'J. Alvarez', number: 9, position: 'FWD', boost: 4 },
      { name: 'L. Martinez', number: 22, position: 'FWD', boost: 5 },
    ],
  },
  {
    id: 'nat-bra',
    name: 'Brazil',
    shortCode: 'BRA',
    flag: '🇧🇷',
    primaryColor: '#FACC15',
    secondaryColor: '#14532D',
    tier: 87,
    roster: [
      { name: 'Alisson', number: 1, position: 'GK', boost: 5 },
      { name: 'Danilo', number: 2, position: 'DEF', boost: 1 },
      { name: 'Marquinhos', number: 4, position: 'DEF', boost: 4 },
      { name: 'Gabriel', number: 14, position: 'DEF', boost: 3 },
      { name: 'Wendell', number: 6, position: 'DEF', boost: 0 },
      { name: 'B. Guimaraes', number: 5, position: 'MID', boost: 3 },
      { name: 'L. Paqueta', number: 8, position: 'MID', boost: 3 },
      { name: 'J. Gomes', number: 15, position: 'MID', boost: 2 },
      { name: 'Raphinha', number: 11, position: 'FWD', boost: 4 },
      { name: 'Rodrygo', number: 10, position: 'FWD', boost: 4 },
      { name: 'Vinicius Jr', number: 7, position: 'FWD', boost: 6 },
    ],
  },
  {
    id: 'nat-esp',
    name: 'Spain',
    shortCode: 'ESP',
    flag: '🇪🇸',
    primaryColor: '#DC2626',
    secondaryColor: '#FEF08A',
    tier: 88,
    roster: [
      { name: 'Unai Simon', number: 23, position: 'GK', boost: 3 },
      { name: 'D. Carvajal', number: 2, position: 'DEF', boost: 4 },
      { name: 'R. Le Normand', number: 3, position: 'DEF', boost: 2 },
      { name: 'A. Laporte', number: 14, position: 'DEF', boost: 3 },
      { name: 'M. Cucurella', number: 24, position: 'DEF', boost: 2 },
      { name: 'Rodri', number: 16, position: 'MID', boost: 6 },
      { name: 'Fabian Ruiz', number: 8, position: 'MID', boost: 3 },
      { name: 'Pedri', number: 20, position: 'MID', boost: 5 },
      { name: 'L. Yamal', number: 19, position: 'FWD', boost: 5 },
      { name: 'A. Morata', number: 7, position: 'FWD', boost: 2 },
      { name: 'N. Williams', number: 17, position: 'FWD', boost: 4 },
    ],
  },
  {
    id: 'nat-por',
    name: 'Portugal',
    shortCode: 'POR',
    flag: '🇵🇹',
    primaryColor: '#B91C1C',
    secondaryColor: '#16A34A',
    tier: 87,
    roster: [
      { name: 'Diogo Costa', number: 22, position: 'GK', boost: 4 },
      { name: 'J. Cancelo', number: 20, position: 'DEF', boost: 3 },
      { name: 'Ruben Dias', number: 4, position: 'DEF', boost: 5 },
      { name: 'G. Inacio', number: 14, position: 'DEF', boost: 2 },
      { name: 'Nuno Mendes', number: 19, position: 'DEF', boost: 3 },
      { name: 'Vitinha', number: 23, position: 'MID', boost: 4 },
      { name: 'B. Fernandes', number: 8, position: 'MID', boost: 5 },
      { name: 'B. Silva', number: 10, position: 'MID', boost: 4 },
      { name: 'Pedro Neto', number: 25, position: 'FWD', boost: 3 },
      { name: 'C. Ronaldo', number: 7, position: 'FWD', boost: 5 },
      { name: 'Rafael Leao', number: 17, position: 'FWD', boost: 5 },
    ],
  },
  {
    id: 'nat-fra',
    name: 'France',
    shortCode: 'FRA',
    flag: '🇫🇷',
    primaryColor: '#1D4ED8',
    secondaryColor: '#FFFFFF',
    tier: 88,
    roster: [
      { name: 'M. Maignan', number: 16, position: 'GK', boost: 4 },
      { name: 'J. Kounde', number: 5, position: 'DEF', boost: 3 },
      { name: 'W. Saliba', number: 17, position: 'DEF', boost: 5 },
      { name: 'D. Upamecano', number: 4, position: 'DEF', boost: 3 },
      { name: 'T. Hernandez', number: 22, position: 'DEF', boost: 4 },
      { name: 'A. Tchouameni', number: 8, position: 'MID', boost: 3 },
      { name: 'E. Camavinga', number: 6, position: 'MID', boost: 3 },
      { name: 'A. Griezmann', number: 7, position: 'MID', boost: 4 },
      { name: 'O. Dembele', number: 11, position: 'FWD', boost: 4 },
      { name: 'M. Thuram', number: 15, position: 'FWD', boost: 3 },
      { name: 'K. Mbappe', number: 10, position: 'FWD', boost: 7 },
    ],
  },
  {
    id: 'nat-ger',
    name: 'Germany',
    shortCode: 'GER',
    flag: '🇩🇪',
    primaryColor: '#F8FAFC',
    secondaryColor: '#0F172A',
    tier: 86,
    roster: [
      { name: 'M. ter Stegen', number: 1, position: 'GK', boost: 4 },
      { name: 'J. Kimmich', number: 6, position: 'DEF', boost: 4 },
      { name: 'A. Rudiger', number: 2, position: 'DEF', boost: 4 },
      { name: 'J. Tah', number: 4, position: 'DEF', boost: 3 },
      { name: 'D. Raum', number: 3, position: 'DEF', boost: 2 },
      { name: 'R. Andrich', number: 8, position: 'MID', boost: 2 },
      { name: 'P. Gross', number: 5, position: 'MID', boost: 2 },
      { name: 'F. Wirtz', number: 17, position: 'MID', boost: 5 },
      { name: 'J. Musiala', number: 10, position: 'FWD', boost: 5 },
      { name: 'K. Havertz', number: 7, position: 'FWD', boost: 3 },
      { name: 'L. Sane', number: 19, position: 'FWD', boost: 3 },
    ],
  },
  {
    id: 'nat-eng',
    name: 'England',
    shortCode: 'ENG',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    primaryColor: '#E2E8F0',
    secondaryColor: '#DC2626',
    tier: 87,
    roster: [
      { name: 'J. Pickford', number: 1, position: 'GK', boost: 3 },
      { name: 'K. Walker', number: 2, position: 'DEF', boost: 3 },
      { name: 'J. Stones', number: 5, position: 'DEF', boost: 4 },
      { name: 'M. Guehi', number: 6, position: 'DEF', boost: 3 },
      { name: 'L. Shaw', number: 3, position: 'DEF', boost: 2 },
      { name: 'D. Rice', number: 4, position: 'MID', boost: 5 },
      { name: 'J. Bellingham', number: 10, position: 'MID', boost: 6 },
      { name: 'C. Palmer', number: 24, position: 'MID', boost: 4 },
      { name: 'B. Saka', number: 7, position: 'FWD', boost: 5 },
      { name: 'H. Kane', number: 9, position: 'FWD', boost: 6 },
      { name: 'P. Foden', number: 11, position: 'FWD', boost: 5 },
    ],
  },
  {
    id: 'nat-ita',
    name: 'Italy',
    shortCode: 'ITA',
    flag: '🇮🇹',
    primaryColor: '#2563EB',
    secondaryColor: '#FFFFFF',
    tier: 85,
    roster: [
      { name: 'G. Donnarumma', number: 1, position: 'GK', boost: 5 },
      { name: 'G. Di Lorenzo', number: 2, position: 'DEF', boost: 2 },
      { name: 'A. Bastoni', number: 23, position: 'DEF', boost: 5 },
      { name: 'R. Calafiori', number: 5, position: 'DEF', boost: 3 },
      { name: 'F. Dimarco', number: 3, position: 'DEF', boost: 4 },
      { name: 'N. Barella', number: 18, position: 'MID', boost: 5 },
      { name: 'S. Tonali', number: 8, position: 'MID', boost: 3 },
      { name: 'D. Frattesi', number: 16, position: 'MID', boost: 3 },
      { name: 'F. Chiesa', number: 14, position: 'FWD', boost: 3 },
      { name: 'M. Retegui', number: 9, position: 'FWD', boost: 3 },
      { name: 'G. Raspadori', number: 10, position: 'FWD', boost: 2 },
    ],
  },
  {
    id: 'nat-ned',
    name: 'Netherlands',
    shortCode: 'NED',
    flag: '🇳🇱',
    primaryColor: '#F97316',
    secondaryColor: '#FFFFFF',
    tier: 85,
    roster: [
      { name: 'B. Verbruggen', number: 1, position: 'GK', boost: 3 },
      { name: 'D. Dumfries', number: 22, position: 'DEF', boost: 3 },
      { name: 'V. van Dijk', number: 4, position: 'DEF', boost: 6 },
      { name: 'M. de Ligt', number: 3, position: 'DEF', boost: 3 },
      { name: 'N. Ake', number: 5, position: 'DEF', boost: 3 },
      { name: 'F. de Jong', number: 21, position: 'MID', boost: 5 },
      { name: 'T. Reijnders', number: 14, position: 'MID', boost: 4 },
      { name: 'X. Simons', number: 7, position: 'MID', boost: 4 },
      { name: 'D. Malen', number: 18, position: 'FWD', boost: 3 },
      { name: 'M. Depay', number: 10, position: 'FWD', boost: 3 },
      { name: 'C. Gakpo', number: 11, position: 'FWD', boost: 4 },
    ],
  },
  {
    id: 'nat-uru',
    name: 'Uruguay',
    shortCode: 'URU',
    flag: '🇺🇾',
    primaryColor: '#0EA5E9',
    secondaryColor: '#0F172A',
    tier: 85,
    roster: [
      { name: 'S. Rochet', number: 1, position: 'GK', boost: 3 },
      { name: 'N. Nandez', number: 8, position: 'DEF', boost: 2 },
      { name: 'R. Araujo', number: 4, position: 'DEF', boost: 5 },
      { name: 'J. Gimenez', number: 2, position: 'DEF', boost: 3 },
      { name: 'M. Olivera', number: 16, position: 'DEF', boost: 2 },
      { name: 'M. Ugarte', number: 5, position: 'MID', boost: 3 },
      { name: 'F. Valverde', number: 15, position: 'MID', boost: 6 },
      { name: 'R. Bentancur', number: 6, position: 'MID', boost: 3 },
      { name: 'F. Pellistri', number: 11, position: 'FWD', boost: 2 },
      { name: 'D. Nunez', number: 9, position: 'FWD', boost: 4 },
      { name: 'M. Araujo', number: 20, position: 'FWD', boost: 3 },
    ],
  },
  {
    id: 'nat-cro',
    name: 'Croatia',
    shortCode: 'CRO',
    flag: '🇭🇷',
    primaryColor: '#EF4444',
    secondaryColor: '#FFFFFF',
    tier: 84,
    roster: [
      { name: 'D. Livakovic', number: 1, position: 'GK', boost: 4 },
      { name: 'J. Stanisic', number: 2, position: 'DEF', boost: 2 },
      { name: 'J. Sutalo', number: 6, position: 'DEF', boost: 2 },
      { name: 'J. Gvardiol', number: 4, position: 'DEF', boost: 5 },
      { name: 'B. Sosa', number: 19, position: 'DEF', boost: 2 },
      { name: 'L. Modric', number: 10, position: 'MID', boost: 6 },
      { name: 'M. Kovacic', number: 8, position: 'MID', boost: 4 },
      { name: 'M. Pasalic', number: 15, position: 'MID', boost: 3 },
      { name: 'L. Majer', number: 7, position: 'FWD', boost: 3 },
      { name: 'A. Kramaric', number: 9, position: 'FWD', boost: 4 },
      { name: 'I. Perisic', number: 14, position: 'FWD', boost: 3 },
    ],
  },
  {
    id: 'nat-bel',
    name: 'Belgium',
    shortCode: 'BEL',
    flag: '🇧🇪',
    primaryColor: '#991B1B',
    secondaryColor: '#FACC15',
    tier: 84,
    roster: [
      { name: 'K. Casteels', number: 1, position: 'GK', boost: 3 },
      { name: 'T. Castagne', number: 21, position: 'DEF', boost: 2 },
      { name: 'W. Faes', number: 4, position: 'DEF', boost: 2 },
      { name: 'A. Theate', number: 3, position: 'DEF', boost: 3 },
      { name: 'M. De Cuyper', number: 5, position: 'DEF', boost: 2 },
      { name: 'A. Onana', number: 24, position: 'MID', boost: 3 },
      { name: 'Y. Tielemans', number: 8, position: 'MID', boost: 3 },
      { name: 'K. De Bruyne', number: 7, position: 'MID', boost: 6 },
      { name: 'L. Trossard', number: 9, position: 'FWD', boost: 4 },
      { name: 'R. Lukaku', number: 10, position: 'FWD', boost: 4 },
      { name: 'J. Doku', number: 22, position: 'FWD', boost: 4 },
    ],
  },
  {
    id: 'nat-col',
    name: 'Colombia',
    shortCode: 'COL',
    flag: '🇨🇴',
    primaryColor: '#EAB308',
    secondaryColor: '#1E3A8A',
    tier: 84,
    roster: [
      { name: 'C. Vargas', number: 12, position: 'GK', boost: 3 },
      { name: 'D. Munoz', number: 21, position: 'DEF', boost: 3 },
      { name: 'D. Sanchez', number: 23, position: 'DEF', boost: 3 },
      { name: 'J. Lucumi', number: 3, position: 'DEF', boost: 2 },
      { name: 'J. Mojica', number: 17, position: 'DEF', boost: 2 },
      { name: 'J. Lerma', number: 16, position: 'MID', boost: 3 },
      { name: 'R. Rios', number: 6, position: 'MID', boost: 3 },
      { name: 'J. Rodriguez', number: 10, position: 'MID', boost: 5 },
      { name: 'J. Arias', number: 11, position: 'FWD', boost: 3 },
      { name: 'J. Cordoba', number: 24, position: 'FWD', boost: 3 },
      { name: 'Luis Diaz', number: 7, position: 'FWD', boost: 5 },
    ],
  },
  {
    id: 'nat-mar',
    name: 'Morocco',
    shortCode: 'MAR',
    flag: '🇲🇦',
    primaryColor: '#BE123C',
    secondaryColor: '#15803D',
    tier: 84,
    roster: [
      { name: 'Y. Bounou', number: 1, position: 'GK', boost: 5 },
      { name: 'A. Hakimi', number: 2, position: 'DEF', boost: 5 },
      { name: 'N. Aguerd', number: 5, position: 'DEF', boost: 3 },
      { name: 'R. Saiss', number: 6, position: 'DEF', boost: 2 },
      { name: 'N. Mazraoui', number: 3, position: 'DEF', boost: 3 },
      { name: 'S. Amrabat', number: 4, position: 'MID', boost: 4 },
      { name: 'A. Ounahi', number: 8, position: 'MID', boost: 3 },
      { name: 'B. Diaz', number: 10, position: 'MID', boost: 4 },
      { name: 'H. Ziyech', number: 7, position: 'FWD', boost: 4 },
      { name: 'Y. En-Nesyri', number: 19, position: 'FWD', boost: 4 },
      { name: 'S. Rahimi', number: 11, position: 'FWD', boost: 3 },
    ],
  },
  {
    id: 'nat-jpn',
    name: 'Japan',
    shortCode: 'JPN',
    flag: '🇯🇵',
    primaryColor: '#1E40AF',
    secondaryColor: '#FFFFFF',
    tier: 83,
    roster: [
      { name: 'Z. Suzuki', number: 1, position: 'GK', boost: 3 },
      { name: 'Y. Sugawara', number: 2, position: 'DEF', boost: 2 },
      { name: 'K. Itakura', number: 4, position: 'DEF', boost: 3 },
      { name: 'T. Tomiyasu', number: 16, position: 'DEF', boost: 4 },
      { name: 'H. Ito', number: 21, position: 'DEF', boost: 3 },
      { name: 'W. Endo', number: 6, position: 'MID', boost: 4 },
      { name: 'H. Morita', number: 5, position: 'MID', boost: 3 },
      { name: 'D. Kamada', number: 15, position: 'MID', boost: 3 },
      { name: 'T. Kubo', number: 20, position: 'FWD', boost: 4 },
      { name: 'A. Ueda', number: 9, position: 'FWD', boost: 3 },
      { name: 'K. Mitoma', number: 7, position: 'FWD', boost: 5 },
    ],
  },
  {
    id: 'nat-mex',
    name: 'Mexico',
    shortCode: 'MEX',
    flag: '🇲🇽',
    primaryColor: '#15803D',
    secondaryColor: '#FFFFFF',
    tier: 82,
    roster: [
      { name: 'L. Malagon', number: 1, position: 'GK', boost: 3 },
      { name: 'J. Sanchez', number: 2, position: 'DEF', boost: 2 },
      { name: 'C. Montes', number: 3, position: 'DEF', boost: 3 },
      { name: 'J. Vasquez', number: 5, position: 'DEF', boost: 3 },
      { name: 'G. Arteaga', number: 6, position: 'DEF', boost: 2 },
      { name: 'E. Alvarez', number: 4, position: 'MID', boost: 4 },
      { name: 'L. Chavez', number: 24, position: 'MID', boost: 3 },
      { name: 'O. Pineda', number: 17, position: 'MID', boost: 3 },
      { name: 'H. Lozano', number: 22, position: 'FWD', boost: 4 },
      { name: 'S. Gimenez', number: 9, position: 'FWD', boost: 4 },
      { name: 'A. Vega', number: 10, position: 'FWD', boost: 3 },
    ],
  },
  {
    id: 'nat-usa',
    name: 'United States',
    shortCode: 'USA',
    flag: '🇺🇸',
    primaryColor: '#1D4ED8',
    secondaryColor: '#EF4444',
    tier: 82,
    roster: [
      { name: 'M. Turner', number: 1, position: 'GK', boost: 3 },
      { name: 'S. Dest', number: 2, position: 'DEF', boost: 3 },
      { name: 'C. Richards', number: 3, position: 'DEF', boost: 2 },
      { name: 'T. Ream', number: 13, position: 'DEF', boost: 2 },
      { name: 'A. Robinson', number: 5, position: 'DEF', boost: 4 },
      { name: 'T. Adams', number: 4, position: 'MID', boost: 3 },
      { name: 'W. McKennie', number: 8, position: 'MID', boost: 3 },
      { name: 'G. Reyna', number: 7, position: 'MID', boost: 3 },
      { name: 'T. Weah', number: 21, position: 'FWD', boost: 3 },
      { name: 'F. Balogun', number: 20, position: 'FWD', boost: 3 },
      { name: 'C. Pulisic', number: 10, position: 'FWD', boost: 5 },
    ],
  },
  {
    id: 'nat-sen',
    name: 'Senegal',
    shortCode: 'SEN',
    flag: '🇸🇳',
    primaryColor: '#16A34A',
    secondaryColor: '#FACC15',
    tier: 83,
    roster: [
      { name: 'E. Mendy', number: 16, position: 'GK', boost: 4 },
      { name: 'Y. Sabaly', number: 21, position: 'DEF', boost: 2 },
      { name: 'K. Koulibaly', number: 3, position: 'DEF', boost: 4 },
      { name: 'M. Niakhate', number: 19, position: 'DEF', boost: 3 },
      { name: 'I. Jakobs', number: 14, position: 'DEF', boost: 2 },
      { name: 'I. Gueye', number: 5, position: 'MID', boost: 3 },
      { name: 'P. M. Sarr', number: 17, position: 'MID', boost: 4 },
      { name: 'L. Camara', number: 15, position: 'MID', boost: 3 },
      { name: 'I. Sarr', number: 18, position: 'FWD', boost: 3 },
      { name: 'N. Jackson', number: 7, position: 'FWD', boost: 4 },
      { name: 'S. Mane', number: 10, position: 'FWD', boost: 5 },
    ],
  },
  {
    id: 'nat-kor',
    name: 'South Korea',
    shortCode: 'KOR',
    flag: '🇰🇷',
    primaryColor: '#E11D48',
    secondaryColor: '#FFFFFF',
    tier: 82,
    roster: [
      { name: 'Jo Hyeon-woo', number: 21, position: 'GK', boost: 3 },
      { name: 'Seol Young-woo', number: 22, position: 'DEF', boost: 2 },
      { name: 'Kim Min-jae', number: 4, position: 'DEF', boost: 5 },
      { name: 'Kim Young-gwon', number: 19, position: 'DEF', boost: 2 },
      { name: 'Lee Myung-jae', number: 3, position: 'DEF', boost: 2 },
      { name: 'Hwang In-beom', number: 6, position: 'MID', boost: 3 },
      { name: 'Park Yong-woo', number: 5, position: 'MID', boost: 2 },
      { name: 'Lee Kang-in', number: 18, position: 'MID', boost: 4 },
      { name: 'Hwang Hee-chan', number: 11, position: 'FWD', boost: 4 },
      { name: 'Cho Gue-sung', number: 9, position: 'FWD', boost: 3 },
      { name: 'Son Heung-min', number: 7, position: 'FWD', boost: 6 },
    ],
  },
  {
    id: 'nat-sui',
    name: 'Switzerland',
    shortCode: 'SUI',
    flag: '🇨🇭',
    primaryColor: '#DC2626',
    secondaryColor: '#FFFFFF',
    tier: 83,
    roster: [
      { name: 'G. Kobel', number: 1, position: 'GK', boost: 5 },
      { name: 'S. Widmer', number: 3, position: 'DEF', boost: 2 },
      { name: 'M. Akanji', number: 5, position: 'DEF', boost: 5 },
      { name: 'F. Schar', number: 22, position: 'DEF', boost: 3 },
      { name: 'R. Rodriguez', number: 13, position: 'DEF', boost: 2 },
      { name: 'G. Xhaka', number: 10, position: 'MID', boost: 5 },
      { name: 'R. Freuler', number: 8, position: 'MID', boost: 3 },
      { name: 'D. Zakaria', number: 6, position: 'MID', boost: 3 },
      { name: 'D. Ndoye', number: 19, position: 'FWD', boost: 3 },
      { name: 'B. Embolo', number: 7, position: 'FWD', boost: 3 },
      { name: 'R. Vargas', number: 17, position: 'FWD', boost: 3 },
    ],
  },
];

export function createDefaultClubs(): Club[] {
  return RAW_NATIONS.map((seed) => ({
    id: seed.id,
    name: seed.name,
    shortCode: seed.shortCode,
    flag: seed.flag,
    primaryColor: seed.primaryColor,
    secondaryColor: seed.secondaryColor,
    selected: false, // User manually picks countries before clicking Start
    players: seed.roster.map((r, i) =>
      buildPlayer(seed.id, i, r.name, r.number, r.position, seed.tier, r.boost ?? 0)
    ),
  }));
}

const CUSTOM_PALETTE = [
  { primary: '#14B8A6', secondary: '#CCFBF1' },
  { primary: '#D97706', secondary: '#FEF3C7' },
  { primary: '#4F46E5', secondary: '#E0E7FF' },
  { primary: '#BE123C', secondary: '#FFE4E6' },
  { primary: '#0891B2', secondary: '#CFFAFE' },
  { primary: '#65A30D', secondary: '#ECFCCB' },
];

const FIRST_NAMES = [
  'Liam', 'Noah', 'Mateo', 'Marco', 'Lucas', 'Julian', 'David', 'Daniel',
  'Leo', 'Samuel', 'Gabriel', 'Alex', 'Victor', 'Adrian', 'Oscar', 'Tomas',
];

const LAST_NAMES = [
  'Silva', 'Kovac', 'Novak', 'Vidal', 'Reyes', 'Bauer', 'Jensen', 'Moreno',
  'Costa', 'Sato', 'Keller', 'Vargas', 'Santos', 'Meyer', 'Rossi', 'Clark',
];

export function createCustomClub(existingCount: number): Club {
  const num = existingCount + 1;
  const id = `nat-custom-${Date.now()}-${num}`;
  const palette = CUSTOM_PALETTE[existingCount % CUSTOM_PALETTE.length];
  const positions: PlayerPosition[] = [
    'GK',
    'DEF', 'DEF', 'DEF', 'DEF',
    'MID', 'MID', 'MID',
    'FWD', 'FWD', 'FWD',
  ];
  const numbers = [1, 2, 4, 5, 3, 6, 8, 10, 7, 9, 11];

  const players = positions.map((pos, idx) => {
    const fn = FIRST_NAMES[(num * 3 + idx * 5) % FIRST_NAMES.length];
    const ln = LAST_NAMES[(num * 7 + idx * 3) % LAST_NAMES.length];
    return buildPlayer(id, idx, `${fn} ${ln}`, numbers[idx], pos, 82, (idx % 3) - 1);
  });

  return {
    id,
    name: `Nation ${num}`,
    shortCode: `N${num < 10 ? '0' : ''}${num}`,
    flag: '🏳️',
    primaryColor: palette.primary,
    secondaryColor: palette.secondary,
    selected: true,
    players,
  };
}

export function computeClubRatings(club: Club): ClubRatings {
  const players = club.players;
  if (players.length === 0) {
    return { overall: 75, attack: 75, midfield: 75, defense: 75, goalkeeping: 75 };
  }

  const gks = players.filter((p) => p.position === 'GK');
  const defs = players.filter((p) => p.position === 'DEF');
  const mids = players.filter((p) => p.position === 'MID');
  const fwds = players.filter((p) => p.position === 'FWD');

  const avg = (list: Player[], fn: (p: Player) => number, fallback: number) =>
    list.length > 0 ? Math.round(list.reduce((sum, p) => sum + fn(p), 0) / list.length) : fallback;

  const attack = avg(fwds.length > 0 ? fwds : players, (p) => p.attack * 0.7 + p.pace * 0.3, 75);
  const midfield = avg(mids.length > 0 ? mids : players, (p) => p.passing * 0.55 + p.attack * 0.25 + p.defense * 0.2, 75);
  const defense = avg(defs.length > 0 ? defs : players, (p) => p.defense * 0.75 + p.pace * 0.25, 75);
  const goalkeeping = avg(gks.length > 0 ? gks : players, (p) => p.goalkeeping, 75);
  const overall = Math.round((attack + midfield + defense + goalkeeping) / 4);

  return { overall, attack, midfield, defense, goalkeeping };
}

export function resetClubTournamentStats(clubs: Club[]): Club[] {
  return clubs.map((club) => ({
    ...club,
    players: club.players.map((p) => ({
      ...p,
      goals: 0,
      assists: 0,
      saves: 0,
      shots: 0,
      matchesPlayed: 0,
    })),
  }));
}
