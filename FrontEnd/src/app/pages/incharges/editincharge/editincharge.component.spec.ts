import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditinchargeComponent } from './editincharge.component';

describe('EditinchargeComponent', () => {
  let component: EditinchargeComponent;
  let fixture: ComponentFixture<EditinchargeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditinchargeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditinchargeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
