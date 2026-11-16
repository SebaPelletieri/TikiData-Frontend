export type Role = 'Administrador' | 'Usuario';

export interface User {
  id?: number;
  username: string;
  email: string;
  role: Role;
  favoriteTeams: (number | string)[];
  favoritePlayers: (number | string)[];
  favoriteChampionships: (number | string)[];
  avatar?: string;
  createdAt?: string;
}
