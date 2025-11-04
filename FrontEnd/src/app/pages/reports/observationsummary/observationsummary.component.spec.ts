import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObservationsummaryComponent } from './observationsummary.component';

describe('ObservationsummaryComponent', () => {
  let component: ObservationsummaryComponent;
  let fixture: ComponentFixture<ObservationsummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObservationsummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObservationsummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
