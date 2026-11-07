export type ChampionshipType = 'LIGA' | 'COPA' | 'INTERNACIONAL';

export interface Championship {
  id?: number;
  name: string;
  logo: string;
  type: ChampionshipType;
  teamsIDs?: number[];
  season?: string;
}
