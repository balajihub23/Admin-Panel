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
  { path: 'service-error', loadComponent: () => import('./components/service-error/service-error.component').then(m => m.ServiceErrorComponent) },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'partners', loadComponent: () => import('./components/partners/partner-list/partner-list.component').then(m => m.PartnerListComponent) },
      { path: 'contractors', loadComponent: () => import('./components/partners/partner-list/partner-list.component').then(m => m.PartnerListComponent) },
      { path: 'contractors/:id', loadComponent: () => import('./components/contractors/contractor-profile/contractor-profile.component').then(m => m.ContractorProfileComponent) },
      { path: 'drivers', loadComponent: () => import('./components/partners/partner-list/partner-list.component').then(m => m.PartnerListComponent) },
      { path: 'drivers/:id', loadComponent: () => import('./components/drivers/driver-profile/driver-profile.component').then(m => m.DriverProfileComponent) },
      { path: 'products', loadComponent: () => import('./components/products/product-list/product-list.component').then(m => m.ProductListComponent) },
      { path: 'pricing', loadComponent: () => import('./components/pricing/pricing-list/pricing-list.component').then(m => m.PricingListComponent) },
      { path: 'bookings/new', loadComponent: () => import('./components/bookings/booking-flow/booking-flow.component').then(m => m.BookingFlowComponent) },
      { path: 'bookings', loadComponent: () => import('./components/bookings/booking-list/booking-list.component').then(m => m.BookingListComponent) },
      { path: 'payments', loadComponent: () => import('./components/payments/payment-list/payment-list.component').then(m => m.PaymentListComponent) },
      { path: 'payouts', loadComponent: () => import('./components/payouts/payout-list/payout-list.component').then(m => m.PayoutListComponent) },
      // { path: 'settings', loadComponent: () => import('./components/settings/role-permission-setup/role-permission-setup.component').then(m => m.RolePermissionSetupComponent) },
      { path: 'settings', loadComponent: () => import('./components/settings/booking-setting/booking-setting.component').then(m => m.BookingSettingComponent) },
      { path: 'settings/menus', loadComponent: () => import('./components/settings/menu-list/menu-list.component').then(m => m.MenuListComponent) },
      { path: 'settings/permissions', loadComponent: () => import('./components/settings/role-permission-setup/role-permission-setup.component').then(m => m.RolePermissionSetupComponent) },
      { path: 'customers', loadComponent: () => import('./components/customers/customer-list/customer-list.component').then(m => m.CustomerListComponent) },
      { path: 'customers/:id', loadComponent: () => import('./components/customers/customer-profile/customer-profile.component').then(m => m.CustomerProfileComponent) },
      { path: 'owners', component: SubpageComponent },
      { path: 'vehicles', component: SubpageComponent },
      { path: 'operations', component: SubpageComponent },
      { path: 'support', loadComponent: () => import('./components/support/support-list/support-list.component').then(m => m.SupportListComponent) },
      { path: 'analytics', component: SubpageComponent },
      { path: 'marketing', component: SubpageComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
