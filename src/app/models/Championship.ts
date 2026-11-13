export type ChampionshipType = 'LIGA' | 'COPA'; 

export interface Championship {
  id?: number ;
  name: string;
  logo: string;
  type: ChampionshipType;
  teamsIDs: number[];
  season: string;
  country: string; 
}
