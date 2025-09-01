import { Routes } from '@angular/router';
import { familyGuard, familyOwnerGuard, familyModeratorGuard } from '../../core/guards/family.guard';

export const familyRoutes: Routes = [
  {
    path: 'create',
    loadComponent: () => import('./create/family-create.page').then(m => m.FamilyCreatePage)
  },
  {
    path: ':slug',
    canActivate: [familyGuard],
    loadComponent: () => import('./detail/family-detail.page').then(m => m.FamilyDetailPage)
  },
];
