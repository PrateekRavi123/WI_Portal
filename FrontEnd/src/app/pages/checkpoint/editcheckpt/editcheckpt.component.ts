import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PopupService } from '../../../services/popup/popup.service';
import { CheckpointService } from '../../../services/checkpoint/checkpoint.service';
import { QuickviewComponent } from '../../checklist/quickview/quickview.component';
import { Router } from '@angular/router';
import { RefreshService } from '../../../services/refresh/refresh.service';
import { RoleService } from '../../../services/role/role.service';

@Component({
  selector: 'app-editcheckpt',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './editcheckpt.component.html',
  styleUrl: './editcheckpt.component.css'
})
export class EditcheckptComponent {
  @Output() formSubmitted = new EventEmitter<void>();
  @Input() user: any | null = null;
  editForm: FormGroup;
  roleList: any = [];
  typeList: any = [];

 
  get f() { return this.editForm.controls as { [key: string]: any }; }


  constructor(private roleservice: RoleService, private refreshService: RefreshService,private fb: FormBuilder,private popupservice: PopupService,private checkpointservice: CheckpointService) {
    // Initialize the form with empty values
    this.editForm = this.fb.group({
      type: [{ value: '', disabled: true }, Validators.required],
      name: [{ value: '', disabled: true }, Validators.required],
      fwdrole: [{ value: '', disabled: true }, Validators.required],
    });
  }
  async ngOnInit() {
    this.getAllRole();
    this.getAllType();
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
  
  getAllType() {
    this.checkpointservice.getallcheckpointtype().subscribe({
      next: (data) => {
        console.log('Role list: ',data);
        this.typeList = data;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && this.user && this.roleList && this.typeList) {
      console.log('User:', this.user);
      // Enable the form fields and set their values when user input is set
      this.editForm.enable();
      this.editForm.patchValue({
        type: this.user.type_id,
        name: this.user.NAME,
        fwdrole: this.user.ROLE_ID,
      });
    } else {
      // If user is null, disable the form fields
      this.editForm.reset();
      this.editForm.disable();
    }
  }


  onSubmit() {
    console.log('Profile Updated:', this.editForm.value);
      const body = {
        id: String(this.user.id),
        name:this.editForm.value.name,
        type:this.editForm.value.type,
        fwdrole:this.editForm.value.fwdrole
      }
      console.log('update body: ',body);
      this.checkpointservice.updatecheckpoint(body).subscribe({
        next: (data) => {
          console.log(data);
          this.popupservice.showPopup('success', 'Checkpoint updated successfully.');
          this.editForm.reset();
          this.formSubmitted.emit();
          this.refreshService.triggerRefresh();
        },
        error: (error) => {
          console.error('Error fetching data:', error);
          this.editForm.reset();
          this.popupservice.showPopup('error', 'Error in updating checkpoint.');
        },
      });
    
  }
    
  
}
