import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiServiceService {

  private readonly baseUrl: string = 'https://10.125.214.75:1245/api'; //localhost
  //private readonly baseUrl: string = 'http://10.125.75.180:8120/api';//test

  constructor() {}

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getSMSEndpoint(): string{
    return `${this.baseUrl}/sendSMS`;
  }
  
  getInchargesEndpoint(): string {
    return `${this.baseUrl}/incharges`;
  }

  getLocationEndpoint(): string {
    return `${this.baseUrl}/location`;
  }

  getCheckpointEndpoint(): string {
    return `${this.baseUrl}/checkpoint`;
  }

  getChecklistEndpoint(): string {
    return `${this.baseUrl}/checklist`;
  }

  getDashboardEndpoint(): string {
    return `${this.baseUrl}/common`;
  }

  getRoleEndpoint(): string {
    return `${this.baseUrl}/role`;
  }
}
