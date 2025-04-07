import { HttpInterceptorFn } from '@angular/common/http';
import { StorageService } from '../services/storage/storage.service';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { Router } from '@angular/router';

// Helper function to decode JWT token
function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

// Helper function to check if token is expired
function isTokenExpired(token: string): boolean {
  const decodedToken = parseJwt(token);
  if (!decodedToken) return true;

  const currentTime = Date.now() / 1000;
  return decodedToken.exp < currentTime;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);
  const router = inject(Router);

  return from(storageService.getToken()).pipe(
    switchMap(token => {
      // If no token, proceed with original request
      console.log(token)
      if (!token) {
        console.log("No token found, proceeding with original request:", req);
        return next(req);
      }

      // Check if token is expired
      if (isTokenExpired(token)) {
        console.log("Token expired, redirecting to login");
        storageService.clearStorage();
        router.navigate(['/login']);
        throw new Error('Token expired');
      }

      // Token is valid, proceed with modified request
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });
      console.log("Token valid, proceeding with modified request:", authReq);
      return next(authReq);
    })
  );
};
