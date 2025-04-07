import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickviewlocComponent } from './quickviewloc.component';

describe('QuickviewlocComponent', () => {
  let component: QuickviewlocComponent;
  let fixture: ComponentFixture<QuickviewlocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickviewlocComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickviewlocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
