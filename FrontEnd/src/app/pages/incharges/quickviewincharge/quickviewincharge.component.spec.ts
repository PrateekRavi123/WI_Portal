import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickviewinchargeComponent } from './quickviewincharge.component';

describe('QuickviewinchargeComponent', () => {
  let component: QuickviewinchargeComponent;
  let fixture: ComponentFixture<QuickviewinchargeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickviewinchargeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickviewinchargeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
