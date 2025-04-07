import { CommonModule } from '@angular/common';
import { Component, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PopupService } from '../../../services/popup/popup.service';
import { CheckpointService } from '../../../services/checkpoint/checkpoint.service';
import { RoleService } from '../../../services/role/role.service';
@Component({
  selector: 'app-addcheckpt',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './addcheckpt.component.html',
  styleUrl: './addcheckpt.component.css'
})
export class AddcheckptComponent {
 editForm: FormGroup;

 roleList: any = [];
typeList: any = [];
 
  get f() { return this.editForm.controls as { [key: string]: any }; }


  constructor(private roleservice:RoleService, private fb: FormBuilder,private popupservice: PopupService,private checkpointservice: CheckpointService) {
    // Initialize the form with empty values
    this.editForm = this.fb.group({
      type: ['', Validators.required],
      name: ['', Validators.required],
      fwdrole: ['', Validators.required],
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



  onSubmit() {
    console.log('Profile Updated:', this.editForm.value);
      const body = {
        name:this.editForm.value.name,
        type:this.editForm.value.type,
        fwdrole:this.editForm.value.fwdrole
      }
      this.checkpointservice.addcheckpoint(body).subscribe({
        next: (data) => {
          console.log(data);
          this.popupservice.showPopup('success', 'Checkpoint added successfully.');
          this.editForm.reset();
        },
        error: (error) => {
          console.error('Error fetching data:', error);
          this.editForm.reset();
          this.popupservice.showPopup('error', 'Error in adding checkpoint.');
        },
      });
    
  }
    
}
