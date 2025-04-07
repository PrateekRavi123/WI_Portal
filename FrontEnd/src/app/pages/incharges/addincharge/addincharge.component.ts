import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { LocationService } from '../../../services/location/location.service';
import { StorageService } from '../../../services/storage/storage.service';
import { InchargesService } from '../../../services/incharges/incharges.service';
import { PopupService } from '../../../services/popup/popup.service';
import { RoleService } from '../../../services/role/role.service';

@Component({
  selector: 'app-addincharge',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './addincharge.component.html',
  styleUrl: './addincharge.component.css'
})
export class AddinchargeComponent {
  editForm: FormGroup;
  // circleList = [
  //   {
  //     id: "CE",
  //   name: "CENTRAL"
  //   },
  //   {
  //     id: "SE",
  //     name: "South East"
  //   },
  //   {
  //     id: "NE",
  //     name: "North East"
  //   },
  // ];
  // divList = [
  //   {
  //     id: "CESRD",
  //   name: "Shankar Road"
  //   },
  //   {
  //     id: "ESKKD",
  //     name: "Karkardooma"
  //   },
  //   {
  //     id: "EN",
  //     name: "North East"
  //   },
  // ];
  // locList = [
  //   {
  //     id: "CESRD",
  //   name: "Shankar Road"
  //   },
  //   {
  //     id: "ESKKD",
  //     name: "Karkardooma"
  //   },
  //   {
  //     id: "EN",
  //     name: "North East"
  //   },
  // ];
  circleList: any = [];
  divList: any = [];
  locList: any = [];
  roleList: any = [];
  emp_code: string | null = '';

  get f() { return this.editForm.controls as { [key: string]: any }; }
  constructor(private roleservice: RoleService,private fb: FormBuilder, private dashboardservice: DashboardService, private locationservice: LocationService, private storageservice: StorageService, private inchargeservice: InchargesService, private popupservice: PopupService) {
    this.editForm = this.fb.group({
      id: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      name: ['', [Validators.required, Validators.pattern(/^[A-Za-z\/,\-' ]+$/)]],
      mob: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      circle: ['', Validators.required],
      div: ['', Validators.required],
      loc: ['', Validators.required],
      role: ['', Validators.required],
      status: ['', Validators.required],
    });
  }
  async ngOnInit() {
    this.emp_code = await this.storageservice.getUser();
    this.getAllCircle();
    this.getAllRole();
  }
  getAllCircle() {
    this.dashboardservice.getAllCircle().subscribe({
      next: (data) => {
        this.circleList = data;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }
  onCircleChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedCircleId = target.value;
    if (selectedCircleId) {
      this.dashboardservice.getAllDivision(selectedCircleId).subscribe({
        next: (data) => {
          this.divList = data;
          this.editForm.get('div')?.setValue('');
        },
        error: (error) => {
          console.error('Error fetching data:', error);
        },
      });
    } else {
      this.divList = [];
      this.editForm.get('div')?.setValue('');
    }
  }
  onDivChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedDivId = target.value;
    if (selectedDivId) {
      this.locationservice.getLocation(selectedDivId).subscribe({
        next: (data) => {
          this.locList = data;
          this.editForm.get('loc')?.setValue('');
        },
        error: (error) => {
          console.error('Error fetching data:', error);
        },
      });
    } else {
      this.locList = [];
      this.editForm.get('loc')?.setValue('');
    }
  }
  getAllRole() {
    this.roleservice.getAllRole().subscribe({
      next: (data) => {
        console.log('Role list: ',data);
        this.roleList = data;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }
  onSubmit() {
    console.log('Profile Updated:', this.editForm.value);
    const body = {
      emp_code: this.editForm.value.id,
      emp_name: this.editForm.value.name,
      email_id: this.editForm.value.email,
      mob: this.editForm.value.mob.toString(),
      circle: this.editForm.value.circle,
      div: this.editForm.value.div,
      loc: this.editForm.value.loc,
      role: this.editForm.value.role,
      status: this.editForm.value.status,
      created_by: this.emp_code,
    }
    this.inchargeservice.addincharge(body).subscribe({
      next: (data) => {
        console.log(data);
        this.popupservice.showPopup('success', 'Incharge added successfully.');
        this.editForm.reset();
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.editForm.reset();
        this.popupservice.showPopup('error', 'Error in adding incharge.');
      },
    });
  }
}
