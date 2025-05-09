import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PopupService } from '../../../services/popup/popup.service';
import { LocationService } from '../../../services/location/location.service';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { RefreshService } from '../../../services/refresh/refresh.service';
import { off } from 'node:process';

@Component({
  selector: 'app-editloc',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './editloc.component.html',
  styleUrl: './editloc.component.css'
})
export class EditlocComponent {
  @Output() formSubmitted = new EventEmitter<void>();
  @Input() user: any | null = null;
  editForm: FormGroup;
  officetypeList: any = [];
  circleList: any = [];
  divList: any = [];

 
  get f() { return this.editForm.controls as { [key: string]: any }; }


  constructor(private refreshService: RefreshService, private fb: FormBuilder,private locationservice: LocationService,private popupservice: PopupService,private dashboardservice: DashboardService) {
    // Initialize the form with empty values
    this.editForm = this.fb.group({
      circle: ['', Validators.required],
      div: ['', Validators.required],
      name: ['', [Validators.required, Validators.pattern(/^[A-Za-z\/,\-' ]+$/)]], 
      office_type: ['', Validators.required], 
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && this.user) {
      // Enable the form fields and set their values when user input is set
      if (this.circleList && this.user.circle_code) {
          this.dashboardservice.getAllDivision(this.user.circle_code).subscribe({
            next: (data) => {
              this.divList = data;
              this.editForm.enable();
              this.editForm.patchValue({
                circle: this.user.circle_code,
                name: this.user.loc_name,
                div: this.user.div_code,
                office_type: this.user.office_type,
              });
            },
            error: (error) => {
              console.error('Error fetching data:', error);
            },
          });
        }
      
    } else {
      // If user is null, disable the form fields
      this.editForm.reset();
      this.editForm.disable();
    }
  }

  async ngOnInit() {
    this.getAllCircle();
    this.getAllOfficeType();
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
  getAllOfficeType() {
    this.dashboardservice.getAllOfficeType().subscribe({
      next: (data) => {
        this.officetypeList = data;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }
  getAllDivision(selectedCircleId: string): void {
    this.dashboardservice.getAllDivision(selectedCircleId).subscribe({
      next: (data) => {
        this.divList = data;
        this.editForm.get('div')?.setValue('');
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
      this.getAllDivision(selectedCircleId);
    } else {
      this.divList = [];
      this.editForm.get('div')?.setValue('');
    }
  }

  

  onSubmit() {
    const body = {
      loc_id: this.user.loc_id,
      loc_name: this.editForm.value.name,
      circle: this.editForm.value.circle,
      div_code: this.editForm.value.div,
      OFFICE_TYPE: this.editForm.value.office_type,
    }
    this.locationservice.updatelocation(body).subscribe({
      next: (data) => {
        this.popupservice.showPopup('success', 'Location updated successfully.');
        this.editForm.reset();
        this.formSubmitted.emit();
        this.refreshService.triggerRefresh();
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.editForm.reset();
        this.popupservice.showPopup('error', 'Error in updating location.');
      },
    });
  }
}
