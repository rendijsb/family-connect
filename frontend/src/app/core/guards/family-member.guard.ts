import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FamilyService } from '../services/family/family.service';
import { FamilyMemberService } from '../services/family/family-member.service';
import { AuthService } from '../services/auth/auth.service';
import { map, take, switchMap, of } from 'rxjs';

export const familyMemberGuard: CanActivateFn = (route, state) => {
  const familyService = inject(FamilyService);
  const memberService = inject(FamilyMemberService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.user();
  if (!currentUser) {
    router.navigate(['/login']);
    return false;
  }

  return familyService.currentFamily$.pipe(
    take(1),
    switchMap(family => {
      if (!family) {
        router.navigate(['/family/welcome']);
        return of(false);
      }

      // Check if user is a member of the current family
      return memberService.getCurrentUserMembership(family.id).pipe(
        map(membership => {
          if (membership && membership.status === 'active') {
            return true;
          } else {
            // User is not a member or membership is inactive
            router.navigate(['/family/welcome']);
            return false;
          }
        })
      );
    })
  );
};
