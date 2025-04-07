import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingchecklistComponent } from './pendingchecklist.component';

describe('PendingchecklistComponent', () => {
  let component: PendingchecklistComponent;
  let fixture: ComponentFixture<PendingchecklistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingchecklistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingchecklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
