import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DashboardComponent } from '../../dashboard/dashboard.component';
import { CheckpointService } from '../../../services/checkpoint/checkpoint.service';
import { PopupService } from '../../../services/popup/popup.service';
import { Subscription } from 'rxjs';
import { RefreshService } from '../../../services/refresh/refresh.service';
import { Router } from '@angular/router';
export interface Checkpoint {
  id: string;
  type_id: string;
  type_name: string;
  NAME: string;
  ROLE_ID: string;
  role_name: string;
}
@Component({
  selector: 'app-quickviewcheckpt',
  imports: [CommonModule],
  templateUrl: './quickviewcheckpt.component.html',
  styleUrl: './quickviewcheckpt.component.css'
})
export class QuickviewcheckptComponent {
  constructor(private refreshService: RefreshService, private dashboard: DashboardComponent, private checkpointservice: CheckpointService,private popupservice: PopupService) {
    
  }
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  sortColumn: string = '';
  sortAscending: boolean = true;
  min(a: number, b: number): number {
    return Math.min(a, b);
  }
  onSearch(value: string) {
    this.searchTerm = value;
  }

    data : Checkpoint[] = [];
    refreshSubscription!: Subscription;
    async ngOnInit() {
      this.allcheckpoint();
      this.refreshSubscription = this.refreshService.refresh$.subscribe(() => {
        this.allcheckpoint(); 
      });
    }
  
    allcheckpoint(){
      this.checkpointservice.getAllCheckpoint().subscribe({
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

  
  // Delete Function
  deleteUser(id: any) {
    const sid = String(id);
    if (confirm('Are you sure you want to delete this checkpoint?')) {
      this.checkpointservice.deletecheckpoint({ id: sid }).subscribe({
        next: (data) => {
          this.popupservice.showPopup('success', 'Checkpoint deleted successfully!');
          this.allcheckpoint();
        },
        error: (error) => {
          console.error('Delete Error:', error);
          this.popupservice.showPopup('error', 'Error in deleting checkpoint.');
        }
      });
    }
  }

  openEditModal(user: any) {
    this.dashboard.setSelectedData(user);
    this.dashboard.openModal('editcheckpt');
    
  }
}
