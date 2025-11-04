
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { ApiServiceService } from '../api/api-service.service';
import { HttpClient } from '@angular/common/http';
import { response } from 'express';

@Injectable({
  providedIn: 'root'
})
export class SmsServiceService {
  private apiUrl;
  constructor(private http: HttpClient, private router: Router, private apiService: ApiServiceService) {
    this.apiUrl = this.apiService.getSMSEndpoint();
  }

 
  // sendOTP(body: any): Observable<any> {
  //   return this.http.post<any>(`${this.apiUrl}/sendOTP`, body, {}).pipe(
  //     map((res) => {
  //       if (res && res.data) {
  //         return this.apiService.decryptData(res.data);
  //       }
  //       return res;
  //     }),
  //     catchError(error => {
  //       if (error.status === 400) {
  //         return of(error.status);
  //       } else {
  //         console.error('Error occurred:', error);
  //         return throwError(() => error);
  //       }
  //     })
  //   );
  // }
  sendOTP(body: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/sendOTP`, body);
  }

  // validateOtp(body: any): Observable<any> {
  //   return this.http.post<any>(`${this.apiUrl}/validateOTP`, body, {}).pipe(
  //     map((res) => {
  //       if (res && res.data) {
  //         return this.apiService.decryptData(res.data);
  //       }
  //       return res;
  //     }),
  //     catchError(error => {
  //       if (error.status === 400) {
  //         return of(error.status);
  //       } else {
  //         console.error('Error occurred:', error);
  //         return throwError(() => error);
  //       }
  //     })
  //   );
  // }
  validateOtp(body: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/validateOTP`, body);
  }


}
