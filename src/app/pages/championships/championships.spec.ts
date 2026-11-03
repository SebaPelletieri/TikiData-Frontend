import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Championships } from './championships';

describe('Championships', () => {
  let component: Championships;
  let fixture: ComponentFixture<Championships>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Championships],
    }).compileComponents();

    fixture = TestBed.createComponent(Championships);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
