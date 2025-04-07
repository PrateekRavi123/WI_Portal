import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditlocComponent } from './editloc.component';

describe('EditlocComponent', () => {
  let component: EditlocComponent;
  let fixture: ComponentFixture<EditlocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditlocComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditlocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
