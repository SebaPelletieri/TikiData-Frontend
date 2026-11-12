export type ChampionshipType = 'LIGA' | 'COPA';

export interface ChampionshipZone {
  name: string;
  teamIDs: (number | string)[];
}

export interface Championship {
  id?: number | string;
  name: string;
  logo: string;
  type: ChampionshipType;
  teamsIDs?: (number | string)[];
  zones?: ChampionshipZone[];
  season?: string;
  country: string;
}