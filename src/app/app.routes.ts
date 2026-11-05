import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Profile } from './pages/profile/profile';
import { Register } from './pages/register/register';
import { PlayerDetail } from './pages/player-detail/player-detail';
import { Players } from './pages/players/players';
import { TeamDetail } from './pages/team-detail/team-detail';
import { Teams } from './pages/teams/teams';
import { ChampionshipDetail } from './pages/championship-detail/championship-detail';
import { Championships } from './pages/championships/championships';
import { MatchDetail } from './pages/match-detail/match-detail';
import { authGuard } from './guards/auth-guard';

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
  { path: 'teams', component: Teams },
  { path: 'team/:id', component: TeamDetail },
  { path: 'players', component: Players },
  { path: 'player/:id', component: PlayerDetail },
  { path: 'championships', component: Championships },
  { path: 'championship/:id', component: ChampionshipDetail },
  { path: 'match/:id', component: MatchDetail },
  { path: '**', redirectTo: '' }, // ÚNICO comodín, siempre al final de todo
];
