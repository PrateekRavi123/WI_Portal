import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DashboardComponent } from '../../dashboard/dashboard.component';
import { InchargesService } from '../../../services/incharges/incharges.service';
import { PopupService } from '../../../services/popup/popup.service';
import { Subscription } from 'rxjs';
import { RefreshService } from '../../../services/refresh/refresh.service';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
export interface Location {
  loc_id: string;
  loc_name: string;
}
export interface Incharge {
  id: string;
  emp_code: string; 
  emp_name: string;  
  mobile_no: string;
  circle:string; 
  division:string; 
  role:string; 
  status:string;
  locations: Location[];
}
@Component({
  selector: 'app-quickviewincharge',
  imports: [CommonModule, FormsModule],
  templateUrl: './quickviewincharge.component.html',
  styleUrl: './quickviewincharge.component.css'
})
export class QuickviewinchargeComponent {
  constructor(private refreshService: RefreshService, private dashboard: DashboardComponent, private inchargeservice: InchargesService, private popupservice: PopupService) {}
  refreshSubscription!: Subscription;
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
  data : Incharge[] = [];
  
    async ngOnInit() {
      this.getAllIncharge();
      this.refreshSubscription = this.refreshService.refresh$.subscribe(() => {
        this.getAllIncharge(); 
      });
    }
  
    getAllIncharge(){
      this.inchargeservice.getAllIncharge().subscribe({
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

  // Map selected rows and flatten locations array to a comma-separated string
  const selectedData = Array.from(this.selectedRows).map(index => {
    const row = this.data[index];
    return {
      ...row,
      // Convert locations array to comma-separated names
      locations: row.locations && row.locations.length > 0
        ? row.locations.map(loc => loc.loc_name).join(', ')
        : 'No Location Assigned'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(selectedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, 'Incharges.xlsx');
}


  openEditModal(user: any) {
    this.dashboard.setSelectedData(user);
    this.dashboard.openModal('editincharge');
  }

  // Delete Function
  deleteUser(id: any) {
    if (confirm('Are you sure you want to delete this incharge?')) {
      this.inchargeservice.deleteincharge({ id: id }).subscribe({
        next: (data) => {
          this.popupservice.showPopup('success', 'Incharge deleted successfully!');
          this.getAllIncharge();
        },
        error: (error) => {
          console.error('Delete Error:', error);
          this.popupservice.showPopup('error', 'Error in deleting incharge.');
        }
      });
    }
  }
}
