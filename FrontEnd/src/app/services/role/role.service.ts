import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ApiServiceService } from '../api/api-service.service';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl;
  constructor(private http: HttpClient, private router: Router, private apiService: ApiServiceService) {
        this.apiUrl = this.apiService.getRoleEndpoint();
      }

      getAllRole(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/getallrole`, {}).pipe(
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
