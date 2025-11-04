import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InchargesService } from '../../services/incharges/incharges.service';
import { StorageService } from '../../services/storage/storage.service';
import { PopupService } from '../../services/popup/popup.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  @Output() formSubmitted = new EventEmitter<void>();
  router = inject(Router);
  profileForm: FormGroup;
  id: string | null = '';
  cnt: string | null = '';
  circle: string  | null = '';
  div: string  | null = '';
  loc: string  | null = '';
  roleId: string  | null = '';

  constructor(private fb: FormBuilder,private inchargeservice: InchargesService,private storageservice: StorageService,private popupservice: PopupService) {
    this.profileForm = this.fb.group({
      id: [{ value: '', disabled: true }],
      emp_code: [{ value: '', disabled: true }],
      emp_name: ['', [Validators.required,Validators.pattern(/^[A-Za-z0-9\s.,'_&\/-]*$/)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      circle: [{ value: '', disabled: true }],
      division: [{ value: '', disabled: true }],
      locations: this.fb.array([]),
      role: [{ value: '', disabled: true }],
      status: [{ value: '', disabled: true }],
    });

  }
  async ngOnInit() {
    this.id = await this.storageservice.getUser();
    this.cnt = await this.storageservice.getUserMob();
    this.getdetails();      
  }


  get f() { return this.profileForm.controls as { [key: string]: any }; }

  getdetails(){
    console.log('this.id',this.id);
    this.inchargeservice.getIncharge(this.id?this.id:"",this.cnt?this.cnt:"").subscribe({
      next: (data) => {
        if(data.id == this.id){
          this.profileForm.patchValue({
            id: data.id,
            emp_code: data.emp_code,
            emp_name: data.emp_name,
            email: data.email_id,
            phone: data.mobile_no,
            circle: data.circle,
            division: data.division,
            role: data.role,
            status: data.status
          })
          const locationsArray = this.profileForm.get('locations') as FormArray;
          locationsArray.clear();
          if (data.locations && data.locations.length > 0) {
            data.locations.forEach((loc: any) => {
              locationsArray.push(this.fb.control(loc.loc_name));
            });
          }
          this.circle = data.circle_code;
          this.div = data.div_code;
          this.roleId = data.role_id;
        }else{
          this.popupservice.showPopup('error', 'Error in fetching profile details.');
        }
        
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }
 
  resetForm() {
    this.profileForm.reset();
  }

  onSubmit() {
      const body = {
        id:this.id,
        emp_code:this.profileForm.getRawValue().emp_code,
        emp_name:this.profileForm.value.emp_name,
        email_id:this.profileForm.value.email,
        mob:this.profileForm.value.phone.toString(),
        updated_by:this.id
      }
      this.inchargeservice.updateprofileincharge(body).subscribe({
        next: (data) => {
          this.popupservice.showPopup('success', 'Profile updated successfully.');
          this.storageservice.storeUserMob(this.profileForm.value.phone.toString());
          this.formSubmitted.emit();
        },
        error: (error) => {
          console.error('Error fetching data:', error);
          this.resetForm();
          this.popupservice.showPopup('error', 'Error in profile update.');
        },
      });

   
  }
}


