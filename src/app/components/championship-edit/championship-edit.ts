import { Component, Input, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChampionshipService } from '../../services/championship-service';

@Component({
  selector: 'app-championship-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './championship-edit.html',
  styleUrl: './championship-edit.css',
})
export class ChampionshipEdit implements OnInit {
  @Input() championshipIdInput!: number | string;
  @Output() closePanel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private championshipService = inject(ChampionshipService);

  champForm!: FormGroup;

  // Listas desplegables
  types = ['LIGA', 'COPA'];

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
    'Internacional',
  ].sort();

  isTypeOpen = false;
  isCountryOpen = false;

  ngOnInit() {
    this.initForm();
    if (this.championshipIdInput) {
      this.loadData(Number(this.championshipIdInput));
    }
  }

  initForm() {
    this.champForm = this.fb.group({
      name: ['', Validators.required],
      season: [''],
      country: ['', Validators.required],
      type: ['', Validators.required],
      logo: ['', Validators.required],
    });
  }

  loadData(id: number) {
    this.championshipService.getByID(id).subscribe({
      next: (champ: any) => {
        if (champ) {
          this.champForm.patchValue({
            name: champ.name,
            season: champ.season,
            country: champ.country,
            type: champ.type,
            logo: '', // 👈 Forzamos a que aparezca siempre vacío al cargar
          });
        }
      },
      error: (err: any) => console.error('Error al cargar campeonato:', err),
    });
  }

  toggleTypeDropdown() {
    this.isTypeOpen = !this.isTypeOpen;
    this.isCountryOpen = false;
  }

  selectType(typeValue: string) {
    this.champForm.get('type')?.setValue(typeValue);
    this.isTypeOpen = false;
  }

  toggleCountryDropdown() {
    this.isCountryOpen = !this.isCountryOpen;
    this.isTypeOpen = false;
  }

  selectCountry(countryName: string) {
    this.champForm.get('country')?.setValue(countryName);
    this.isCountryOpen = false;
  }

  onSubmit() {
    if (this.champForm.valid && this.championshipIdInput) {
      this.championshipService
        .updateChampionship(Number(this.championshipIdInput), this.champForm.value)
        .subscribe({
          next: () => {
            this.closePanel.emit();
          },
          error: (err: any) => console.error('Error al actualizar campeonato:', err),
        });
    } else {
      this.champForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.closePanel.emit();
  }
}
