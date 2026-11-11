export type Status = 'Programado' | 'En Vivo' | 'Finalizado';

export interface GoalDetail {
  player: string;
  minute: number;
}

export interface Incidence {
  minute: number;
  type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION';
  text: string;
}

export interface StatItem {
  label: string;
  local: number;
  away: number;
  unit?: string;
}

export interface LineupPlayer {
  number?: number;
  name: string;
  position?: string;
}

export interface MatchLineups {
  local: LineupPlayer[];
  away: LineupPlayer[];
}

export interface H2HMatch {
  date: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
}

export interface H2HSummary {
  totalMatches: number;
  localWins: number;
  awayWins: number;
  draws: number;
  previousMatches: H2HMatch[];
}

export interface MatchSummary {
  text: string;
  manOfTheMatch?: {
    name: string;
    team: string;
    rating?: string;
  };
}

export interface Match {
  id?: number | string;
  localTeamID: number;
  awayTeamID: number;
  date: Date | string;
  championshipID: number;
  localGoals: number;
  awayGoals: number;
  status?: Status;

  stadium?: string;
  championshipName?: string;
  localGoalsDetail?: GoalDetail[];
  awayGoalsDetail?: GoalDetail[];
  statistics?: StatItem[];
  incidences?: Incidence[];
  lineups?: MatchLineups;
  summary?: MatchSummary;
  h2h?: H2HSummary;
}