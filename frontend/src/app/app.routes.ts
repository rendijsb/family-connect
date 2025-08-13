import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { RoleEnum } from './models/users/user.models';

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
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage)
  },
  {
    path: 'families',
    canActivate: [authGuard],
    loadChildren: () => import('./pages/families/families.routes').then(m => m.familyRoutes)
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadChildren: () => import('./tabs/tabs.routes').then(m => m.routes)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./pages/unauthorized/unauthorized.page').then(m => m.UnauthorizedPage)
  },
  {
    path: 'not-found',
    loadComponent: () => import('./pages/not-found/not-found.page').then(m => m.NotFoundPage)
  },
  // {
  //   path: 'admin',
  //   canActivate: [authGuard, roleGuard([RoleEnum.ADMIN, RoleEnum.MODERATOR])],
  //   loadChildren: () => import('./admin/admin.routes').then(m => m.routes)
  // },
  {
    path: '**',
    redirectTo: '/tabs/home'
  }
];
