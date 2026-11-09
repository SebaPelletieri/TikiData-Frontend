export type Position = 'ARQ' | 'DEF' | 'MED' | 'DEL';
export interface Player {
  id?: number;
  name: string;
  photo: string;
  age: number;
  position: Position;
  currentTeamID?: number;
  teamName?: string;
  birthDate: string;
  nationality: string;
  preferredFoot: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  dorsals?: Record<number, number>;
}
