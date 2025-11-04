import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ChecklistService } from '../../services/checklist/checklist.service';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { PopupService } from '../../services/popup/popup.service';
import { Checklist } from '../checklist/quickview/quickview.component';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../services/storage/storage.service';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
export interface PendingChecklist{
  ID: string,
	CHECKLIST_ID: string,
   TYPE_NAME: string, 
    NAME: string, 
    ROLE_ID: string,
	ROLE_NAME: string,
	STATUS: string,
  DIV: string,
  LOC: string,
  CREATED_ON: string
}
@Component({
  selector: 'app-pendingchecklist',
  imports: [CommonModule,FormsModule],
  templateUrl: './pendingchecklist.component.html',
  styleUrl: './pendingchecklist.component.css'
})
export class PendingchecklistComponent {
  startDate: string = '';
  endDate: string = '';
  selectedRows: Set<number> = new Set(); 
  selectAll: boolean = false;
  onDateRangeChange() {
    if (this.startDate && this.endDate && new Date(this.startDate) > new Date(this.endDate)) {
    this.popupservice.showPopup('error','Start date cannot be after end date.');
    return;
  }
    this.data.filter(item => {
      const date = new Date(item.CREATED_ON);
      return (!this.startDate || date >= new Date(this.startDate)) &&
            (!this.endDate || date <= new Date(this.endDate));
    });
  }
  currentPage: number = 1;
  itemsPerPage: number = 10;
  sortColumn: string = '';
  sortAscending: boolean = true;
  constructor(private storageservice: StorageService, private router: Router,private checklistservice: ChecklistService, private dashboard: DashboardComponent,private popupservice: PopupService) {
  }
  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  data : PendingChecklist[] = [];
  roleId: string | null = '';
  emp_code: string | null = '';
  async ngOnInit() {
    const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(today.getMonth() - 1);

  // Format to YYYY-MM-DD
  this.endDate = today.toISOString().split('T')[0];
  this.startDate = oneMonthAgo.toISOString().split('T')[0];
    this.emp_code = await this.storageservice.getUser();
    this.roleId = await this.storageservice.getUserRole();
    console.log(this.roleId);
    if(this.roleId?.includes('R1'))
      this.allpendingchecklist();
    else if (this.roleId?.includes('R2'))
      this.mypendingchecklist(this.emp_code?this.emp_code:'');
    else 
      this.rolependingchecklist(this.roleId?this.roleId:'');
  }
formatDate(date: string | Date): string {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
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
    const body = {emp_code: emp_code};
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
    const body = {roleId: roleId};
    this.checklistservice.getrolependingchecklistcheckpoint(body).subscribe({
      next: (data) => {
        this.data = data;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }
  get fullFilteredData() {
  return this.data
    .filter(item => {
      const itemDate = new Date(item.CREATED_ON);
      const fromDate = this.startDate ? new Date(new Date(this.startDate).setHours(0, 0, 0, 0)) : null;
      const toDate = this.endDate ? new Date(new Date(this.endDate).setHours(23, 59, 59, 999)) : null;

      return (!fromDate || itemDate >= fromDate) &&
             (!toDate || itemDate <= toDate);
    })
    .sort((a, b) => {
      if (!this.sortColumn) return 0;

      const valueA = a[this.sortColumn as keyof typeof a];
      const valueB = b[this.sortColumn as keyof typeof b];

      return this.sortAscending
        ? valueA > valueB ? 1 : -1
        : valueA < valueB ? 1 : -1;
    })
}

get filteredData() {
  return this.fullFilteredData.slice(
      (this.currentPage - 1) * this.itemsPerPage,
      this.currentPage * this.itemsPerPage
    );
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
toggleRowSelection(index: number) {
    if (this.selectedRows.has(index)) {
      this.selectedRows.delete(index);
    } else {
      this.selectedRows.add(index);
    }
  }

  toggleSelectAll() {
    if (this.selectAll) {
      this.selectedRows.clear(); // Clear previous selection
      this.fullFilteredData.forEach((_, index) => {
        this.selectedRows.add(index);
      });
    } else {
      this.selectedRows.clear();
    }
  }
  downloadSelectedData() {
    if (this.selectedRows.size === 0) {
      this.popupservice.showPopup('error','Please select at least one row to download.');
      return;
    }

    const selectedData = Array.from(this.selectedRows).map((index, i) => {
      const { ID, ...rest } = this.data[index]; // Remove the original ID
      return {
        ID: (i + 1).toString(), // Assign new ID starting from "1"
        ...rest
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(selectedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'PendingChecklist.xlsx');
  }
  openEditModal(user: any) {
    this.dashboard.setSelectedData(user);
    this.dashboard.openModal('editpendingchecklist');
  }

  
}
