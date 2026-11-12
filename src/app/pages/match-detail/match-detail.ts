import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatchService } from '../../services/match-service';
import { MatchDetail } from '../../components/match-detail/match-detail';

@Component({
  imports: [MatchDetail],
  selector: 'app-match-detail-page',
  styleUrl: './match-detail.css',
  templateUrl: './match-detail.html',
})
export class MatchDetailPage {
}
