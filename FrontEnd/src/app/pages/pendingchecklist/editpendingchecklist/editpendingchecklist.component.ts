import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RefreshService } from '../../../services/refresh/refresh.service';
import { LocationService } from '../../../services/location/location.service';
import { PopupService } from '../../../services/popup/popup.service';
import { DashboardService } from '../../../services/dashboard/dashboard.service';

@Component({
  selector: 'app-editpendingchecklist',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './editpendingchecklist.component.html',
  styleUrl: './editpendingchecklist.component.css'
})
export class EditpendingchecklistComponent {
 @Output() formSubmitted = new EventEmitter<void>();
  @Input() user: any | null = null;
  editForm: FormGroup;
  circleList: any = [];
  divList: any = [];

 
  get f() { return this.editForm.controls as { [key: string]: any }; }


  constructor(private refreshService: RefreshService, private fb: FormBuilder,private locationservice: LocationService,private popupservice: PopupService,private dashboardservice: DashboardService) {
    // Initialize the form with empty values
    this.editForm = this.fb.group({
      circle: ['', Validators.required],
      div: ['', Validators.required],
      name: ['', [Validators.required, Validators.pattern(/^[A-Za-z\/,\-' ]+$/)]], 
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && this.user) {
      console.log('User:', this.user);
      // Enable the form fields and set their values when user input is set
      if (this.circleList && this.user.circle_code) {
          console.log('circle code',this.user.circle_code);
          this.dashboardservice.getAllDivision(this.user.circle_code).subscribe({
            next: (data) => {
              this.divList = data;
              this.editForm.enable();
              this.editForm.patchValue({
                circle: this.user.circle_code,
                name: this.user.loc_name,
                div: this.user.div_code,
              });
            },
            error: (error) => {
              console.error('Error fetching data:', error);
            },
          });
          console.log('divlist',this.divList);
        }
      
    } else {
      // If user is null, disable the form fields
      this.editForm.reset();
      this.editForm.disable();
    }
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
    console.log('Profile Updated:', this.editForm.value);
    const body = {
      loc_id: this.user.loc_id,
      loc_name: this.editForm.value.name,
      circle: this.editForm.value.circle,
      div_code: this.editForm.value.div,
    }
    this.locationservice.updatelocation(body).subscribe({
      next: (data) => {
        console.log(data);
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
