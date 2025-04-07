import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DashboardComponent } from '../../dashboard/dashboard.component';
import { InchargesService } from '../../../services/incharges/incharges.service';
import { PopupService } from '../../../services/popup/popup.service';
import { Subscription } from 'rxjs';
import { RefreshService } from '../../../services/refresh/refresh.service';
export interface Incharge {
  EMP_CODE: string; 
  EMP_NAME: string;  
  CIRCLE:string; 
  DIVISION:string; 
  LOCATION:string; 
  ROLE:string; 
  STATUS:string;
}
@Component({
  selector: 'app-quickviewincharge',
  imports: [CommonModule],
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
  min(a: number, b: number): number {
    return Math.min(a, b);
  }
  onSearch(value: string) {
    this.searchTerm = value;
  }
  // data = [
  //   { id: 1, name: 'alice@example.com',  circle:'circle1',div:'div1',loc:'loc1',role:'admin',status:'active' },
  //   { id: 2, name: 'bob@example.com', circle:'circle1',div:'div1',loc:'loc1',role:'admin',status:'active'  },
  //   { id: 3,  name: 'charlie@example.com', circle:'circle1',div:'div1',loc:'loc1',role:'admin',status:'active'  },
  //   { id: 4, name: 'david@example.com', circle:'circle1',div:'div1',loc:'loc1',role:'admin',status:'active'  },
  //   { id: 5,  name: 'eve@example.com',circle:'circle1',div:'div1',loc:'loc1',role:'admin',status:'active' },
  //   { id: 6,  name: 'frank@example.com', circle:'circle1',div:'div1',loc:'loc1',role:'admin',status:'active'  },
  //   { id: 7,  name: 'grace@example.com', circle:'circle1',div:'div1',loc:'loc1',role:'admin',status:'active'  },
  //   { id: 8,  name: 'hank@example.com', circle:'circle1',div:'div1',loc:'loc1',role:'admin',status:'active'  }
  // ];
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
    console.log(user);
    this.dashboard.setSelectedData(user);
    this.dashboard.openModal('editincharge');
  }

  // Delete Function
  deleteUser(id: any) {
    if (confirm('Are you sure you want to delete this incharge?')) {
      this.inchargeservice.deleteincharge({ emp_code: id }).subscribe({
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
