import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';
import { PanelMenuModule } from 'primeng/panelmenu';
import { TagModule } from 'primeng/tag';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ButtonModule,
    DrawerModule,
    MenuModule,
    PanelMenuModule,
    TagModule
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  title = 'Financial Management System';
  swaggerUrl = environment.swaggerUrl;
  sidebarVisible = false;
  
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      routerLink: '/dashboard',
      command: () => this.onMenuItemClick()
    },
    {
      label: 'Savings',
      icon: 'pi pi-wallet',
      routerLink: '/savings',
      command: () => this.onMenuItemClick()
    },
    {
      label: 'Investments',
      icon: 'pi pi-chart-line',
      routerLink: '/investments',
      command: () => this.onMenuItemClick()
    },
    {
      label: 'Income',
      icon: 'pi pi-dollar',
      routerLink: '/income',
      command: () => this.onMenuItemClick()
    }
  ];
  
  ngOnInit(): void {
    // Set active menu item based on current route
    this.setActiveMenuItem();
  }
  
  get username(): string | undefined {
    return this.authService.getUsername();
  }
  
  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }
  
  onMenuItemClick(): void {
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      this.sidebarVisible = false;
    }
  }
  
  logout(): void {
    this.authService.logout();
  }
  
  openApiDocs(): void {
    window.open(this.swaggerUrl, '_blank');
  }
  
  private setActiveMenuItem(): void {
    const currentPath = this.router.url;
    this.menuItems.forEach(item => {
      if (item.routerLink && currentPath.includes(item.routerLink)) {
        item.styleClass = 'active-menuitem';
      }
    });
  }
}