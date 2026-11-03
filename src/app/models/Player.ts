export type Position = 'ARQ' | 'DEF' | 'MED' | 'DEL';
export interface Player {
  id?: number;
  name: string;
  photo: string;
  age: number;
  position: string;
  teamID?: number;
}
