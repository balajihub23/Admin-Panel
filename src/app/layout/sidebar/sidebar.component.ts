import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuService } from '../../shared/services/menu.service';

interface SidebarItem {
  name: string;
  code: string;
  icon: string;
  route: string;
  subMenus?: SidebarItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  private menuService = inject(MenuService);

  @Input() collapsed: boolean = false;
  sidebarItems: SidebarItem[] = [];


  ngOnInit() {
    if (typeof window !== 'undefined') {
      // Synchronously load cached menus instantly to prevent rendering delay/flicker
      this.loadCachedMenus();

      // Revalidate fresh menus in the background from the server
      this.menuService.getAccessibleMenus().subscribe({
        next: (res: any) => {
          if (res.success && res.data) {
            this.buildSidebar(res.data);
          }
        },
        error: () => {
          // Keep showing cached menus if revalidation fails
        }
      });
    }
  }

  private loadCachedMenus() {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('userMenus');
      if (cached) {
        try {
          this.buildSidebar(JSON.parse(cached));
        } catch (e) {
          console.error('Error loading cached menus:', e);
        }
      }
    }
  }

  expandedItems = new Set<string>();

  toggleItem(code: string): void {
    if (this.expandedItems.has(code)) {
      this.expandedItems.delete(code);
    } else {
      this.expandedItems.add(code);
    }
  }

  isExpanded(code: string): boolean {
    return this.expandedItems.has(code);
  }

  private buildSidebar(menusList: any[]) {
    const mapped: SidebarItem[] = [];
    let addedPartnersMenu = false;

    for (const menu of menusList) {
      const code = (menu.menuCode || '').toLowerCase();
      const path = (menu.routePath || '').toLowerCase();

      if (code === 'contractors' || code === 'drivers' || code === 'partners' ||
          path === '/contractors' || path === '/drivers' || path === '/partners') {
        if (!addedPartnersMenu) {
          mapped.push({
            name: 'Partners',
            code: 'partners',
            icon: 'drivers',
            route: '/partners'
          });
          addedPartnersMenu = true;
        }
      } else {
        mapped.push(this.mapMenuToSidebarItem(menu));
      }
    }
    this.sidebarItems = mapped;
  }

  private mapMenuToSidebarItem(menu: any): SidebarItem {
    return {
      name: menu.menuName,
      code: menu.menuCode,
      icon: this.mapIconCode(menu.icon || menu.menuCode),
      route: menu.routePath,
      subMenus: menu.subMenus && menu.subMenus.length > 0
        ? menu.subMenus.map((sub: any) => this.mapMenuToSidebarItem(sub))
        : undefined
    };
  }

  private mapIconCode(icon: string): string {
    const code = icon.toLowerCase();
    if (code.includes('dash') || code.includes('home')) return 'dashboard';
    if (code.includes('people') || code.includes('cust') || code.includes('contract')) return 'customers';
    if (code.includes('driver')) return 'drivers';
    if (code.includes('owner')) return 'owners';
    if (code.includes('truck') || code.includes('veh')) return 'vehicles';
    if (code.includes('calendar') || code.includes('book')) return 'bookings';
    if (code.includes('pulse') || code.includes('live')) return 'live';
    if (code.includes('money') || code.includes('pay')) return 'payments';
    if (code.includes('chat') || code.includes('supp')) return 'support';
    if (code.includes('chart') || code.includes('anal')) return 'analytics';
    if (code.includes('bull') || code.includes('mark')) return 'marketing';
    return 'settings';
  }
}


