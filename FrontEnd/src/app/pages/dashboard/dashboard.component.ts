import { Component, HostListener } from '@angular/core';
import { HeaderComponent } from '../../shared/header/header.component';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProfileComponent } from "../../components/profile/profile.component";
import { EditcheckptComponent } from "../checkpoint/editcheckpt/editcheckpt.component";
import { EditlocComponent } from "../location/editloc/editloc.component";
import { EditinchargeComponent } from "../incharges/editincharge/editincharge.component";
import { EditchecklistComponent } from "../checklist/editchecklist/editchecklist.component";
import { PendingchecklistComponent } from "../pendingchecklist/pendingchecklist.component";
import { EditpendingchecklistComponent } from "../pendingchecklist/editpendingchecklist/editpendingchecklist.component";

@Component({
  selector: 'app-dashboard',
  imports: [HeaderComponent, SidebarComponent, RouterOutlet, CommonModule, ProfileComponent, EditcheckptComponent, EditlocComponent, EditinchargeComponent, EditchecklistComponent, EditpendingchecklistComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  isSidebarOpen = true;
  selectedData: any | null = null;


  //user = getUserData();

  constructor(private router: Router) {}



  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    const width = (event.target as Window).innerWidth;
    if (width < 768) {
      this.isSidebarOpen = false; // Close sidebar on small screens
    } else {
      this.isSidebarOpen = true; // Open sidebar on larger screens
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  isModalOpen = false;
  currentModal: string | null = null;

  openModal(type: string ) {
    this.currentModal = type;
    this.isModalOpen = true;
  }

  setSelectedData(data: any) {
    this.selectedData = data;
  }

  closeModal() {
    this.isModalOpen = false;
    this.currentModal = null;
  }
}


  // function getUserData() {
  //   const temp = localStorage.getItem('userInfo');
  //   const data = temp ? JSON.parse(temp) : [];
  //   const { USER_ID, NAME, ROLE_CODE, COMPANY, CIRCLE, DIVISION, LOCATION, PASSWORD, DEPT_CODE,
  //     PHONE_NUMBER, EMAIL_ID, AMC_TYPE, BILL_SUB_TYPE, DESIGNATION } = data[0];
  //   localStorage.setItem("USER_ID", USER_ID);
  //   localStorage.setItem("NAME", NAME);
  //   localStorage.setItem("ROLE_CODE", ROLE_CODE);
  //   localStorage.setItem("COMPANY", COMPANY);
  //   localStorage.setItem("CIRCLE", CIRCLE);
  //   localStorage.setItem("DIVISION", DIVISION);
  //   localStorage.setItem("LOCATION", LOCATION);
  //   localStorage.setItem("PASSWORD", PASSWORD);
  //   localStorage.setItem("DEPT_CODE", DEPT_CODE);
  //   localStorage.setItem("PHONE_NUMBER", PHONE_NUMBER);
  //   localStorage.setItem("EMAIL_ID", EMAIL_ID);
  //   localStorage.setItem("AMC_TYPE", AMC_TYPE);
  //   localStorage.setItem("BILL_SUB_TYPE", BILL_SUB_TYPE);
  //   localStorage.setItem("DESIGNATION", DESIGNATION);
  //   return temp ? JSON.parse(temp) : [];
  // }

