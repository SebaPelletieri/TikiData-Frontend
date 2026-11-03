import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StadiumCard } from './stadium-card';

describe('StadiumCard', () => {
  let component: StadiumCard;
  let fixture: ComponentFixture<StadiumCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StadiumCard],
    }).compileComponents();

    fixture = TestBed.createComponent(StadiumCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
