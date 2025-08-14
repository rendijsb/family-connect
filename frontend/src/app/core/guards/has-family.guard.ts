import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FamilyService } from '../services/family/family.service';
import { map, take } from 'rxjs';

export const hasFamilyGuard: CanActivateFn = (route, state) => {
  const familyService = inject(FamilyService);
  const router = inject(Router);

  return familyService.currentFamily$.pipe(
    take(1),
    map(family => {
      if (family) {
        return true;
      } else {
        // Redirect to family selection or creation page
        router.navigate(['/family/welcome']);
        return false;
      }
    })
  );
};

