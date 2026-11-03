export type Rol = 'Administrador' | 'Usuario';
export interface User {
  id?: number;
  username: string;
  email: string;
  rol: Rol;
}
