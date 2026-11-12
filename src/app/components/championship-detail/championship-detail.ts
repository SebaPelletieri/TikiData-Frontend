import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-championship-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './championship-detail.html',
  styleUrls: ['./championship-detail.css'],
})
export class ChampionshipDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  // Inicializamos en null para saber cuándo está cargando o listo
  championship = signal<any | null>(null);

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
    // Nos suscribimos por si cambia el parámetro en la misma ruta
    this.route.paramMap.subscribe((params) => {
      const nameParam = params.get('name'); // e.g., "liga-profesional"
      if (nameParam) {
        const formattedName = nameParam.replace(/-/g, ' '); // "liga profesional"
        this.loadChampionshipByName(formattedName);
      }
    });
  }

  private loadChampionshipByName(searchName: string) {
    // Petición a tu backend / json-server para buscar el campeonato por nombre
    this.http.get<any[]>(`http://localhost:3000/campeonatos`).subscribe({
      next: (champs) => {
        // Buscamos el que coincida (ignorando mayúsculas y acentos básicos o incluyendo texto)
        const found = champs.find((c) => c.name.toLowerCase().includes(searchName.toLowerCase()));

        if (found) {
          this.championship.set(found);
        } else {
          // Fallback temporal en caso de que no haga match exacto en la API pero deba mostrarse
          this.championship.set({
            name: searchName.toUpperCase(),
            logo: 'https://via.placeholder.com/24',
            country: 'Argentina',
            type: 'Liga',
            season: '2026',
          });
        }
      },
      error: () => {
        // Fallback si la API falla
        this.championship.set({
          name: searchName.toUpperCase(),
          logo: 'https://via.placeholder.com/24',
          country: 'Argentina',
          type: 'Liga',
          season: '2026',
        });
      },
    });
  }

  setTab(tab: 'general' | 'table' | 'matches' | 'scorers' | 'cards') {
    this.activeTab.set(tab);
  }

  toggleFollow() {
    this.isFollowing.set(!this.isFollowing());
  }
}
