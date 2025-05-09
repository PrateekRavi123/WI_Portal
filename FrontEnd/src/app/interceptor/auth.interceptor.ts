import { HttpInterceptorFn } from '@angular/common/http';
import { StorageService } from '../services/storage/storage.service';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { PopupService } from '../services/popup/popup.service';

// Helper function to decode JWT token
function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

// Helper function to check if token is expired
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    const now = Math.floor(Date.now() / 1000);
    return exp < now;
  } catch (e) {
    console.error('Invalid token format');
    return true;
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);
  const router = inject(Router);
  const popupservice = inject(PopupService);

  return from(storageService.getToken()).pipe(
    switchMap(token => {

      // No token, proceed
      if (!token) {
        console.log('No token found, proceeding with original request:', req);
        return next(req);
      }

      // Check if token is expired locally
      if (isTokenExpired(token)) {
        console.log('Token expired locally, redirecting to login');
        storageService.clearStorage();
        router.navigate(['/login']);
        throw new Error('Token expired');
      }

      // Token valid, attach Authorization header
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });

      return next(authReq);
    }),
    catchError(error => {
      console.error('Interceptor caught error:', error);

      // If 401 or 403 error happens, logout and redirect
      if (error.status === 401 ) {
        console.log('Unauthorized or Forbidden - clearing storage and redirecting');
        popupservice.showPopup('error', 'Session expired or logged in elsewhere.')
        storageService.clearStorage();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
