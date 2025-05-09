import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  private config: any = {};

  constructor(private http: HttpClient) {}

  loadConfig(): Promise<void> {
    console.log('Trying to load config...');
    return this.http.get<any>('/assets/config.json')
      .toPromise()
      .then((config) => {
        this.config = config;
      })
      .catch((error) => {
        console.error('Error loading config:', error);
      });
  }
  

  get apiUrl(): string {
    return this.config.apiUrl;
  }

  get secretKey(): string {
    return this.config.secretKey;
  }
}