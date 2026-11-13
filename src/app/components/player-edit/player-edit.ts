import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PlayerService } from '../../services/player-service';

@Component({
  selector: 'app-player-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './player-edit.html',
  styleUrl: './player-edit.css',
})
export class PlayerEdit implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private playerService = inject(PlayerService);

  playerForm!: FormGroup;
  playerId: number | null = null;

  positions = ['Arquero', 'Defensor', 'Mediocampista', 'Delantero'];
  footPreferences = ['Derecho', 'Izquierdo', 'Ambidiestro'];

  countries = [
    'Argentina',
    'Brasil',
    'Uruguay',
    'Chile',
    'Colombia',
    'Perú',
    'Bolivia',
    'Paraguay',
    'Ecuador',
    'Venezuela',
    'México',
    'Estados Unidos',
    'España',
    'Francia',
    'Italia',
    'Alemania',
    'Inglaterra',
    'Portugal',
    'Países Bajos',
  ].sort();

  isPositionOpen = false;
  isFootOpen = false;
  isCountryOpen = false;

  ngOnInit(): void {
    this.initForm();

    // Capturamos directamente el ID de la URL (/player/edit/:id)
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.playerId = Number(id);
        this.loadPlayerData(this.playerId);
      }
    });
  }

  initForm() {
    this.playerForm = this.fb.group({
      name: ['', Validators.required],
      nationality: ['', Validators.required],
      position: ['', Validators.required],
      birthDate: [''],
      preferredFoot: [''],
      photo: [''],
    });
  }

  loadPlayerData(id: number) {
    this.playerService.getByID(id).subscribe({
      next: (player: any) => {
        if (player) {
          this.playerForm.patchValue({
            name: player.name,
            nationality: player.nationality || player.nacionalidad,
            position: player.position || player.posicion,
            birthDate: player.birthDate || player.fechaNacimiento,
            preferredFoot: player.preferredFoot || player.pieHabil,
            photo: '',
          });
        }
      },
      error: (err) => console.error('Error al cargar jugador:', err),
    });
  }

  togglePositionDropdown() {
    this.isPositionOpen = !this.isPositionOpen;
    this.isFootOpen = false;
    this.isCountryOpen = false;
  }
  selectPosition(pos: string) {
    this.playerForm.get('position')?.setValue(pos);
    this.isPositionOpen = false;
  }

  toggleFootDropdown() {
    this.isFootOpen = !this.isFootOpen;
    this.isPositionOpen = false;
    this.isCountryOpen = false;
  }
  selectFoot(foot: string) {
    this.playerForm.get('preferredFoot')?.setValue(foot);
    this.isFootOpen = false;
  }

  toggleCountryDropdown() {
    this.isCountryOpen = !this.isCountryOpen;
    this.isPositionOpen = false;
    this.isFootOpen = false;
  }
  selectCountry(country: string) {
    this.playerForm.get('nationality')?.setValue(country);
    this.isCountryOpen = false;
  }

  onSubmit() {
    if (this.playerForm.valid && this.playerId !== null) {
      this.playerService.updatePlayer(this.playerId, this.playerForm.value).subscribe({
        next: () => {
          this.router.navigate(['/admin']);
        },
        error: (err: any) => console.error('Error al actualizar:', err),
      });
    } else {
      this.playerForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.router.navigate(['/admin']);
  }
}
