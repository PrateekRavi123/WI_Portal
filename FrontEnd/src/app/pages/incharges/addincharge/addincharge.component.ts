import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  
  circleList: any = [];
  divList: any = [];
  locList: any = [];
  roleList: any = [];
  emp_code: string | null = '';
  allSelectedLocations: any[] = [];

  get f() { return this.editForm.controls as { [key: string]: any }; }
  get locationControls(): FormArray {
    return this.editForm.get('locations') as FormArray;
  }
  constructor(private roleservice: RoleService,private fb: FormBuilder, private dashboardservice: DashboardService, private locationservice: LocationService, private storageservice: StorageService, private inchargeservice: InchargesService, private popupservice: PopupService) {
    this.editForm = this.fb.group({
      id: ['', [ Validators.pattern(/^\d{8}$/)]],
      name: ['', [Validators.required,Validators.pattern(/^[A-Za-z0-9\s.,'_&\/-]*$/)]],
      mob: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      circle: ['', Validators.required],
      div: ['', Validators.required],
      locations: this.fb.array([]),
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
      this.onLocationCheckboxChange();
      this.locationservice.getActiveLocation('',selectedDivId).subscribe({
        next: (data) => {
          this.locList = data;
          // Preserve previously selected locations
        const previousSelected = this.allSelectedLocations;

        // Filter previous selections not in current division
        const remainingLocations = this.locationControls.controls.filter(ctrl =>
          previousSelected.some(l => l.loc_id === ctrl.value.loc_id)
        );

        this.locationControls.clear();

        // Re-add previous selections
        remainingLocations.forEach(ctrl => this.locationControls.push(ctrl));

        // Add new locations from the current division
        data.forEach((loc: { LOC_ID: any; loc_id: any; LOC_NAME: any; loc_name: any; }) => {
          const locId = loc.LOC_ID ?? loc.loc_id;
          const isSelected = previousSelected.some(l => l.loc_id === locId);

          if (!this.locationControls.controls.some(ctrl => ctrl.value.loc_id === locId)) {
            this.locationControls.push(this.fb.group({
              loc_id: locId,
              loc_name: loc.LOC_NAME ?? loc.loc_name,
              selected: isSelected
            }));
          }
        });

        this.locationControls.updateValueAndValidity();
        },
        error: (error) => {
          console.error('Error fetching data:', error);
        },
      });
    } else {
      this.locList = [];
    }
  }
  onLocationCheckboxChange() {
    this.allSelectedLocations = this.locationControls.controls
      .filter(ctrl => ctrl.value.selected)
      .map(ctrl => ({ loc_id: ctrl.value.loc_id, loc_name: ctrl.value.loc_name }));
  }
  getAllRole() {
    this.roleservice.getAllRole().subscribe({
      next: (data) => {
        this.roleList = data;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }
  onSubmit() {
    const selectedLocations = this.locationControls.controls
    .filter(ctrl => ctrl.value.selected)
    .map(ctrl => ctrl.value.loc_id);
    const body = {
      emp_code: this.editForm.value.id,
      emp_name: this.editForm.value.name,
      email_id: this.editForm.value.email,
      mob: this.editForm.value.mob.toString(),
      circle: this.editForm.value.circle,
      div: this.editForm.value.div,
      loc: selectedLocations,
      role: this.editForm.value.role,
      status: this.editForm.value.status,
      created_by: this.emp_code,
    }
    this.inchargeservice.addincharge(body).subscribe({
      next: (data) => {
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
