
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

  // sendOTP(SMS: string, mob_no: string): Promise<number> {
  //   const body = { SMS: SMS, cnt_no: mob_no };
  //   return this.http.post<any>(this.apiUrl + '/sendOTP', body, { observe: 'response' })
  //     .toPromise()
  //     .then(res => {
  //       if (res && res.status) {
  //         console.log('Response status:', res.status);
  //         console.log('Body:', res.body);
  //         return res.status;
  //       } else {
  //         throw new Error('Response is undefined or does not contain status');
  //       }
  //     })
  //     .catch(error => {
  //       if (error.status === 400) {
  //         return error.status;
  //       } else {
  //         console.error('Error occurred:', error);
  //         throw error;
  //       }
  //     });
  // }
  sendOTP(body: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/sendOTP`, body, {}).pipe(
      map((res) => res),
      catchError(error => {
        if (error.status === 400) {
          return of(error.status);
        } else {
          console.error('Error occurred:', error);
          return throwError(() => error);
        }
      })
    );
  }

  validateOtp(body: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/validateOTP`, body, {}).pipe(
      map((res) => res),
      catchError(error => {
        if (error.status === 400) {
          return of(error.status);
        } else {
          console.error('Error occurred:', error);
          return throwError(() => error);
        }
      })
    );
  }


  // validateOtp(cnt_no: string, val: string): Promise<any> {
  //   const body = { cnt_no: cnt_no, val: val };
  //   return this.http.post<any>(this.apiUrl + '/validateOTP', body, { observe: 'response' })
  //     .toPromise()
  //     .then(res => {
  //       if (res && res.status) {
  //         console.log('Response status:', res.status);
  //         console.log('Body:', res.body);
  //         return res;
  //       } else {
  //         throw new Error('Response is undefined or does not contain status');
  //       }
  //     })
  //     .catch(error => {
  //       if (error.status === 400) {
  //         return error.status;
  //       } else {
  //         console.error('Error occurred:', error);
  //         throw error;
  //       }
  //     });
  // }
}
