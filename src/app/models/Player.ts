export type Position = 'ARQ' | 'DEF' | 'MED' | 'DEL';
export interface Player {
  id?: number;
  name: string;
  photo: string;
  age: number;
  position: Position;
  currentTeamID?: number;
  birthDate: string; 
  nacionality: string;
  preferredFoot: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  dorsals?: Record<number, number>;
}
