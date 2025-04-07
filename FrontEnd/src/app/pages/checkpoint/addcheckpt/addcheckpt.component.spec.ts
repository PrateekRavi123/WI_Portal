import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddcheckptComponent } from './addcheckpt.component';

describe('AddcheckptComponent', () => {
  let component: AddcheckptComponent;
  let fixture: ComponentFixture<AddcheckptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddcheckptComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddcheckptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
