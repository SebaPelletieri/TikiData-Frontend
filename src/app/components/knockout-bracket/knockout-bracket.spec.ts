import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KnockoutBracket } from './knockout-bracket';

describe('KnockoutBracket', () => {
  let component: KnockoutBracket;
  let fixture: ComponentFixture<KnockoutBracket>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KnockoutBracket],
    }).compileComponents();

    fixture = TestBed.createComponent(KnockoutBracket);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
