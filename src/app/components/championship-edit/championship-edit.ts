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
import { uniqueCombinationValidator } from '../../validators/duplicate-validator';
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

  get selectedCountryLabel(): string {
    const value = this.selectedCountry;
    return this.countryOptions.find((c) => c.value === value)?.label || value;
  }

  isTypeOpen = false;
  isCountryOpen = false;

  ngOnInit() {
    if (this.championshipService.championships().length === 0) {
      this.championshipService.getAll();
    }
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
    this.champForm = this.fb.group(
      {
        name: ['', Validators.required],
        season: [''],
        country: ['', Validators.required],
        type: ['', Validators.required],
        logo: ['', Validators.required],
      },
      {
        validators: [
          uniqueCombinationValidator(
            ['name', 'season'],
            () => this.championshipService.championships(),
            () => this.championshipIdInput,
          ),
        ],
      },
    );
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
            logo: champ.logo || champ.imagen || '', 
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
