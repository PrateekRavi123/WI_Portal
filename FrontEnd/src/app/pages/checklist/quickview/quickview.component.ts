import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CheckpointService } from '../../../services/checkpoint/checkpoint.service';
import { ChecklistService } from '../../../services/checklist/checklist.service';
import { DashboardComponent } from '../../dashboard/dashboard.component';
import { Router } from '@angular/router';
import { PopupService } from '../../../services/popup/popup.service';
import { StorageService } from '../../../services/storage/storage.service';
export interface Checklist {
  id: string;
  CHECKLIST_ID: string;
  EMP_CODE: string;
  DIV: string;
  LOC: string;
  ok: string;
  notok: string;
  na: string;
  CREATED_ON: string;
}
@Component({
  selector: 'app-quickview',
  imports: [CommonModule],
  templateUrl: './quickview.component.html',
  styleUrl: './quickview.component.css'
})
export class QuickviewComponent {
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
  // data = [
  //   { id: 1, inchargeid: 'Alice', div: 'alice@example.com', loc: 25,ok: 25,notok: 25,nota:2 }
  // ];
  data : Checklist[] = [];
  roleId: string | null = '';
  emp_code: string | null = '';
  async ngOnInit() {
    this.emp_code = await this.storageservice.getUser();
    this.roleId = await this.storageservice.getUserRole();
    if(this.roleId?.includes('R1'))
      this.allchecklist();
    else if (this.roleId?.includes('R2'))
      this.myallchecklist(this.emp_code?this.emp_code:'');
  }

  allchecklist(){
    this.checklistservice.getAllChecklist().subscribe({
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
  formatDate(date: string | Date): string {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
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
