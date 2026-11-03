import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChampionshipForm } from './championship-form';

describe('ChampionshipForm', () => {
  let component: ChampionshipForm;
  let fixture: ComponentFixture<ChampionshipForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChampionshipForm],
    }).compileComponents();

    fixture = TestBed.createComponent(ChampionshipForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
