import { TestBed } from '@angular/core/testing';

import { InchargesService } from './incharges.service';

describe('InchargesService', () => {
  let service: InchargesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InchargesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
