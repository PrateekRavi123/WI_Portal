import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { StorageService } from '../services/storage/storage.service';
import { PopupService } from '../services/popup/popup.service';

export const roleGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const storageService = inject(StorageService);
  const router = inject(Router);
  const popupService = inject(PopupService);

  const expectedRoles = route.data['roles'] as string[]; 
  const userRole = await storageService.getUserRole();  

  if (!userRole || !expectedRoles.includes(userRole)) {
    popupService.showPopup('error', 'Access denied.');
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
