import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { familyMemberGuard } from '../core/guards/family-member.guard';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then(m => m.HomePage)
      },
      {
        path: 'family',
        canActivate: [familyMemberGuard],
        loadComponent: () => import('./family/family.page').then(m => m.FamilyPage)
      },
      // {
      //   path: 'chat',
      //   canActivate: [familyMemberGuard],
      //   loadComponent: () => import('./chat/chat.page').then(m => m.ChatPage)
      // },
      // {
      //   path: 'photos',
      //   canActivate: [familyMemberGuard],
      //   loadComponent: () => import('./photos/photos.page').then(m => m.PhotosPage)
      // },
      // {
      //   path: 'profile',
      //   loadComponent: () => import('./profile/profile.page').then(m => m.ProfilePage)
      // },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  }
];
