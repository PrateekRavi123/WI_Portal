import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { ApiServiceService } from '../api/api-service.service';
@Injectable({
  providedIn: 'root'
})
export class CheckpointService {
private apiUrl;
  constructor(private http: HttpClient, private router: Router, private apiService: ApiServiceService) {
        this.apiUrl = this.apiService.getCheckpointEndpoint();
      }

      getAllCheckpoint(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/getallcheckpoint`, {}).pipe(
          map((res) => {
            if (res && res.data) {
              return this.apiService.decryptData(res.data);
            }
            return res;
          }),
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
      
      getallcheckpointtype(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/getallcheckpointtype`, {}).pipe(
          map((res) => {
            if (res && res.data) {
              return this.apiService.decryptData(res.data);
            }
            return res;
          }),
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
      

      addcheckpoint(body:any): Observable<any> {
        return  this.http.post<any>(`${this.apiUrl}/addcheckpoint`,body, {}).pipe(
          map((res) => {
            if (res && res.data) {
              return this.apiService.decryptData(res.data);
            }
            return res;
          }),
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
          map((res) => {
            if (res && res.data) {
              return this.apiService.decryptData(res.data);
            }
            return res;
          }),
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

      deletecheckpoint(body: any): Observable<any> {
        return this.http.delete(`${this.apiUrl}/deletecheckpoint`, {
          body: body,
          responseType: 'text' as 'json'
        }).pipe(
          map((res: any) => {
            if (res) {
              const decrypted = this.apiService.decryptData(res);
              return JSON.parse(decrypted);
            }
            return res;
          }),
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
