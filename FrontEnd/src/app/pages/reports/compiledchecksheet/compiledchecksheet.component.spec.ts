import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompiledchecksheetComponent } from './compiledchecksheet.component';

describe('CompiledchecksheetComponent', () => {
  let component: CompiledchecksheetComponent;
  let fixture: ComponentFixture<CompiledchecksheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompiledchecksheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompiledchecksheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
