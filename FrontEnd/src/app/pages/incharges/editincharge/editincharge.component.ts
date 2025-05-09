import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  
  circleList: any = [];
  divList: any = [];
  locList: any = [];
  roleList: any = [];
  tb_id: string | null = '';
  cnt: string | null = '';

  get f() { return this.editForm.controls as { [key: string]: any }; }


  constructor(private refreshService: RefreshService,private fb: FormBuilder, private dashboardservice: DashboardService,private roleservice: RoleService, private locationservice: LocationService, private storageservice: StorageService, private inchargeservice: InchargesService, private popupservice: PopupService) {
    // Initialize the form with empty values
    this.editForm = this.fb.group({
      table_id: [''],
      id: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      name: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9\s.,'_-]*$/)]],
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
    this.tb_id = await this.storageservice.getUser();
    this.cnt = await this.storageservice.getUserMob();
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
  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && this.user) {
      this.inchargeservice.getIncharge(this.user.ID.toString(),this.user.MOBILE_NO.toString()).subscribe({
        next: (data) => {
          if (this.circleList && data[0].CIRCLE_CODE) {
            this.dashboardservice.getAllDivision(data[0].CIRCLE_CODE).subscribe({
              next: (data2) => {
                this.divList = data2;
                if (this.divList && data[0].DIV_CODE) {
                  this.locationservice.getLocation(data[0].DIV_CODE).subscribe({
                    next: (data3) => {
                      this.locList = data3;
                      this.editForm.enable();
                      this.editForm.patchValue({
                        table_id: this.user.ID,
                        id: this.user.EMP_CODE,
                        name: this.user.EMP_NAME,
                        mob: data[0].MOBILE_NO.toString(),
                        email: data[0].EMAIL_ID,
                        circle: data[0].CIRCLE_CODE,
                        div: data[0].DIV_CODE,
                        loc: data[0].LOC_CODE,
                        role: data[0].ROLE_ID,
                        status: data[0].STATUS
                      });
                    },
                    error: (error) => {
                      console.error('Error fetching data:', error);
                    },
                  });
                }
              },
              error: (error) => {
                console.error('Error fetching data:', error);
              },
            });
          }
        },
        error: (error) => {
          console.error('Error fetching data:', error);
          this.editForm.reset();
          this.popupservice.showPopup('error', 'Error in fetching incharge details.');
        },
      });
    } else {
      // If user is null, disable the form fields
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
  onSubmit() {
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
