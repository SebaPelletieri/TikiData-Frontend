import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChampionshipDetail } from './championship-detail';

describe('ChampionshipDetail', () => {
  let component: ChampionshipDetail;
  let fixture: ComponentFixture<ChampionshipDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChampionshipDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(ChampionshipDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
