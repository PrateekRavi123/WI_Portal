import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Renderer2 } from '@angular/core';
import { StorageService } from '../../services/storage/storage.service';
import { Router } from '@angular/router';
import { ProfileComponent } from '../../components/profile/profile.component';
import { DashboardComponent } from '../../pages/dashboard/dashboard.component';
import { InchargesService } from '../../services/incharges/incharges.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  username!: string;
  emp_code: string | null = '';
  constructor(private router: Router,private storageService: StorageService,private dashboard: DashboardComponent,private inchargeservice:InchargesService,private storageservice: StorageService) { 
  }
  async ngOnInit() {
    this.emp_code = await this.storageservice.getUser();
    this.getdetails();      
  }
  logout() {
    this.storageService.clearStorage();
    this.router.navigate(['login']);
  }

  @Output() toggleSidebar = new EventEmitter<void>();

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }
  getdetails(){
    this.inchargeservice.getIncharge(this.emp_code?this.emp_code:"").subscribe({
      next: (data) => {
        console.log(data);
        this.username =  data[0].EMP_NAME;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }


  openDashboardModal(type: 'profile' ) {
    this.dashboard.openModal(type);
  }
  
}
