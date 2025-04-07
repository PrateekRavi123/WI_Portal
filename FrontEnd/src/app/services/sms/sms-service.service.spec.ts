import { TestBed } from '@angular/core/testing';

import { SmsServiceService } from './sms-service.service';

describe('SmsServiceService', () => {
  let service: SmsServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SmsServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
