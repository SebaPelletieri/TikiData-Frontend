export type Position = 'ARQ' | 'DEF' | 'MED' | 'DEL';
export interface Player {
  id?: number;
  name: string;
  photo: string;
  position: Position;
  currentTeamID?: number;
  bithDate: string;
  nacionality: string;
  preferredFoot: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}
