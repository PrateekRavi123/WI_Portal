import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CheckpointService } from '../../../services/checkpoint/checkpoint.service';
import { ChecklistService } from '../../../services/checklist/checklist.service';
import { DashboardComponent } from '../../dashboard/dashboard.component';
import { Router } from '@angular/router';
import { PopupService } from '../../../services/popup/popup.service';
import { StorageService } from '../../../services/storage/storage.service';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
export interface Checklist {
  ID: string;
  CHECKLIST_ID: string;
  EMP_CODE: string;
  DIV: string;
  LOC: string;
  OK: string;
  NOTOK: string;
  NA: string;
  CREATED_ON: string;
}
@Component({
  selector: 'app-quickview',
  imports: [CommonModule,FormsModule],
  templateUrl: './quickview.component.html',
  styleUrl: './quickview.component.css'
})
export class QuickviewComponent {
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
  data : Checklist[] = [];
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
    if(this.roleId?.includes('R1'))
      this.allchecklist();
    else if (this.roleId?.includes('R2'))
      this.myallchecklist(this.emp_code?this.emp_code:'');
  }

  allchecklist(){
    this.checklistservice.getallchecklists().subscribe({
      next: (data) => {
        this.data = data;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }

  myallchecklist(emp_code: string){
    const body = {emp_code:emp_code};
    this.checklistservice.getmyAllChecklist(body).subscribe({
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
          const { ID, ...rest } = this.data[index]; 
          return {
            ID: (i + 1).toString(),
            ...rest
          };
        });
          
      const worksheet = XLSX.utils.json_to_sheet(selectedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, 'Checklist.xlsx');
    }

  openEditModal(user: any) {
    // this.dashboard.setSelectedData(user);
    // this.dashboard.openModal('editchecklist');
    //this.router.navigate(['checklist/edit',user.CHECKLIST_ID])
    this.router.navigate(['checklist/edit'], { queryParams: { CHECKLIST_ID: user.CHECKLIST_ID } });

  }

  // Delete Function
  deleteUser(id: string) {
    const sid = String(id);
    if (confirm('Are you sure you want to delete this checklist?')) {
      this.checklistservice.deletechecklist({ checklist_id: sid }).subscribe({
        next: (data) => {
          this.popupservice.showPopup('success', 'Checklist deleted successfully!');
          this.allchecklist();
        },
        error: (error) => {
          console.error('Delete Error:', error);
          this.popupservice.showPopup('error', 'Error in deleting checklist.');
        }
      });
    }
  }
}
