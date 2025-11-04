import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { StorageService } from '../services/storage/storage.service';
import { inject } from '@angular/core';
import { catchError, from, map, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { PopupService } from '../services/popup/popup.service';
import * as CryptoJS from 'crypto-js';

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

export function decryptData(encryptedData: string): any {
  if (!encryptedData) {
    console.error('No encrypted data provided!');
    return null;
  }

  try {
    const secretKey = '1234567890poiuytrewqasdfghjklmnb';
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      console.error('Invalid encrypted data format!');
      return encryptedData;
    }

    const [ivHex, encryptedHex] = parts;
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const encryptedWordArray = CryptoJS.enc.Hex.parse(encryptedHex);

    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: encryptedWordArray } as any,
      CryptoJS.enc.Utf8.parse(secretKey),
      { iv: iv }
    );

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedText) {
      console.error('Decryption returned empty string!');
      return null;
    }

    try {
      return JSON.parse(decryptedText);
    } catch (parseError) {
      console.warn('Decryption success but JSON parsing failed. Returning raw text.', decryptedText);
      return decryptedText;
    }
  } catch (error) {
    console.error('Decryption failed!', error);
    return null;
  }
}


export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);
  const router = inject(Router);
  const popupService = inject(PopupService);

  // return from(storageService.getToken()).pipe(
  //   switchMap(token => {

  //     // No token, proceed
  //     if (!token) {
  //       console.log('No token found, proceeding with original request:', req);
  //       return next(req);
  //     }

  //     // Check if token is expired locally
  //     if (isTokenExpired(token)) {
  //       console.log('Token expired locally, redirecting to login');
  //       storageService.clearStorage();
  //       router.navigate(['/login']);
  //       throw new Error('Token expired');
  //     }

  //     // Token valid, attach Authorization header
  //     const authReq = req.clone({
  //       setHeaders: {
  //         Authorization: `Bearer ${token}`,
  //         Accept: 'application/json'
  //       }
  //     });

  //     return next(authReq);
  //   }),
  //   catchError(error => {
  //     console.error('Interceptor caught error:', error);

  //     // If 401 or 403 error happens, logout and redirect
  //     if (error.status === 401 ) {
  //       console.log('Unauthorized or Forbidden - clearing storage and redirecting');
  //       popupservice.showPopup('error', 'Session expired or logged in elsewhere.')
  //       storageService.clearStorage();
  //       router.navigate(['/login']);
  //     }

  //     return throwError(() => error);
  //   })
  // );
  return from(storageService.getToken()).pipe(
    switchMap(token => {
      let authReq = req;

      if (token) {
        // if token expired, clear and redirect
        if (isTokenExpired(token)) {
          popupService.showPopup('error', 'Session expired. Please log in again.');
          storageService.clearStorage();
          router.navigate(['/login']);
          throw new Error('Token expired');
        }

        // attach token
        authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
          }
        });
      }

      return next(authReq);
    }),

    // Auto decrypt successful responses
    map(event => {
      if (event instanceof HttpResponse) {
        const body: any = event.body;

        if (body && typeof body === 'object' && 'data' in body) {
          try {
            const decrypted = decryptData(body.data);

            // 🔹 If decrypted is already an object, use it directly
            if (typeof decrypted === 'object') {
              return event.clone({ body: decrypted });
            }

            // 🔹 If decrypted is a string (and not empty), try to parse
            if (typeof decrypted === 'string' && decrypted.trim() !== '') {
              try {
                const parsed = JSON.parse(decrypted);
                return event.clone({ body: parsed });
              } catch {
                // Not JSON, just return raw decrypted string
                return event.clone({ body: decrypted });
              }
            }

            // 🔹 If decryption failed or returned null, fallback
            return event;
          } catch (e) {
            console.error('Decryption or parsing failed:', e);
            return event;
          }
        }
      }
      return event;
    }),

    // Handle all errors (decrypt + show popup)
    catchError((error: HttpErrorResponse) => {
      console.error('Global interceptor caught error:', error);

      let errorMsg = 'An unexpected error occurred.';

      try {
        const errBody: any = error.error;

        // 🔹 Case 1: Encrypted error from backend
        if (errBody && typeof errBody === 'object' && 'data' in errBody) {
          const decrypted = decryptData(errBody.data);

          if (typeof decrypted === 'string') {
            // Might already be raw message text
            try {
              const parsed = JSON.parse(decrypted);
              errorMsg = parsed.message || parsed.msg || decrypted;
            } catch {
              errorMsg = decrypted;
            }
          } else if (typeof decrypted === 'object') {
            errorMsg = decrypted.message || decrypted.msg || errorMsg;
          }
        }

        // 🔹 Case 2: Plain error (no encryption, direct message)
        else if (errBody && typeof errBody === 'object') {
          errorMsg = errBody.message || errBody.msg || errorMsg;
        }

        // 🔹 Case 3: Plain text error (string)
        else if (typeof errBody === 'string') {
          errorMsg = errBody;
        }

      } catch (e) {
        console.error('Error decrypting API error:', e);
      }

      // 🔹 Handle 401/403 globally
      if (error.status === 401 || error.status === 403) {
        popupService.showPopup('error', errorMsg || 'Session expired or unauthorized.');
        storageService.clearStorage();
        router.navigate(['/login']);
      } else {
        popupService.showPopup('error', errorMsg);
      }

      return throwError(() => error);
    })

  );
};
