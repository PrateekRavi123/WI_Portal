import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ApiServiceService } from '../api/api-service.service';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InchargesService {

  private apiUrl;
  constructor(private http: HttpClient, private router: Router, private apiService: ApiServiceService) {
    this.apiUrl = this.apiService.getInchargesEndpoint();
  }

  getIncharge(emp_code: string): Observable<any> {
    const body = {emp_code:emp_code};
    return this.http.post<any>(`${this.apiUrl}/getincharge`,body,{}).pipe(
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


  getAllIncharge(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getallincharges`, {}).pipe(
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

  addincharge(body: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/addincharge`, body, {}).pipe(
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

  updateincharge(body: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/updateincharge`, body, {}).pipe(
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

  deleteincharge(body: any): Observable<any> {
    return this.http.delete(`${this.apiUrl}/deleteincharge`, {
      body: body,
      responseType: 'text' as 'json'
    }).pipe(
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
