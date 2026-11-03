import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChampionshipList } from './championship-list';

describe('ChampionshipList', () => {
  let component: ChampionshipList;
  let fixture: ComponentFixture<ChampionshipList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChampionshipList],
    }).compileComponents();

    fixture = TestBed.createComponent(ChampionshipList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
