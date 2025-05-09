import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ApiServiceService } from '../api/api-service.service';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private apiUrl;
  constructor(private http: HttpClient, private router: Router, private apiService: ApiServiceService) {
        this.apiUrl = this.apiService.getLocationEndpoint();
      }

      getLocation(division: string): Observable<any> {
        const body = {div: division};
        return this.http.post<any>(`${this.apiUrl}/getlocation`,body, {}).pipe(
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

      getAllLocation(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/getalllocations`, {}).pipe(
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
      
      addlocation(body:any): Observable<any> {
        return  this.http.post<any>(`${this.apiUrl}/addlocation`,body, {}).pipe(
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

      updatelocation(body:any): Observable<any> {
        return  this.http.patch<any>(`${this.apiUrl}/updatelocation`,body, {}).pipe(
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

      deletelocation(body: any): Observable<any> {
        return this.http.delete(`${this.apiUrl}/deletelocation`, {
          body: body,
          responseType: 'text' as 'json' // important for decryption
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
