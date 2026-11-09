import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Profile } from './pages/profile/profile';
import { Register } from './pages/register/register';
import { PlayerDetail } from './pages/player-detail/player-detail';
import { Players } from './pages/players/players';
import { ChampionshipDetail } from './pages/championship-detail/championship-detail';
import { Championships } from './pages/championships/championships';
import { MatchDetail } from './pages/match-detail/match-detail';
import { ProfileEdit } from './components/profile-edit/profile-edit';

// Importación de Páginas, Guards y Panel de Administración
import { TeamDetailPage } from './pages/team-detail/team-detail';
import { Teams } from './pages/teams/teams';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';
import { AdminDashboard } from './components/admin-dashboard/admin-dashboard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: 'profile',
    component: Profile,
    canActivate: [authGuard],
  },
  { path: 'profile/edit', component: ProfileEdit },
  { path: 'teams', component: Teams },

  /* Modificado: ahora usa :name en lugar de :id */
  { path: 'team/:name', component: TeamDetailPage },
  { path: 'teams/:name', redirectTo: 'team/:name', pathMatch: 'full' },

  { path: 'players', component: Players },
  { path: 'player/:id', component: PlayerDetail },
  { path: 'players/:id', redirectTo: 'player/:id', pathMatch: 'full' },
  { path: 'championships', component: Championships },
  { path: 'championship/:id', component: ChampionshipDetail },
  { path: 'championships/:id', redirectTo: 'championship/:id', pathMatch: 'full' },
  { path: 'match/:id', component: MatchDetail },
  {
    path: 'admin',
    component: AdminDashboard,
    canActivate: [adminGuard],
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./pages/admin/user-list/user-list').then((m) => m.UserList),
    canActivate: [adminGuard],
  },
  { path: '**', redirectTo: '' },
];
