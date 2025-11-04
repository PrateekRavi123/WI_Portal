import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DashboardComponent } from '../../dashboard/dashboard.component';
import { LocationService } from '../../../services/location/location.service';
import { PopupService } from '../../../services/popup/popup.service';
import { RefreshService } from '../../../services/refresh/refresh.service';
import { Subscription } from 'rxjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FormsModule } from '@angular/forms';
export interface Location {
  LOC_ID: string;
  LOC_NAME: string;
  DIV: string;
  CIRCLE: string;
  DIV_CODE: string;
  CIRCLE_CODE: string;
  OFFICE_TYPE: string;
  STATUS: string;
}
@Component({
  selector: 'app-quickviewloc',
  imports: [CommonModule, FormsModule],
  templateUrl: './quickviewloc.component.html',
  styleUrl: './quickviewloc.component.css'
})
export class QuickviewlocComponent {
  constructor(private refreshService:RefreshService, private dashboard: DashboardComponent,private locService: LocationService,private popupservice: PopupService) {}
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  sortColumn: string = '';
  sortAscending: boolean = true;
  selectedRows: Set<number> = new Set(); 
  selectAll: boolean = false;
  min(a: number, b: number): number {
    return Math.min(a, b);
  }
  onSearch(value: string) {
    this.searchTerm = value;
  }
  data : Location[] = [];

  refreshSubscription!: Subscription;
  async ngOnInit() {
    this.alllocation();
    this.refreshSubscription = this.refreshService.refresh$.subscribe(() => {
      this.alllocation(); 
    });
  }

alllocation(){
    this.locService.getAllLocation().subscribe({
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
      saveAs(blob, 'Locations.xlsx');
    }

  openEditModal(user: any) {
    this.dashboard.setSelectedData(user);
    this.dashboard.openModal('editloc');
  }

  // Delete Function
  deleteUser(id: any) {
    if (confirm('Are you sure you want to delete this location?')) {
      const body = {
        loc_id:id
      }
      this.locService.deletelocation(body).subscribe({
        next: (data) => {
          this.popupservice.showPopup('success', 'Location deleted successfully!');
          this.alllocation();
        },
        error: (error) => {
          console.error('Delete Error:', error);
          this.popupservice.showPopup('error', 'Error in deleting location.');
        }
      });
    }
  }
}
