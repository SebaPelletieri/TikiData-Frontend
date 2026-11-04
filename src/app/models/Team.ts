export interface Team {
  id?: number;
  name: string;
  shield: string;
  country: string;
  yearOfFundation: Date;
  championshipsActive: number[]
  playerIDs: number[]
  stadiumID: number
}
