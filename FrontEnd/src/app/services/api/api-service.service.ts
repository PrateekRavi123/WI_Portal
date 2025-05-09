import { Injectable } from '@angular/core';
import { ConfigService } from '../config/config.service';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class ApiServiceService {

 // private readonly baseUrl: string = 'http://10.125.214.75:1245/api'; //localhost
  //private readonly baseUrl: string = 'https://10.125.75.180:8120/api';//test
  //private  baseUrl: string = 'https://bypltest1.bsesdelhi.com:8120/api';//test
  private baseUrl: string = "";
  constructor(private configService: ConfigService) {
    this.getBaseUrl();
  }

  getBaseUrl(): string {
    this.baseUrl = this.configService.apiUrl;
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

  getOfficetypeEndpoint(): string {
    return `${this.baseUrl}/officetype`;
  }

  decryptData(encryptedData: string): any {
    if (!encryptedData) {
      console.error('No encrypted data provided!');
      return null;
    }
  
    try {
      const secretKey = this.configService.secretKey;
      const parts = encryptedData.split(':');
      if (parts.length !== 2) {
        console.error('Invalid encrypted data format!');
        return encryptedData; // or null
      }
  
      const [ivHex, encryptedHex] = parts;
      const iv = CryptoJS.enc.Hex.parse(ivHex);
      const encryptedWordArray = CryptoJS.enc.Hex.parse(encryptedHex);
  
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: encryptedWordArray } as any,
        CryptoJS.enc.Utf8.parse(secretKey),
        { iv: iv }
      );
  
      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
  
      if (!decryptedText) {
        console.error('Decryption returned empty string!');
        return null;
      }
  
      try {
        return JSON.parse(decryptedText);
      } catch (parseError) {
        console.warn('Decryption success but JSON parsing failed. Returning raw text.', decryptedText);
        return decryptedText;
      }
    } catch (error) {
      console.error('Decryption failed!', error);
      return null;
    }
  }
  
}
