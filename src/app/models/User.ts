export type Role = 'Administrador' | 'Usuario';

export interface User {
  id?: number;
  username: string;
  email: string;
  role: Role;
  favoriteTeams: number[];
  favoritePlayers: number[];
  favoriteChampionships: number[]; 
  avatar?: string;
  country: string;
  createdAt?: string;
}
