import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { RoleEnum } from '../../models/users/user.models';

export const roleGuard = (allowedRoles: RoleEnum[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.user();

    if (user && allowedRoles.includes(user.role)) {
      return true;
    } else {
      router.navigate(['/unauthorized']);
      return false;
    }
  };
};
