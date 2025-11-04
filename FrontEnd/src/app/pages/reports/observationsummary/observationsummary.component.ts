import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportsService } from '../../../services/reports/reports.service';
import { PopupService } from '../../../services/popup/popup.service';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
export interface ObservationDetail {
  CHECKLIST_IDS_NOT_OK: string;
  LOCATION_IDS_NOT_OK: string;
  INSPECTION_REMARK: string;
}

export interface ObservationSummary {
  CHECKPOINT_ID: string;
  CHECKPOINT_TYPE_NAME: string;
  CHECKPOINT_NAME: string;
  NOT_OK_COUNT: number; // keep as number for easier sorting
  details?: ObservationDetail[];
}
@Component({
  selector: 'app-observationsummary',
  imports: [CommonModule, FormsModule],
  templateUrl: './observationsummary.component.html',
  styleUrl: './observationsummary.component.css'
})
export class ObservationsummaryComponent {
  constructor(private reportservice: ReportsService, private popupservice: PopupService) {
  }
  data: ObservationSummary[] = [];
  selectedMonth: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  sortColumn: string = '';
  sortAscending: boolean = true;
  selectedRows: Set<number> = new Set();
  expandedRows: Set<number> = new Set();
  selectAll: boolean = false;
  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  setCurrentMonth() {
    const today = new Date();
    this.selectedMonth = today.toISOString().slice(0, 7); // Format YYYY-MM
  }
  onMonthChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement && inputElement.value) {
      this.selectedMonth = inputElement.value;
      this.fetchobservationsummaryData(this.selectedMonth);
    }
  }
  ngOnInit(): void {

    this.setCurrentMonth(); // Set default value to current month
    this.fetchobservationsummaryData(this.selectedMonth); // Load initial data

  }
  fetchobservationsummaryData(month: string) {
    this.reportservice.getobservationsummaryData(month).subscribe({
      next: (rawData: ObservationSummary[]) => {
        const grouped = rawData.reduce((acc: ObservationSummary[], item: any) => {
          let checkpoint = acc.find(c => c.CHECKPOINT_ID === item.CHECKPOINT_ID);
          if (!checkpoint) {
            checkpoint = {
              CHECKPOINT_ID: item.CHECKPOINT_ID,
              CHECKPOINT_TYPE_NAME: item.CHECKPOINT_TYPE_NAME,
              CHECKPOINT_NAME: item.CHECKPOINT_NAME,
              NOT_OK_COUNT: 0,
              details: []
            };
            acc.push(checkpoint);
          }

          if (+item.NOT_OK_COUNT > 0) {
            checkpoint.details!.push({
              CHECKLIST_IDS_NOT_OK: item.CHECKLIST_IDS_NOT_OK,
              LOCATION_IDS_NOT_OK: item.LOCATION_IDS_NOT_OK,
              INSPECTION_REMARK: item.INSPECTION_REMARK
            });
            checkpoint.NOT_OK_COUNT += 1;
          }

          return acc;
        }, []);

        this.data = grouped;
      },
      error: (err) => console.error('Error fetching data:', err)
    });
  }

  get fullFilteredData() {
    if (!this.sortColumn) return [...this.data]; // no sorting, return copy of data

    return [...this.data].sort((a, b) => {
      const valueA = a[this.sortColumn as keyof typeof a];
      const valueB = b[this.sortColumn as keyof typeof b];

      // Handle undefined or null values
      if (valueA == null && valueB == null) return 0; // both null/undefined → equal
      if (valueA == null) return 1; // undefined/null goes to the end
      if (valueB == null) return -1;

      // Compare numbers
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return this.sortAscending ? valueA - valueB : valueB - valueA;
      }

      // Compare strings
      return this.sortAscending
        ? valueA.toString().localeCompare(valueB.toString())
        : valueB.toString().localeCompare(valueA.toString());
    });
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

  // Expand/collapse row
  toggleExpand(index: number, notOkCount: number) {
    if (+notOkCount === 0) return;
    if (this.expandedRows.has(index)) this.expandedRows.delete(index);
    else this.expandedRows.add(index);
  }
  downloadSelectedData() {
    if (this.selectedRows.size === 0) {
      this.popupservice.showPopup('error', 'Please select at least one row to download.');
      return;
    }

    const rowsToExport: any[][] = [];

    // Header row
    rowsToExport.push([
      'S.No',
      'Checkpoint Type',
      'Checkpoint Name',
      'NOT OK Count',
      'Checklist ID',
      'Location ID',
      'Inspection Remark'
    ]);

    let serial = 1; // <-- start from 1

    Array.from(this.selectedRows).forEach(index => {
      const summaryRow = this.fullFilteredData[index]; // use sorted/paged data if needed

      // Main checkpoint row
      rowsToExport.push([
        serial++,  // <-- serial number
        summaryRow.CHECKPOINT_TYPE_NAME,
        summaryRow.CHECKPOINT_NAME,
        summaryRow.NOT_OK_COUNT,
        '', '', ''
      ]);

      if (summaryRow.details && summaryRow.details.length > 0) {
        summaryRow.details.forEach(detail => {
          rowsToExport.push([
            '', '', '', '',  // empty cells for main info
            detail.CHECKLIST_IDS_NOT_OK,
            detail.LOCATION_IDS_NOT_OK,
            detail.INSPECTION_REMARK
          ]);
        });
      }
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(rowsToExport);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ObservationSummary');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'ObservationSummary.xlsx');
  }



}
