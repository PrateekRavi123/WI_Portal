import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickviewcheckptComponent } from './quickviewcheckpt.component';

describe('QuickviewcheckptComponent', () => {
  let component: QuickviewcheckptComponent;
  let fixture: ComponentFixture<QuickviewcheckptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickviewcheckptComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickviewcheckptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
