import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SubpageComponent } from './components/subpage/subpage.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { authGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'contractors', component: SubpageComponent },
      { path: 'drivers', component: SubpageComponent },
      { path: 'bookings', component: SubpageComponent },
      { path: 'payments', component: SubpageComponent },
      { path: 'settings', loadComponent: () => import('./components/settings/role-permission-setup/role-permission-setup.component').then(m => m.RolePermissionSetupComponent) },
      { path: 'settings/menus', component: SubpageComponent },
      { path: 'settings/permissions', loadComponent: () => import('./components/settings/role-permission-setup/role-permission-setup.component').then(m => m.RolePermissionSetupComponent) },
      { path: 'customers', loadComponent: () => import('./components/customers/customer-list/customer-list.component').then(m => m.CustomerListComponent) },
      { path: 'customers/:id', loadComponent: () => import('./components/customers/customer-profile/customer-profile.component').then(m => m.CustomerProfileComponent) },
      { path: 'owners', component: SubpageComponent },
      { path: 'vehicles', component: SubpageComponent },
      { path: 'operations', component: SubpageComponent },
      { path: 'support', component: SubpageComponent },
      { path: 'analytics', component: SubpageComponent },
      { path: 'marketing', component: SubpageComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
