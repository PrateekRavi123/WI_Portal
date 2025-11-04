import { Component } from '@angular/core';
import { DashboardComponent } from '../../dashboard/dashboard.component';
import { PopupService } from '../../../services/popup/popup.service';
import { ReportsService } from '../../../services/reports/reports.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
export interface NotsubmittedChecklist{
  LOC_ID: string,
	LOC_NAME: string,
   CIRCLE: string, 
    DIVISION: string, 
    EMP_CODE: string,
	EMP_NAME: string,
	EMAIL_ID: string,
  MOBILE_NO: string
}
@Component({
  selector: 'app-notsubmittedchecklist',
  imports: [CommonModule,FormsModule],
  templateUrl: './notsubmittedchecklist.component.html',
  styleUrl: './notsubmittedchecklist.component.css'
})
export class NotsubmittedchecklistComponent {
  constructor(private reportservice: ReportsService, private dashboard: DashboardComponent,private popupservice: PopupService) {
    }
    data : NotsubmittedChecklist[] = [];
selectedMonth: string = '';
currentPage: number = 1;
  itemsPerPage: number = 10;
  sortColumn: string = '';
  sortAscending: boolean = true;
  selectedRows: Set<number> = new Set(); 
  selectAll: boolean = false;
    min(a: number, b: number): number {
    return Math.min(a, b);
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
setCurrentMonth() {
    const today = new Date();
    this.selectedMonth = today.toISOString().slice(0, 7); // Format YYYY-MM
  }
  onMonthChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement && inputElement.value) {
      this.selectedMonth = inputElement.value;
      this.fetchnotsubmittedData(this.selectedMonth);
    }
  }
  ngOnInit(): void {
    this.setCurrentMonth(); 
    this.fetchnotsubmittedData(this.selectedMonth); 
  }
  fetchnotsubmittedData(month:string){
    this.reportservice.getnotsubmittedchecklist(month).subscribe({
      next: (data) => {
        this.data = data;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
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
          this.data.forEach((_, index) => {
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
    
        const selectedData = Array.from(this.selectedRows).map(index => this.data[index]);
        const worksheet = XLSX.utils.json_to_sheet(selectedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, 'NotSubmittedChecksheet.xlsx');
      }
}
