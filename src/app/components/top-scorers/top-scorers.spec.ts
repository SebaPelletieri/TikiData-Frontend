import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopScorers } from './top-scorers';

describe('TopScorers', () => {
  let component: TopScorers;
  let fixture: ComponentFixture<TopScorers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopScorers],
    }).compileComponents();

    fixture = TestBed.createComponent(TopScorers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
