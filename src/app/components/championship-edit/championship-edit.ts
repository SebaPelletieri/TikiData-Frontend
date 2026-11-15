import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  inject,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChampionshipService } from '../../services/championship-service';
import {
  COUNTRY_OPTIONS,
  CountryOption,
  getCountryFlag as countryFlagUrl,
} from '../../utils/countries';

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

  types = ['LIGA', 'COPA'];

  // Misma lista de países y banderas que ChampionshipForm
  countryOptions: CountryOption[] = COUNTRY_OPTIONS;
  getCountryFlag = countryFlagUrl;

  get selectedCountry(): string {
    return this.champForm?.get('country')?.value || '';
  }

  get isKnownCountry(): boolean {
    return this.countryOptions.some((c) => c.value === this.selectedCountry);
  }

  // Si el campeonato tiene un país que no está en la lista se muestra su nombre tal cual
  get selectedCountryLabel(): string {
    const value = this.selectedCountry;
    return this.countryOptions.find((c) => c.value === value)?.label || value;
  }

  isTypeOpen = false;
  isCountryOpen = false;

  ngOnInit() {
    this.initForm();
    if (this.championshipIdInput) {
      this.loadData(Number(this.championshipIdInput));
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.country-group')) this.isCountryOpen = false;
    if (!target.closest('.type-group')) this.isTypeOpen = false;
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
            name: champ.name || '',
            season: champ.season || '',
            country: champ.country || '',
            type: champ.type || '',
            logo: champ.logo || champ.imagen || '', // 👈 Corregido para cargar el logo correctamente
          });
        }
      },
      error: (err: any) => console.error('Error al cargar campeonato:', err),
    });
  }

  toggleTypeDropdown(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.isTypeOpen = !this.isTypeOpen;
    this.isCountryOpen = false;
  }

  selectType(typeValue: string) {
    this.champForm.get('type')?.setValue(typeValue);
    this.isTypeOpen = false;
  }

  toggleCountryDropdown(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.isCountryOpen = !this.isCountryOpen;
    this.isTypeOpen = false;
  }

  selectCountry(countryName: string) {
    this.champForm.get('country')?.setValue(countryName);
    this.champForm.get('country')?.markAsTouched();
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
