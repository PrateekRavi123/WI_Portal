import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { ApiServiceService } from '../api/api-service.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl;
  constructor(private http: HttpClient, private router: Router, private apiService: ApiServiceService) {
    this.apiUrl = this.apiService.getDashboardEndpoint();
  }

  getAllCount(month: string): Observable<any> {
    const body = { month: month };
    return this.http.post<any>(`${this.apiUrl}/getcount`,body, {}).pipe(
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



  getAllCircle(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getcircle`, {}).pipe(
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

  getAllDivision(circle: string): Observable<any> {
    const body = { circle: circle };
    return this.http.post<any>(`${this.apiUrl}/getdivision`, body, {}).pipe(
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

  getchecklistdivcount(month: string): Observable<any> {
    const body = { month: month };
    return this.http.post<any>(`${this.apiUrl}/getchecklistdivcount`,body, {}).pipe(
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


  getchecklistcirclecount(month: string): Observable<any> {
    const body = { month: month };
    return this.http.post<any>(`${this.apiUrl}/getchecklistcirclecount`,body, {}).pipe(
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



}
