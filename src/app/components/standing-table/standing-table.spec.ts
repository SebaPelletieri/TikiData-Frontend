import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StandingTable } from './standing-table';

describe('StandingTable', () => {
  let component: StandingTable;
  let fixture: ComponentFixture<StandingTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StandingTable],
    }).compileComponents();

    fixture = TestBed.createComponent(StandingTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
