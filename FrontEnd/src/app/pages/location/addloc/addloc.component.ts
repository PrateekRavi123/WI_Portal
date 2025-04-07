import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PopupService } from '../../../services/popup/popup.service';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { LocationService } from '../../../services/location/location.service';

@Component({
  selector: 'app-addloc',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './addloc.component.html',
  styleUrl: './addloc.component.css'
})
export class AddlocComponent {

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
  circleList: any = [];
  divList: any = [];

 
  get f() { return this.editForm.controls as { [key: string]: any }; }


  constructor(private fb: FormBuilder,private locationservice: LocationService,private popupservice: PopupService,private dashboardservice: DashboardService) {
    // Initialize the form with empty values
    this.editForm = this.fb.group({
      circle: ['', Validators.required],
      div: ['', Validators.required],
      name: ['', Validators.required]
    });
  }


  async ngOnInit() {
    this.getAllCircle();
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

  

  onSubmit() {
    console.log('Profile Updated:', this.editForm.value);
    const body = {
      loc_name: this.editForm.value.name,
      circle: this.editForm.value.circle,
      div_code: this.editForm.value.div
    }
    console.log('body',body);
    this.locationservice.addlocation(body).subscribe({
      next: (data) => {
        console.log(data);
        this.popupservice.showPopup('success', 'Location added successfully.');
        this.editForm.reset();
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.editForm.reset();
        this.popupservice.showPopup('error', 'Error in adding location.');
      },
    });
  }
}
