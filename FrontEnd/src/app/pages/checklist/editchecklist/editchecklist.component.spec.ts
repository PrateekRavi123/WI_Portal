import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditchecklistComponent } from './editchecklist.component';

describe('EditchecklistComponent', () => {
  let component: EditchecklistComponent;
  let fixture: ComponentFixture<EditchecklistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditchecklistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditchecklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
