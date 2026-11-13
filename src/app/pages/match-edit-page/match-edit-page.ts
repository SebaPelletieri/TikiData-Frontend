import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatchEdit } from '../../components/match-edit/match-edit';

@Component({
  selector: 'app-match-edit-page',
  standalone: true,
  imports: [CommonModule, MatchEdit],
  templateUrl: './match-edit-page.html',
  styleUrl: './match-edit-page.css',
})
export class MatchEditPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  matchId = signal<number | null>(null);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.matchId.set(Number(id));
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin']);
  }
}
