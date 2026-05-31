import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SubpageComponent } from './components/subpage/subpage.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'contractors', component: SubpageComponent },
      { path: 'drivers', component: SubpageComponent },
      { path: 'bookings', component: SubpageComponent },
      { path: 'payments', component: SubpageComponent },
      { path: 'settings', component: SubpageComponent },
      { path: 'settings/menus', component: SubpageComponent },
      { path: 'settings/permissions', component: SubpageComponent },
      { path: 'customers', component: SubpageComponent },
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
