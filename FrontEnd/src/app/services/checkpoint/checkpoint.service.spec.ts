import { TestBed } from '@angular/core/testing';

import { CheckpointService } from './checkpoint.service';

describe('CheckpointService', () => {
  let service: CheckpointService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CheckpointService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
