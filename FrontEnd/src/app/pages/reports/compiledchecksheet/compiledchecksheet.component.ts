import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportsService } from '../../../services/reports/reports.service';
import { PopupService } from '../../../services/popup/popup.service';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
export interface CompiledchecksheetBase {
  CHECKLIST_ID: string;
  CIRCLE: string;
  DIVISION: string;
  LOCATION: string;
  OFFICE_TYPE: string;
  EMAIL_ID: string;
}

export interface Compiledchecksheet extends CompiledchecksheetBase {
  [checkpointName: string]: string;
}
@Component({
  selector: 'app-compiledchecksheet',
  imports: [CommonModule, FormsModule],
  templateUrl: './compiledchecksheet.component.html',
  styleUrl: './compiledchecksheet.component.css'
})
export class CompiledchecksheetComponent {
  constructor(private reportservice: ReportsService, private popupservice: PopupService) {
  }
  data: Compiledchecksheet[] = [];
  checkpointKeys: string[] = [];
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
      this.fetchcompiledchecksheetData(this.selectedMonth);
    }
  }
  ngOnInit(): void {
    this.setCurrentMonth(); // Set default value to current month
    this.fetchcompiledchecksheetData(this.selectedMonth); // Load initial data
  }
  fetchcompiledchecksheetData(month: string) {
    this.reportservice.getcompiledchecksheet(month).subscribe({
      next: (data) => {
        this.data = data;
        if (data.length > 0) {
          const staticKeys: (keyof CompiledchecksheetBase)[] = [
            'CHECKLIST_ID',
            'CIRCLE',
            'DIVISION',
            'LOCATION',
            'OFFICE_TYPE',
            'EMAIL_ID'
          ];

          this.checkpointKeys = Object.keys(data[0]).filter(
            key => !staticKeys.includes(key as keyof CompiledchecksheetBase)
          );
        }
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
      saveAs(blob, 'CompiledChecksheet.xlsx');
    }
}
