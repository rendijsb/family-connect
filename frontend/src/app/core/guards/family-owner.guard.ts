import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FamilyService } from '../services/family/family.service';
import { FamilyMemberService } from '../services/family/family-member.service';
import { AuthService } from '../services/auth/auth.service';
import { map, take, switchMap, of } from 'rxjs';
import { FamilyRoleEnum } from '../../models/families/family.models';

export const familyOwnerGuard: CanActivateFn = (route, state) => {
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

      // Check if user is the owner of the current family
      return memberService.getCurrentUserMembership(family.id).pipe(
        map(membership => {
          if (membership && membership.role === FamilyRoleEnum.OWNER) {
            return true;
          } else {
            // User is not the owner
            router.navigate(['/family/unauthorized']);
            return false;
          }
        })
      );
    })
  );
};
