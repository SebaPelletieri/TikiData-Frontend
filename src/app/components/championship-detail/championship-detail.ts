import { Component, input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-championship-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './championship-detail.html',
  styleUrls: ['./championship-detail.css'],
})
export class ChampionshipDetail implements OnInit {
  // ¡Asegúrate de tener esta línea declarada para que acepte el binding desde la page!
  champId = input<number>();

  championship = signal<any>({
    name: 'Premier League',
    logo: 'https://resources.premierleague.com/premierleague/photo/2021/05/13/a64fa4c9-c3b6-45ef-b1a7-0e9e7f82e0a2/pl-logo.png',
    country: 'Inglaterra',
    type: 'Liga',
    season: '2024/2025',
  });

  activeTab = signal<'general' | 'table' | 'matches' | 'scorers' | 'cards'>('general');

  standings = signal<any[]>([
    {
      position: 1,
      name: 'Liverpool',
      shield: 'https://resources.premierleague.com/premierleague/badges/t14.png',
      pj: 32,
      g: 23,
      e: 7,
      p: 2,
      dg: '+42',
      pts: 76,
    },
    {
      position: 2,
      name: 'Arsenal',
      shield: 'https://resources.premierleague.com/premierleague/badges/t3.png',
      pj: 32,
      g: 22,
      e: 6,
      p: 4,
      dg: '+38',
      pts: 72,
    },
    {
      position: 3,
      name: 'Manchester City',
      shield: 'https://resources.premierleague.com/premierleague/badges/t43.png',
      pj: 32,
      g: 20,
      e: 7,
      p: 5,
      dg: '+36',
      pts: 67,
    },
    {
      position: 4,
      name: 'Aston Villa',
      shield: 'https://resources.premierleague.com/premierleague/badges/t7.png',
      pj: 32,
      g: 18,
      e: 6,
      p: 8,
      dg: '+20',
      pts: 60,
    },
    {
      position: 5,
      name: 'Tottenham',
      shield: 'https://resources.premierleague.com/premierleague/badges/t6.png',
      pj: 32,
      g: 17,
      e: 6,
      p: 9,
      dg: '+16',
      pts: 57,
    },
  ]);

  upcomingMatches = signal<any[]>([
    {
      date: '20 abr',
      homeName: 'Arsenal',
      homeShield: 'https://resources.premierleague.com/premierleague/badges/t3.png',
      awayName: 'Chelsea',
      awayShield: 'https://resources.premierleague.com/premierleague/badges/t8.png',
    },
    {
      date: '20 abr',
      homeName: 'Liverpool',
      homeShield: 'https://resources.premierleague.com/premierleague/badges/t14.png',
      awayName: 'Fulham',
      awayShield: 'https://resources.premierleague.com/premierleague/badges/t54.png',
    },
    {
      date: '21 abr',
      homeName: 'Manchester City',
      homeShield: 'https://resources.premierleague.com/premierleague/badges/t43.png',
      awayName: 'Brighton',
      awayShield: 'https://resources.premierleague.com/premierleague/badges/t36.png',
    },
  ]);

  topScorers = signal<any[]>([
    {
      position: 1,
      name: 'E. Haaland',
      photo: 'https://resources.premierleague.com/premierleague/photos/players/250x250/p223094.png',
      goals: 22,
    },
    {
      position: 2,
      name: 'M. Salah',
      photo: 'https://resources.premierleague.com/premierleague/photos/players/250x250/p118748.png',
      goals: 21,
    },
    {
      position: 3,
      name: 'O. Watkins',
      photo: 'https://resources.premierleague.com/premierleague/photos/players/250x250/p177830.png',
      goals: 16,
    },
    {
      position: 4,
      name: 'C. Palmer',
      photo: 'https://resources.premierleague.com/premierleague/photos/players/250x250/p452140.png',
      goals: 14,
    },
    {
      position: 5,
      name: 'B. Saka',
      photo: 'https://resources.premierleague.com/premierleague/photos/players/250x250/p223340.png',
      goals: 13,
    },
  ]);

  isFollowing = signal<boolean>(false);

  ngOnInit() {
    console.log('ID del campeonato recibido:', this.champId());
  }

  setTab(tab: 'general' | 'table' | 'matches' | 'scorers' | 'cards') {
    this.activeTab.set(tab);
  }

  toggleFollow() {
    this.isFollowing.set(!this.isFollowing());
  }
}
