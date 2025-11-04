import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotsubmittedchecklistComponent } from './notsubmittedchecklist.component';

describe('NotsubmittedchecklistComponent', () => {
  let component: NotsubmittedchecklistComponent;
  let fixture: ComponentFixture<NotsubmittedchecklistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotsubmittedchecklistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotsubmittedchecklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
