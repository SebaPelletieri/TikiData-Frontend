import { Player } from "./Player";
import { Team } from "./Team";

export type Role = 'Administrador' | 'Usuario';
export interface User {
  id?: number;
  username: string;
  email: string;
  role: Role;
  favoriteTeams: number[]
  favoritePlayer: number[]
}
