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
  // data = [
  //   {
  //     id: 4,
  //     type: "Drinking Water",
  //     name: "Water cooler condition and inspection checklist displayed",
  //     fwdrole: "Admin"
  // },
  // {
  //     id: 5,
  //     type: "Drinking Water",
  //     name: "Condition of water bottles and printing of refill dates",
  //     fwdrole: "Admin"
  // },
  // {
  //     id: 6,
  //     type: "Electrical hazards",
  //     name: "Condition of electrical wiring, switchboards,MCBs, electrical accessories(Extension board and cords)",
  //     fwdrole: "Admin"
  // },
  // {
  //     id: 7,
  //     type: "Electrical hazards",
  //     name: "Condition of wiring/covers of IT panels and CPU of dektops",
  //     fwdrole: "IT"
  // },
  // {
  //     id: 8,
  //     type: "Electrical hazards",
  //     name: "EHV grid yard and s/stn fencing condition (if s/stn exists in office premises)",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 9,
  //     type: "Electrical hazards",
  //     name: "Earth pits visible for EHV grid yard and s/stn (if the s/stn exists in office premises)",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 12,
  //     type: "Electrical hazards",
  //     name: "Earth pit number is marked and resistance displayed in EHV grid yard and s/stn (if the s/stn exists in office premises)",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 13,
  //     type: "Electrical hazards",
  //     name: "Rubber Insulation mat available in front of indoor electric panels installed within office premises and EHV grid panel/switchgear rooms",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 14,
  //     type: "Emergency Preparedness",
  //     name: "Fire alarm system  functioning properly (only if already installed in office)",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 15,
  //     type: "Emergency Preparedness",
  //     name: "Base of fire extinguishers installed at 0.75 mtrs above from ground",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 16,
  //     type: "Emergency Preparedness",
  //     name: "Electric shock treatment chart in offices and along with s/stn (if the s/stn exists in office premises)",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 17,
  //     type: "Emergency Preparedness",
  //     name: "Proper First aid box available",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 18,
  //     type: "Emergency Preparedness",
  //     name: "Contents displayed on First aid box",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 19,
  //     type: "Emergency Preparedness",
  //     name: "First aid medicines consumption record available and analysis of cases done at office level",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 20,
  //     type: "Emergency Preparedness",
  //     name: "Schedule H drugs not present in first aid box. (Schedule H drugs are consumed only if prescribed by doctor, these can be identified by warning levels written on them and cannot be part of first aid kit)",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 21,
  //     type: "Emergency Preparedness",
  //     name: "Fire fighting equipments/ Fire Hydrant points/Assembly area is not obstructed",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 22,
  //     type: "Emergency Preparedness",
  //     name: "Emergency Exit signage board  displayed in case of second exit",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 23,
  //     type: "Emergency Preparedness",
  //     name: "Emergency lights in all indoor panel rooms/offices if night shift applicable",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 24,
  //     type: "Emergency Preparedness",
  //     name: "Use of secondary containment and shed for storage of transformer oil/ other chemicals(epoxy, resin, paint,etc)",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 25,
  //     type: "Emergency Preparedness",
  //     name: "Material Safety Data Sheet (MSDS) displayed where transformer oil/other chemicals (epoxy, resin, paint,etc) stored",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 26,
  //     type: "Emergency Preparedness",
  //     name: "Proper entry of employees/visitors/vendors/Commercial vehicles in security register",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 27,
  //     type: "Emergency Preparedness",
  //     name: "Emergency contact numbers displayed at gate",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 28,
  //     type: "Emergency Preparedness",
  //     name: "Proper parking in exit mode",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 29,
  //     type: "Office Building",
  //     name: "Use of gloves and caps by canteen/pantry staff",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 30,
  //     type: "Office Building",
  //     name: "Proper housekeeping/cleanliness in washroom, office premise, canteen/pantry",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 31,
  //     type: "Office Building",
  //     name: "Waste segregation (wet/dry/metallic/paper) being carried out",
  //     fwdrole: "Admin"
  // },
  // {
  //     id: 32,
  //     type: "Office Building",
  //     name: "Condition of office furniture/seating",
  //     fwdrole: "Admin"
  // },
  // {
  //     id: 33,
  //     type: "Office Building",
  //     name: "Adequate height of fans and bolting condition",
  //     fwdrole: "Admin"
  // },
  // {
  //     id: 34,
  //     type: "Office Building",
  //     name: "Proper guarding and mesh in exhaust fan",
  //     fwdrole: "Admin"
  // },
  // {
  //     id: 35,
  //     type: "Office Building",
  //     name: "Condition of Floor/ Staircase/ Ladder/ hand rails (considering slip /trip hazard)",
  //     fwdrole: "Admin"
  // },
  // {
  //     id: 36,
  //     type: "Office Building",
  //     name: "Heavy seepage in the building posing safety hazard",
  //     fwdrole: "Admin"
  // },
  // {
  //     id: 37,
  //     type: "Display/Documents",
  //     name: "PPEs matrix is displayed (applicable for EHV Grids, O&M offices which have s/stn/panel rooms within office premises)",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 38,
  //     type: "Display/Documents",
  //     name: "Quality, Environment Health & Safety Policy is displayed in office",
  //     fwdrole: "Safety"
  // },
  // {
  //     id: 39,
  //     type: "Display/Documents",
  //     name: "Incident/ Near miss case register is being maintained at office level",
  //     fwdrole: "Incharge"
  // },
  // {
  //     id: 40,
  //     type: "Display/Documents",
  //     name: "NIFPS service record available (For EHV Grids)",
  //     fwdrole: "Incharge"
  // }
  // ];
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
          console.log('Checkpoint Data: ',data);
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
    console.log('ID:',id);
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
