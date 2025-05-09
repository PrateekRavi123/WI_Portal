import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { StorageService } from '../services/storage/storage.service';
import { PopupService } from '../services/popup/popup.service';

export const roleGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const storageService = inject(StorageService);
  const router = inject(Router);
  const popupService = inject(PopupService);

  const expectedRoles = route.data['roles'] as string[]; // e.g. ['R1', 'R2']
  const userRole = await storageService.getUserRole();   // From sessionStorage
  console.error('Session User Role: ',userRole);
  console.error('expectedRoles User Role: ',expectedRoles);

  if (!userRole || !expectedRoles.includes(userRole)) {
    popupService.showPopup('error', 'Access denied.');
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
