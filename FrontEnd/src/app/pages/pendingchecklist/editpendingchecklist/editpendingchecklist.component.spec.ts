import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditpendingchecklistComponent } from './editpendingchecklist.component';

describe('EditpendingchecklistComponent', () => {
  let component: EditpendingchecklistComponent;
  let fixture: ComponentFixture<EditpendingchecklistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditpendingchecklistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditpendingchecklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
