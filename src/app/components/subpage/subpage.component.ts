import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

interface SubpageData {
  title: string;
  subtitle: string;
  metric1: { label: string; value: string; trend: string; type: string };
  metric2: { label: string; value: string; trend: string; type: string };
  metric3: { label: string; value: string; trend: string; type: string };
  headers: string[];
  rows: any[];
}

@Component({
  selector: 'app-subpage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subpage.component.html',
  styleUrl: './subpage.component.scss'
})
export class SubpageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  sectionKey: string = '';
  pageData!: SubpageData;

  // Search input binding mock
  searchTerm: string = '';

  ngOnInit() {
    // Listen to route changes to update dynamic placeholder grids
    this.route.url.subscribe(() => {
      const path = this.router.url.split('/').pop() || 'dashboard';
      this.sectionKey = path.toLowerCase();
      this.loadSectionData(this.sectionKey);
    });
  }

  private loadSectionData(key: string) {
    const rawTitle = key.charAt(0).toUpperCase() + key.slice(1);
    
    // Generate high-fidelity mock data depending on the subpage selected
    switch(key) {
      case 'customers':
        this.pageData = {
          title: 'Customers Directory',
          subtitle: 'Manage rentron platform registered clients, contractor accounts and corporate bookings.',
          metric1: { label: 'Total Clients', value: '14,820', trend: '+14.2% MoM', type: 'blue' },
          metric2: { label: 'Active Renters', value: '3,489', trend: '+8.3%', type: 'green' },
          metric3: { label: 'Support Inquiries', value: '18 Pending', trend: '-2.4%', type: 'warning' },
          headers: ['Client Name', 'Email Address', 'Phone Number', 'Verification Status', 'Total Bookings', 'Account Balance'],
          rows: [
            { col1: 'Amit Kumar Sharma', col2: 'amit.sharma@gmail.com', col3: '+91 98450 12345', col4: 'Verified', col5: '34 bookings', col6: '₹12,450', badge: 'success' },
            { col1: 'Priya Narayanan', col2: 'priya.n@outlook.com', col3: '+91 97321 98765', col4: 'Verified', col5: '18 bookings', col6: '₹0.00', badge: 'success' },
            { col1: 'Vikas Earthmovers Ltd.', col2: 'contact@vikasearth.co.in', col3: '+91 80 4321 5566', col4: 'VIP', col5: '142 bookings', col6: '₹84,500', badge: 'blue' },
            { col1: 'Deepak Patel', col2: 'deepak.patel99@gmail.com', col3: '+91 91234 56789', col4: 'Pending Email', col5: '1 booking', col6: '₹4,500', badge: 'warning' },
            { col1: 'Karan Malhotra', col2: 'karan.m@gmail.com', col3: '+91 98860 11223', col4: 'Verified', col5: '12 bookings', col6: '₹1,200', badge: 'success' }
          ]
        };
        break;
      case 'contractors':
        this.pageData = {
          title: 'Contractor Management',
          subtitle: 'Oversee and assign fleet operational scopes to authorized regional suppliers.',
          metric1: { label: 'Registered Contractors', value: '42 Active', trend: '+2 new this week', type: 'blue' },
          metric2: { label: 'Fleet Subleased', value: '312 Machines', trend: '+12.5%', type: 'purple' },
          metric3: { label: 'Contractor Revenue', value: '₹48.3L', trend: '+18.1% MoM', type: 'warning' },
          headers: ['Contractor Agency', 'Primary Liaison', 'Region Area', 'Active Fleet Size', 'Monthly Payout', 'Compliance Status'],
          rows: [
            { col1: 'Siddharth Infra Projects', col2: 'Siddharth Rao', col3: 'Bengaluru East', col4: '28 Machines', col5: '₹8,45,000', col6: 'Compliant', badge: 'success' },
            { col1: 'Balaji Earthworks Inc.', col2: 'M. Balaji', col3: 'Chennai Metro', col4: '45 Machines', col5: '₹14,20,000', col6: 'Compliant', badge: 'success' },
            { col1: 'Kalyani Tech Builders', col2: 'Rajesh Kalyani', col3: 'Pune Outer', col4: '18 Machines', col5: '₹5,10,000', col6: 'Auditing', badge: 'warning' },
            { col1: 'Ganga Heavy Machinery Co.', col2: 'Harish Singh', col3: 'Kolkata Port', col4: '14 Machines', col5: '₹3,90,000', col6: 'Compliant', badge: 'success' },
            { col1: 'Deccan Excavation Group', col2: 'Suresh Reddy', col3: 'Hyderabad North', col4: '32 Machines', col5: '₹9,80,000', col6: 'Suspended', badge: 'danger' }
          ]
        };
        break;
      case 'drivers':
        this.pageData = {
          title: 'Driver Approvals & Database',
          subtitle: 'Verify licensing documents, authorize field operators, and monitor driver statuses.',
          metric1: { label: 'Active Drivers', value: '89 Online', trend: '+5.2%', type: 'green' },
          metric2: { label: 'Approval Pending', value: '14 Reviews', trend: 'High urgency', type: 'warning' },
          metric3: { label: 'Average Driver Rating', value: '4.85 / 5', trend: 'Excellent', type: 'blue' },
          headers: ['Driver Name', 'License Number', 'Assigned Contractor', 'Machine Type', 'Phone Contact', 'Verification State'],
          rows: [
            { col1: 'David Driver', col2: 'DL-14202300489', col3: 'Siddharth Infra', col4: 'JCB 3DX Eco', col5: '+91 98765 43212', col6: 'Approved & Active', badge: 'success' },
            { col1: 'Ramesh Gowda', col2: 'DL-09201948512', col3: 'Balaji Earthworks', col4: 'Excavator EX200', col5: '+91 94480 99887', col6: 'Approved & Active', badge: 'success' },
            { col1: 'Sandeep Kumar', col2: 'DL-11202248596', col3: 'Independent Vendor', col4: 'Tipper Heavy', col5: '+91 81234 98765', col6: 'Pending Documents', badge: 'warning' },
            { col1: 'Manpreet Singh', col2: 'DL-01202100485', col3: 'Kalyani Tech Builders', col4: 'Loader L30', col5: '+91 99988 77665', col6: 'Approved & Active', badge: 'success' },
            { col1: 'Siddharth Pillai', col2: 'DL-07202484910', col3: 'Deccan Excavation', col4: 'JCB 4DX Heavy', col5: '+91 95400 11223', col6: 'Background Checked', badge: 'blue' }
          ]
        };
        break;
      case 'bookings':
        this.pageData = {
          title: 'Live Booking Monitor',
          subtitle: 'Track active, completed, and pending fleet rental transactions in real-time.',
          metric1: { label: 'Total Rental Orders', value: '1,234 Total', trend: '+12.5% MoM', type: 'blue' },
          metric2: { label: 'Active Rentals Now', value: '56 In-Progress', trend: 'Peak demand', type: 'green' },
          metric3: { label: 'Average Rental Duration', value: '4.6 Days', trend: '+0.8 days avg', type: 'purple' },
          headers: ['Booking ID', 'Equipment Unit', 'Contracted Client', 'Shift Details', 'Location Coordinates', 'Dispatch Status'],
          rows: [
            { col1: '#BK-8490', col2: 'JCB 3DX Super (Yellow)', col3: 'Vikas Earthmovers Ltd.', col4: 'Day Shift (12 hrs)', col5: 'Indiranagar Metro, BLR', col6: 'Dispatched & Operating', badge: 'success' },
            { col1: '#BK-8489', col2: 'Tata Hitachi EX200', col3: 'Amit Kumar Sharma', col4: 'Full Week Rental', col5: 'Chennai Port Trust, MAA', col6: 'Mobilizing Equipment', badge: 'blue' },
            { col1: '#BK-8488', col2: 'Volvo Heavy Tipper 25T', col3: 'Siddharth Infra Projects', col4: 'Night Shift (8 hrs)', col5: 'Hinjewadi Phase 3, PNQ', col6: 'Completed Successfully', badge: 'success' },
            { col1: '#BK-8487', col2: 'CAT Wheel Loader 920', col3: 'Karan Malhotra', col4: '3-Day Dispatch', col5: 'Whitefield IT Park, BLR', col6: 'Awaiting Driver Match', badge: 'warning' },
            { col1: '#BK-8486', col2: 'JCB 3DX Eco (Yellow)', col3: 'Deepak Patel', col4: 'Day Shift (10 hrs)', col5: 'Secunderabad Yard, HYD', col6: 'Cancelled by Operator', badge: 'danger' }
          ]
        };
        break;
      case 'payments':
        this.pageData = {
          title: 'Earnings & Payments Gateway',
          subtitle: 'Audit client billing statements, process vendor disbursements, and track total net revenue.',
          metric1: { label: 'Gross Revenue', value: '₹12.50L', trend: '+18.3% MoM', type: 'warning' },
          metric2: { label: 'Vendor Payouts', value: '₹9.40L', trend: '75.2% payout ratio', type: 'purple' },
          metric3: { label: 'Pending Settlement', value: '₹48,250', trend: 'Settles in 24 hrs', type: 'blue' },
          headers: ['Transaction ID', 'Associated Booking', 'Billing Account', 'Amount Charged', 'Gateway Ref', 'Payment Status'],
          rows: [
            { col1: 'TXN-90248', col2: '#BK-8490', col3: 'Vikas Earthmovers Ltd.', col4: '₹45,000', col5: 'pay_RAZ8401824', col6: 'Settled & Released', badge: 'success' },
            { col1: 'TXN-90247', col2: '#BK-8489', col3: 'Amit Kumar Sharma', col4: '₹18,500', col5: 'pay_RAZ8401799', col6: 'Settled & Released', badge: 'success' },
            { col1: 'TXN-90246', col2: '#BK-8488', col3: 'Siddharth Infra Projects', col4: '₹22,000', col5: 'pay_RAZ8401712', col6: 'Processing Gateway', badge: 'warning' },
            { col1: 'TXN-90245', col2: '#BK-8487', col3: 'Karan Malhotra', col4: '₹8,500', col5: 'pay_RAZ8401654', col6: 'Settled & Released', badge: 'success' },
            { col1: 'TXN-90244', col2: '#BK-8486', col3: 'Deepak Patel', col4: '₹4,500', col5: 'Refund Ref_90184', col6: 'Refunded Client', badge: 'danger' }
          ]
        };
        break;
      case 'settings':
      case 'settings/menus':
      case 'settings/permissions':
        this.pageData = {
          title: 'System Access & Security Controls',
          subtitle: 'Audit core API permissions, custom access scopes, UI menus and role-based control lists.',
          metric1: { label: 'Authorized Roles', value: '4 Tier RBAC', trend: 'Secure strict policy', type: 'purple' },
          metric2: { label: 'System Permissions', value: '18 Active Scopes', trend: 'Dynamic mapping', type: 'blue' },
          metric3: { label: 'Access Audit Logs', value: '142 OK / 0 Warn', trend: '100% compliant', type: 'green' },
          headers: ['Role Identity', 'Menu Access Allowed', 'Assigned Permissions Code', 'Default Landing Page', 'Last Modified By', 'System Lock Status'],
          rows: [
            { col1: 'ADMIN (System)', col2: 'All 8 Scopes Enabled', col3: 'Full Administrative Privilege (*)', col4: '/dashboard', col5: 'DatabaseInitializer', col6: 'System Locked (Safe)', badge: 'success' },
            { col1: 'CONTRACTOR', col2: 'Dashboard, Drivers, Bookings, Payments', col3: 'contractor:driver_manage, contractor:assigned_bookings...', col4: '/dashboard', col5: 'DatabaseInitializer', col6: 'Editable Profile', badge: 'blue' },
            { col1: 'DRIVER', col2: 'Mobile App API Access Only', col3: 'booking:receive, booking:accept, proof:upload...', col4: '/api/v1/driver/home', col5: 'DatabaseInitializer', col6: 'System Locked (Safe)', badge: 'success' },
            { col1: 'CUSTOMER', col2: 'Web Client Portal Endpoint Only', col3: 'booking:create, address:manage, booking:track...', col4: '/customer/booking', col5: 'DatabaseInitializer', col6: 'System Locked (Safe)', badge: 'success' }
          ]
        };
        break;
      default:
        // Default generic page rendering fallback
        this.pageData = {
          title: `${rawTitle} Module Panel`,
          subtitle: `Administrative monitoring console for ${rawTitle.toLowerCase()} operational activities and database fields.`,
          metric1: { label: `Total ${rawTitle}`, value: '254 Items', trend: '+4.1% MoM', type: 'blue' },
          metric2: { label: 'Active/Online', value: '18 Units', trend: 'Normal state', type: 'green' },
          metric3: { label: 'Pending Alert', value: '0 items', trend: 'No issues', type: 'success' },
          headers: ['Resource Identifier', 'Reference Designation', 'Operating Parameter', 'System Region', 'Operational State', 'Record Audit'],
          rows: [
            { col1: `${key.toUpperCase()}-01`, col2: `Standard System ${rawTitle} A`, col3: 'Normal Parametric Range', col4: 'East Hub Zone', col5: 'Active', badge: 'success' },
            { col1: `${key.toUpperCase()}-02`, col2: `Standard System ${rawTitle} B`, col3: 'Normal Parametric Range', col4: 'West Hub Zone', col5: 'Active', badge: 'success' },
            { col1: `${key.toUpperCase()}-03`, col2: `Standard System ${rawTitle} C`, col3: 'Undergoing Scheduled Audit', col4: 'Central Depot Area', col5: 'Review Flagged', badge: 'warning' }
          ]
        };
    }
  }
}
