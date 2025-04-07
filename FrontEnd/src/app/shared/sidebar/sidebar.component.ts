import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, Renderer2 } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { InchargesService } from '../../services/incharges/incharges.service';
import { StorageService } from '../../services/storage/storage.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent  {

  // innerWidth: number | undefined;
  @Input() isOpen: boolean = false;
  // private resizeListener!: () => void;

  // ngOnInit() {
  //   if (typeof window !== 'undefined') {
  //     this.innerWidth = window.innerWidth;
  //   }
  //   this.updateSidebarVisibility(window.innerWidth);
  //   this.resizeListener = () => this.updateSidebarVisibility(window.innerWidth);
  //   window.addEventListener('resize', this.resizeListener);
  // }

  // ngOnDestroy() {
  //   window.removeEventListener('resize', this.resizeListener);
  // }

  // private updateSidebarVisibility(width: number) {
  //   if (width < 768) {
  //     this.isOpen = false; // Close sidebar on small screens
  //   } else {
  //     this.isOpen = true; // Open sidebar on larger screens
  //   }
  // }
  roleId: string | null = '';
  emp_code: string | null = '';

  constructor(private router: Router,private inchargeService: InchargesService,private storageservice: StorageService) {

  }

  async ngOnInit() {
    this.emp_code = await this.storageservice.getUser();
    this.roleId = await this.storageservice.getUserRole();
  }
  openedDropdown: number | null = null;
  toggleDropdown(index: number): void {
    this.openedDropdown = this.openedDropdown === index ? null : index;
  }

  hasRole(roles: string[]): boolean {
    if(!this.roleId)return false;
    return roles.includes(this.roleId);
  }
}
