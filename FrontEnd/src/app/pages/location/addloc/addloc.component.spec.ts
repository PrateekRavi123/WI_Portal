import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddlocComponent } from './addloc.component';

describe('AddlocComponent', () => {
  let component: AddlocComponent;
  let fixture: ComponentFixture<AddlocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddlocComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddlocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
