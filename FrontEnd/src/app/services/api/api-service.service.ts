import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class ApiServiceService {

  
  //private readonly baseUrl: string = 'http://10.125.214.94:1245/bywipapi/api'; //localhost
  //private readonly baseUrl: string = 'https://bypltest1.bsesdelhi.com/bywipapi/api';//test
  private readonly baseUrl: string = 'https://byplws1.bsesdelhi.com/bywipapi/api'; //live


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

  getOfficetypeEndpoint(): string {
    return `${this.baseUrl}/officetype`;
  }

  getreportsEndpoint(): string {
    return `${this.baseUrl}/reports`;
  }


}
