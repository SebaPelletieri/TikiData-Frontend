export interface Team {
  id?: number;
  name: string ;
  shield: string;
  country: string;
  yearOfFoundation: Date;
  championshipsActive: number[];
  playerIDs: number[];
  stadiumID: number;
  points?: number;
}
