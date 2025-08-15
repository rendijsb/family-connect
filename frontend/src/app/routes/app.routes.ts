import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';
import { roleGuard } from '../core/guards/role.guard';
import { hasFamilyGuard } from '../core/guards/has-family.guard';
import { familyMemberGuard } from '../core/guards/family-member.guard';
import { familyOwnerGuard } from '../core/guards/family-owner.guard';
import { familyAdminGuard } from '../core/guards/family-admin.guard';
import { familyRoleGuard } from '../core/guards/family-role.guard';
import { RoleEnum } from '../models/users/user.models';
import { FamilyRoleEnum } from '../models/families/family.models';
import {familyActivityRoutes} from '../family-activity-routes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: (route) => {
      return '/login';
    },
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('../pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('../pages/register/register.page').then(m => m.RegisterPage)
  },
  // {
  //   path: 'forgot-password',
  //   loadComponent: () => import('./pages/forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage)
  // },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('../pages/dashboard/dashboard.page').then(m => m.DashboardPage)
  },

  // Main tabs with authentication
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadChildren: () => import('../tabs/tabs.routes').then(m => m.routes)
  },

  {
    path: 'family',
    canActivate: [authGuard],
    children: [
      {
        path: 'welcome',
        loadComponent: () => import('../pages/family/family-welcome/family-welcome.page').then(m => m.FamilyWelcomePage)
      },
      {
        path: 'create',
        loadComponent: () => import('../pages/family/family-create/family-create.page').then(m => m.FamilyCreatePage)
      },
      {
        path: 'join',
        loadComponent: () => import('../pages/family/join-family/join-family.page').then(m => m.JoinFamilyPage)
      },
      {
        path: 'join/:token',
        loadComponent: () => import('../pages/family/join-family/join-family.page').then(m => m.JoinFamilyPage)
      },
      ...familyActivityRoutes,
      {
        path: 'switch',
        canActivate: [familyMemberGuard],
        loadComponent: () => import('../pages/family/family-switch/family-switch.page').then(m => m.FamilySwitchPage)
      },
      {
        path: 'settings',
        canActivate: [familyAdminGuard],
        loadComponent: () => import('../pages/family/family-settings/family-settings.page').then(m => m.FamilySettingsPage)
      },
      {
        path: 'members',
        canActivate: [familyMemberGuard],
        loadComponent: () => import('../pages/family/family-members/family-members.page').then(m => m.FamilyMembersPage)
      },
      {
        path: 'members/:id',
        canActivate: [familyMemberGuard],
        loadComponent: () => import('../pages/family/member-profile/member-profile.page').then(m => m.MemberProfilePage)
      },
      {
        path: 'invite',
        canActivate: [familyRoleGuard([FamilyRoleEnum.OWNER, FamilyRoleEnum.ADMIN])],
        loadComponent: () => import('../pages/family/invite-member/invite-member.page').then(m => m.InviteMemberPage)
      },
      {
        path: 'invitations',
        canActivate: [familyMemberGuard],
        loadComponent: () => import('../pages/family/invitations/invitations.page').then(m => m.InvitationsPage)
      },
      {
        path: 'invitations/:id',
        canActivate: [familyMemberGuard],
        loadComponent: () => import('../pages/family/invitation-detail/invitation-detail.page').then(m => m.InvitationDetailPage)
      },
      {
        path: 'activities',
        canActivate: [familyMemberGuard],
        loadComponent: () => import('../pages/family/family-activities/family-activities.page').then(m => m.FamilyActivitiesPage)
      },
      {
        path: 'unauthorized',
        loadComponent: () => import('../pages/family/family-unauthorized/family-unauthorized.page').then(m => m.FamilyUnauthorizedPage)
      },
      {
        path: '',
        redirectTo: '/tabs/family',
        pathMatch: 'full'
      }
    ]
  },

  // Admin routes (commented out for now)
  // {
  //   path: 'admin',
  //   canActivate: [authGuard, roleGuard([RoleEnum.ADMIN, RoleEnum.MODERATOR])],
  //   loadChildren: () => import('./admin/admin.routes').then(m => m.routes)
  // },

  // Error pages
  // {
  //   path: 'unauthorized',
  //   loadComponent: () => import('./pages/unauthorized/unauthorized.page').then(m => m.UnauthorizedPage)
  // },
  // {
  //   path: 'not-found',
  //   loadComponent: () => import('./pages/not-found/not-found.page').then(m => m.NotFoundPage)
  // },

  { path: '**', redirectTo: '/not-found' }
];
