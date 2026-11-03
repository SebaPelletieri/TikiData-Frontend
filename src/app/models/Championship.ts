export type ChampionshipType = 'League' | 'Cup';
export interface Championship {
  id?: number;
  name: string;
  logo: string;
  type: ChampionshipType;
}
