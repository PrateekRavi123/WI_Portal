import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditcheckptComponent } from './editcheckpt.component';

describe('EditcheckptComponent', () => {
  let component: EditcheckptComponent;
  let fixture: ComponentFixture<EditcheckptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditcheckptComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditcheckptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
