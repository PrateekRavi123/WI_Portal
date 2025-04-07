import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ChecklistService } from '../../services/checklist/checklist.service';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { PopupService } from '../../services/popup/popup.service';
import { Checklist } from '../checklist/quickview/quickview.component';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../services/storage/storage.service';
export interface PendingChecklist{
  ID: string,
	CHECKLIST_ID: string,
   type_name: string, 
    NAME: string, 
    ROLE_ID: string,
	role_name: string,
	status: string,
  DIV: string,
  LOC: string
}
@Component({
  selector: 'app-pendingchecklist',
  imports: [CommonModule],
  templateUrl: './pendingchecklist.component.html',
  styleUrl: './pendingchecklist.component.css'
})
export class PendingchecklistComponent {
searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  sortColumn: string = '';
  sortAscending: boolean = true;
  constructor(private storageservice: StorageService, private router: Router,private checklistservice: ChecklistService, private dashboard: DashboardComponent,private popupservice: PopupService) {
  }
  min(a: number, b: number): number {
    return Math.min(a, b);
  }
  onSearch(value: string) {
    this.searchTerm = value;
  }
  data : PendingChecklist[] = [];
  roleId: string | null = '';
  emp_code: string | null = '';
  async ngOnInit() {
    this.emp_code = await this.storageservice.getUser();
    this.roleId = await this.storageservice.getUserRole();
    if(this.roleId?.includes('R1'))
      this.allpendingchecklist();
    else if (this.roleId?.includes('R2'))
      this.mypendingchecklist(this.emp_code?this.emp_code:'');
    else 
      this.rolependingchecklist(this.roleId?this.roleId:'');
  }

  allpendingchecklist(){
    this.checklistservice.getpendingchecklistcheckpoint().subscribe({
      next: (data) => {
        this.data = data;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }
  mypendingchecklist(emp_code: string){
    const body = {emp_code:emp_code};
    this.checklistservice.getmypendingchecklistcheckpoint(body).subscribe({
      next: (data) => {
        this.data = data;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }
  rolependingchecklist(roleId: string){
    const body = {roleId:roleId};
    this.checklistservice.getrolependingchecklistcheckpoint(roleId).subscribe({
      next: (data) => {
        this.data = data;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }
  get filteredData() {
    return this.data
      .filter(item =>
        Object.values(item).some(val =>
          String(val).toLowerCase().includes(this.searchTerm.toLowerCase())
        )
      )
      .sort((a, b) => {
        if (!this.sortColumn) return 0;
        const valueA = a[this.sortColumn as keyof typeof a];
        const valueB = b[this.sortColumn as keyof typeof b];

        return this.sortAscending
          ? valueA > valueB ? 1 : -1
          : valueA < valueB ? 1 : -1;
      })
      .slice((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage);
  }

  totalPages() {
    return Math.ceil(this.data.length / this.itemsPerPage);
  }

  changePage(page: number) {
    this.currentPage = page;
  }

  sortData(column: string) {
    if (this.sortColumn === column) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortColumn = column;
      this.sortAscending = true;
    }
  }

  openEditModal(user: any) {
    this.dashboard.setSelectedData(user);
    this.dashboard.openModal('editpendingchecklist');
  }

  
}
