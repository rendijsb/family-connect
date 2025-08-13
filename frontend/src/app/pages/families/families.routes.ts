import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const familyRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./family-list/family-list.page').then(m => m.FamilyListPage)
      },
      {
        path: 'create',
        loadComponent: () => import('./create-family/create-family.page').then(m => m.CreateFamilyPage)
      },
      {
        path: 'join/:code?',
        loadComponent: () => import('./join-family/join-family.page').then(m => m.JoinFamilyPage)
      },
      {
        path: ':id/dashboard',
        loadComponent: () => import('./family-dashboard/family-dashboard.page').then(m => m.FamilyDashboardPage)
      },
      {
        path: ':id/settings',
        loadComponent: () => import('./family-settings/family-settings.page').then(m => m.FamilySettingsPage)
      },
      {
        path: ':id/invite',
        loadComponent: () => import('./family-invite/family-invite.page').then(m => m.FamilyInvitePage)
      },
      {
        path: ':id/members',
        loadComponent: () => import('./family-members/family-members.page').then(m => m.FamilyMembersPage)
      },
      {
        path: ':id/members/:userId',
        loadComponent: () => import('./member-profile/member-profile.page').then(m => m.MemberProfilePage)
      }
    ]
  }
];
