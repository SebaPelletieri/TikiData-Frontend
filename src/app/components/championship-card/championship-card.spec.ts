import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChampionshipCard } from './championship-card';

describe('ChampionshipCard', () => {
  let component: ChampionshipCard;
  let fixture: ComponentFixture<ChampionshipCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChampionshipCard],
    }).compileComponents();

    fixture = TestBed.createComponent(ChampionshipCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
