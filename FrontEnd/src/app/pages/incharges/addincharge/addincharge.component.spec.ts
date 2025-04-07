import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddinchargeComponent } from './addincharge.component';

describe('AddinchargeComponent', () => {
  let component: AddinchargeComponent;
  let fixture: ComponentFixture<AddinchargeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddinchargeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddinchargeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
