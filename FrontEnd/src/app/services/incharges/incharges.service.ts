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

  // getIncharge(emp_code: string, mob_no: string): Observable<any> {
  //   const body = {id:emp_code,cnt_no:mob_no};
  //   return this.http.post<any>(`${this.apiUrl}/getincharge`,body,{}).pipe(
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
  getIncharge(emp_code: string, mob_no: string): Observable<any> {
    const body = {id:emp_code,cnt_no:mob_no};
    return this.http.post<any>(`${this.apiUrl}/getincharge`,body);
  }


  // getAllIncharge(): Observable<any> {
  //   return this.http.get<any>(`${this.apiUrl}/getallincharges`, {}).pipe(
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
  getAllIncharge(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getallincharges`);
  }

  // addincharge(body: any): Observable<any> {
  //   return this.http.post<any>(`${this.apiUrl}/addincharge`, body, {}).pipe(
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
  addincharge(body: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/addincharge`, body);
  }

  // updateincharge(body: any): Observable<any> {
  //   return this.http.patch<any>(`${this.apiUrl}/updateincharge`, body, {}).pipe(
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
  updateincharge(body: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/updateincharge`, body);
  }

  // updateprofileincharge(body: any): Observable<any> {
  //   return this.http.patch<any>(`${this.apiUrl}/updateprofileincharge`, body, {}).pipe(
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
  updateprofileincharge(body: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/updateprofileincharge`, body);
  }

  // deleteincharge(body: any): Observable<any> {
  //   return this.http.delete(`${this.apiUrl}/deleteincharge`, {
  //     body: body,
  //     responseType: 'text' as 'json'
  //   }).pipe(
  //     map((res: any) => {
  //       if (res) {
  //         const decrypted = this.apiService.decryptData(res);
  //         return JSON.parse(decrypted);
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
  deleteincharge(body: any): Observable<any> {
    return this.http.delete(`${this.apiUrl}/deleteincharge`, body);
  }
}
