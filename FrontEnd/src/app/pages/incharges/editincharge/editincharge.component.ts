import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { LocationService } from '../../../services/location/location.service';
import { StorageService } from '../../../services/storage/storage.service';
import { InchargesService } from '../../../services/incharges/incharges.service';
import { PopupService } from '../../../services/popup/popup.service';
import { RoleService } from '../../../services/role/role.service';
import { RefreshService } from '../../../services/refresh/refresh.service';

@Component({
  selector: 'app-editincharge',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editincharge.component.html',
  styleUrl: './editincharge.component.css'
})
export class EditinchargeComponent {
  @Output() formSubmitted = new EventEmitter<void>();

  @Input() user: any | null = null;
  editForm: FormGroup;
  userIncharge: any;
  circleList: any = [];
  divList: any = [];
  locList: any = [];
  roleList: any = [];
  tb_id: string | null = '';
  cnt: string | null = '';
  allSelectedLocations: any[] = [];

  get f() { return this.editForm.controls as { [key: string]: any }; }


  constructor(private refreshService: RefreshService, private fb: FormBuilder, private dashboardservice: DashboardService, private roleservice: RoleService, private locationservice: LocationService, private storageservice: StorageService, private inchargeservice: InchargesService, private popupservice: PopupService) {
    // Initialize the form with empty values
    this.editForm = this.fb.group({
      table_id: [''],
      id: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      name: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9\s.,'_&\/-]*$/)]],
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
    this.tb_id = await this.storageservice.getUser();
    this.cnt = await this.storageservice.getUserMob();
    this.getAllRole();
  }
  getAllRole() {
    this.roleservice.getAllRole().subscribe({
      next: (data) => {
        this.roleList = data;
        this.getAllCircle();  // load circles after roles
      },
    });
  }

  getAllCircle() {
    this.dashboardservice.getAllCircle().subscribe({
      next: (data) => {
        this.circleList = data;
      },
    });
  }

  get locationControls(): FormArray {
    return this.editForm.get('locations') as FormArray;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && this.user) {
      // Fetch incharge first
      this.inchargeservice.getIncharge(this.user.id.toString(), this.user.mobile_no.toString())
        .subscribe(incharge => {
          this.userIncharge = incharge;
          console.log(this.userIncharge);
          // Fetch roles first
          this.roleservice.getAllRole().subscribe(roles => {
            this.roleList = roles;

            // Fetch circles next
            this.dashboardservice.getAllCircle().subscribe(circles => {
              this.circleList = circles;

              // Fetch divisions based on circle_code
              if (incharge.circle_code) {
                this.dashboardservice.getAllDivision(incharge.circle_code).subscribe(divs => {
                  this.divList = divs;

                  // Fetch locations based on division_code
                  if (incharge.division_code) {
                    this.locationservice.getActiveLocation(this.user.id.toString(), incharge.division_code).subscribe(locs => {
                      this.locList = locs;
                      // build a Set of assigned location IDs (robust to different key names and types)
                      const assignedLocIds = new Set<string>(
                        (incharge.locations || []).map((l: any) =>
                          String(l.loc_id ?? l.LOC_ID ?? l.LOCID ?? '').trim().toUpperCase()
                        )
                      );
                      // Populate from locs
                      this.locationControls.clear();
                      this.allSelectedLocations = [];
                      (incharge.locations || []).forEach((loc: any) => {
                        const locId = String(loc.loc_id ?? loc.LOC_ID ?? '').trim().toUpperCase();
                        const locName = loc.loc_name ?? loc.LOC_NAME ?? '';
                        this.locationControls.push(this.fb.group({
                          loc_id: locId,
                          loc_name: locName,
                          selected: true
                        }));
                        this.allSelectedLocations.push({ loc_id: locId, loc_name: locName });
                      });

                      // 2. Add current division’s available locations
                      locs.forEach((loc: any) => {
                        const locId = String(loc.loc_id ?? loc.LOC_ID ?? '').trim().toUpperCase();
                        const locName = loc.loc_name ?? loc.LOC_NAME ?? '';
                        const checked = assignedLocIds.has(locId);

                        // avoid duplicates
                        if (!this.locationControls.controls.some(ctrl => ctrl.value.loc_id === locId)) {
                          this.locationControls.push(this.fb.group({
                            loc_id: locId,
                            loc_name: locName,
                            selected: checked
                          }));
                          if (checked) {
                            this.allSelectedLocations.push({ loc_id: locId, loc_name: locName });
                          }
                        }
                      });
                      // Finally, patch the form
                      this.editForm.patchValue({
                        table_id: this.user.id,
                        id: this.user.emp_code,
                        name: this.user.emp_name,
                        mob: incharge.mobile_no.toString(),
                        email: incharge.email_id,
                        circle: incharge.circle_code,
                        div: incharge.division_code,
                        role: incharge.role_id,
                        status: incharge.status
                      });

                      this.editForm.enable();
                    });
                  }
                });
              }
            });
          });
        });
    } else {
      this.editForm.reset();
      this.editForm.disable();
    }
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

    if (!selectedDivId) {
      this.locList = [];
      return;
    }
    const currentlyChecked = this.locationControls.controls
      .filter(ctrl => ctrl.value.selected)
      .map(ctrl => ({
        loc_id: ctrl.value.loc_id,
        loc_name: ctrl.value.loc_name
      }));

    // Merge unique into allSelectedLocations
    this.allSelectedLocations = [
      ...this.allSelectedLocations.filter(
        old => !currentlyChecked.some(newLoc => newLoc.loc_id === old.loc_id)
      ),
      ...currentlyChecked
    ];

    this.locationservice.getActiveLocation(this.userIncharge.id, selectedDivId).subscribe({
      next: (data) => {
        this.locList = data;

        const previousSelected = this.allSelectedLocations;

        // Keep only already selected from other divisions
        const remainingLocations = this.locationControls.controls.filter(ctrl =>
          previousSelected.some(l => l.loc_id === ctrl.value.loc_id)
        );

        this.locationControls.clear();

        // Re-add preserved selections
        remainingLocations.forEach(ctrl => this.locationControls.push(ctrl));

        // Add fresh locations for this division
        data.forEach((loc: any) => {
          const locId = (loc.LOC_ID ?? loc.loc_id).toString().toUpperCase();
          const locName = loc.LOC_NAME ?? loc.loc_name;
          const isSelected = previousSelected.some(l => l.loc_id === locId);

          if (!this.locationControls.controls.some(ctrl => ctrl.value.loc_id === locId)) {
            this.locationControls.push(this.fb.group({
              loc_id: locId,
              loc_name: locName,
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
  }




  onLocationCheckboxChange() {
    this.allSelectedLocations = this.locationControls.controls
      .filter(ctrl => ctrl.value.selected)
      .map(ctrl => ({
        loc_id: ctrl.value.loc_id,
        loc_name: ctrl.value.loc_name
      }));
  }


  onSubmit() {
    const body = {
      emp_code: this.editForm.value.id,
      emp_name: this.editForm.value.name,
      email_id: this.editForm.value.email,
      mob: this.editForm.value.mob.toString(),
      circle: this.editForm.value.circle,
      div: this.editForm.value.div,
      loc: this.allSelectedLocations.map(l => l.loc_id),
      role: this.editForm.value.role,
      status: this.editForm.value.status,
      updated_by: this.tb_id,
      id: this.editForm.value.table_id.toString()
    }
    this.inchargeservice.updateincharge(body).subscribe({
      next: (data) => {
        this.popupservice.showPopup('success', 'Incharge updated successfully.');
        this.editForm.reset();
        this.formSubmitted.emit();
        this.refreshService.triggerRefresh();
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.editForm.reset();
        this.popupservice.showPopup('error', 'Error in updating incharge.');
      },
    });
  }
}
