import { inject } from '@angular/core';
import { CanActivateFn , Router} from '@angular/router';
import { StorageService } from '../services/storage/storage.service';
import { PopupService } from '../services/popup/popup.service';


function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const decodedToken = parseJwt(token);
  if (!decodedToken) return true;

  const currentTime = Date.now() / 1000;
  return decodedToken.exp < currentTime;
}

export const authGuard: CanActivateFn = async (route, state) => {
  const storageService = inject(StorageService);
  const router = inject(Router);
  const popupservice = inject(PopupService);
  try {
    // Get and decrypt token
    const token = storageService.getToken();

    if (!token) {
      console.log('No token found, redirecting to login');
      router.navigate(['/login']);
      popupservice.showPopup('error', 'Session expired.');
      return false;
    }


    if (isTokenExpired((await token))) {
      console.log('Token expired, redirecting to login');
      await storageService.clearStorage();
      router.navigate(['/login']);
      popupservice.showPopup('error', 'Session expired.');
      return false;
    }

    // Token exists and is valid
    return true;

  } catch (error) {
    console.error('Auth guard error:', error);
    router.navigate(['/login']);
    return false;
  }
};
