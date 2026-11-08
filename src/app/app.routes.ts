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
import { TeamList } from './components/team-list/team-list';

// Importación de Guards
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';
import { ProfileEdit } from './components/profile-edit/profile-edit';
import { TeamDetailPage } from './pages/team-detail/team-detail';

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
  { path: 'teams', component: TeamList },
  { path: 'team/:id', component: TeamDetailPage },
  { path: 'players', component: Players },
  { path: 'player/:id', component: PlayerDetail },
  { path: 'championships', component: Championships },
  { path: 'championship/:id', component: ChampionshipDetail },
  { path: 'match/:id', component: MatchDetail },
  {
    path: 'admin/users',
    loadComponent: () => import('./pages/admin/user-list/user-list').then((m) => m.UserList),
    canActivate: [adminGuard],
  },
  { path: '**', redirectTo: '' }, // ÚNICO comodín, siempre al final de todo
];
