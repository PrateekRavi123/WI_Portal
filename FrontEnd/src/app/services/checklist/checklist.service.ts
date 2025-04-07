import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { ApiServiceService } from '../api/api-service.service';

@Injectable({
  providedIn: 'root'
})
export class ChecklistService {
private apiUrl;
  constructor(private http: HttpClient, private router: Router, private apiService: ApiServiceService) {
        this.apiUrl = this.apiService.getChecklistEndpoint();
      }

      getchecklist(body: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/getchecklist`,body, {}).pipe(
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

      getchecklistcheckpoint(body: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/getchecklistcheckpoint`,body, {}).pipe(
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

      getAllChecklist(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/getallchecklists`, {}).pipe(
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
      getmyAllChecklist(body: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/getmyAllChecklist`,body, {}).pipe(
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
      getpendingchecklistcheckpoint(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/getpendingchecklistcheckpoint`, {}).pipe(
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
      getmypendingchecklistcheckpoint(body: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/getmypendingchecklistcheckpoint`,body, {}).pipe(
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
      getrolependingchecklistcheckpoint(body: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/getrolependingchecklistcheckpoint`,body, {}).pipe(
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
      
      addchecklist(body:any): Observable<any> {
        return  this.http.post<any>(`${this.apiUrl}/addchecklist`,body, {}).pipe(
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

      updatecheckpoint(body:any): Observable<any> {
        return  this.http.patch<any>(`${this.apiUrl}/updatecheckpoint`,body, {}).pipe(
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

      deletechecklist(body: any): Observable<any> {
        console.log('body', body);
        return this.http.delete(`${this.apiUrl}/deletechecklist`, {
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
