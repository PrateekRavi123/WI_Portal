import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ApiServiceService } from '../api/api-service.service';
import { catchError, map, Observable, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  private apiUrl;
    constructor(private http: HttpClient, private router: Router, private apiService: ApiServiceService) {
      this.apiUrl = this.apiService.getreportsEndpoint();
    }

  // getnotsubmittedchecklist(month: string): Observable<any> {
  //   const body = { month: month };
  //   return this.http.post<any>(`${this.apiUrl}/getnotsubmittedchecklist`,body, {}).pipe(
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
getnotsubmittedchecklist(month: string): Observable<any> {
    const body = { month: month };
    return this.http.post<any>(`${this.apiUrl}/getnotsubmittedchecklist`,body);
  }

  // getobservationsummaryData(month: string): Observable<any> {
  //   const body = { month: month };
  //   return this.http.post<any>(`${this.apiUrl}/observationsummary`,body, {}).pipe(
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
  getobservationsummaryData(month: string): Observable<any> {
    const body = { month: month };
    return this.http.post<any>(`${this.apiUrl}/observationsummary`,body);
  }

  // getcompiledchecksheet(month: string): Observable<any> {
  //   const body = { month: month };
  //   return this.http.post<any>(`${this.apiUrl}/getcompiledchecksheet`,body, {}).pipe(
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
  getcompiledchecksheet(month: string): Observable<any> {
    const body = { month: month };
    return this.http.post<any>(`${this.apiUrl}/getcompiledchecksheet`,body);
  }

 
}
