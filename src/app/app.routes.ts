import { ApplicationConfig } from '@angular/core';
import { Routes, provideRouter, withInMemoryScrolling } from '@angular/router';
import { Home } from './components/home/home';
import { Login } from './pages/login/login';
import { Profile } from './pages/profile/profile';
import { Register } from './pages/register/register';
import { PlayerDetailPage } from './pages/player-detail/player-detail';
import { Players } from './pages/players/players';
import { ChampionshipDetailPage } from './pages/championship-detail/championship-detail';
import { Championships } from './pages/championships/championships';
import { ProfileEdit } from './components/profile-edit/profile-edit';

import { TeamDetailPage } from './pages/team-detail/team-detail';
import { Teams } from './pages/teams/teams';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';
import { AdminDashboard } from './components/admin-dashboard/admin-dashboard';
import { MatchList } from './components/match-list/match-list';
import { MatchDetailPage } from './pages/match-detail/match-detail';
import { HomePage } from './pages/home-page/home-page';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: 'profile',
    component: Profile,
    canActivate: [authGuard],
  },
  {
    path: 'profile/edit',
    component: ProfileEdit,
    canActivate: [authGuard],
  },
  {
    path: 'profile/:id',
    component: Profile,
    canActivate: [adminGuard],
  },
  { path: 'teams', component: Teams },

  /* Rutas de equipos */
  {
    path: 'team/edit/:id',
    loadComponent: () =>
      import('./pages/team-edit-page/team-edit-page').then((m) => m.TeamEditPage),
    canActivate: [adminGuard],
  },
  { path: 'team/:id', component: TeamDetailPage },
  { path: 'team/name/:name', component: TeamDetailPage },
  { path: 'teams/:id', redirectTo: 'team/:id', pathMatch: 'full' },

  /* Rutas de jugadores */
  {
    path: 'player/edit/:id',
    loadComponent: () =>
      import('./pages/player-edit-page/player-edit-page').then((m) => m.PlayerEditPage),
    canActivate: [adminGuard],
  },
  { path: 'players', component: Players },
  { path: 'player/:name', component: PlayerDetailPage },
  { path: 'player/id/:id', redirectTo: 'player/:id', pathMatch: 'full' },
  { path: 'players/:name', redirectTo: 'player/:name', pathMatch: 'full' },

  /* Rutas de campeonatos */
  {
    path: 'championship/edit/:id',
    loadComponent: () =>
      import('./pages/championship-edit-page/championship-edit-page').then(
        (m) => m.ChampionshipEditPage,
      ),
    canActivate: [adminGuard],
  },
  { path: 'championships', component: Championships },
  { path: 'championship/:name', component: ChampionshipDetailPage },
  { path: 'championships/:name', redirectTo: 'championship/:name', pathMatch: 'full' },

  /* Rutas de partidos */
  {
    path: 'match/edit/:id',
    loadComponent: () =>
      import('./pages/match-edit-page/match-edit-page').then((m) => m.MatchEditPage),
    canActivate: [adminGuard],
  },
  { path: 'match/:id', component: MatchDetailPage },
  { path: 'matches', component: MatchList },

  /* Rutas de administración */
  {
    path: 'admin',
    component: AdminDashboard,
    canActivate: [adminGuard],
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./components/user-list/user-list').then((m) => m.UserList),
    canActivate: [adminGuard],
  },
  { path: '**', redirectTo: '' },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled', 
        anchorScrolling: 'enabled',
      }),
    ),
  ],
};
