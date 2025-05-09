import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { CheckpointService } from '../../../services/checkpoint/checkpoint.service';
import { PopupService } from '../../../services/popup/popup.service';
import { InchargesService } from '../../../services/incharges/incharges.service';
import { StorageService } from '../../../services/storage/storage.service';
import { ChecklistService } from '../../../services/checklist/checklist.service';
import { Router } from '@angular/router';
export interface CheckList {
  id: number;
  type: string;
  name: string;
  status: string;
  remarks: string;
  photo: File | null;
  filename: string;
  filedata: Blob;
}
export interface Checkpoint {
  id: string;
  type_id: string;
  type_name: string;
  NAME: string;
  ROLE_ID: string;
  role_name: string;
  status: string;
  remarks: string;
  FILENAME: string;
  FILEDATA: Blob;
}
@Component({
  selector: 'app-addchecklist',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './addchecklist.component.html',
  styleUrl: './addchecklist.component.css'
})
export class AddchecklistComponent {

  emp_code: string | null = '';
  cnt: string | null = '';
  division: string | null = '';
  division_code: string | null = '';
  location: string | null = '';
  location_code: string | null = '';
  checkpt: Checkpoint[] = [];
  checkPointList: CheckList[] = [];
  checkpointForm: FormGroup;
  groupedCheckpoints: { [key: string]: CheckList[] } = {};
  public Object = Object;
  private collapsedTypes: Set<string> = new Set();


  constructor(private router: Router, private fb: FormBuilder, private checklistservice: ChecklistService, private checkpointservice: CheckpointService, private popupservice: PopupService,
    private inchargeservice: InchargesService, private storageservice: StorageService) {
    this.checkpointForm = this.fb.group({
      checklistID: [{ value: this.generateChecklistID(), disabled: true }, Validators.required],
      empCode: [{ value: '', disabled: true }, Validators.required],
      division: [{ value: '', disabled: true }, Validators.required],
      location: [{ value: '', disabled: true }, Validators.required],
      checkpoints: this.fb.array(this.checkPointList.map(checkpoint => {
        const grp = this.fb.group({
          id: [checkpoint.id],
          type: [checkpoint.type],
          name: [checkpoint.name],
          status: [checkpoint.status],
          remarks: [checkpoint.remarks],
          photo: [checkpoint.photo]
        });
        // Listen to status changes
        grp.get('status')?.valueChanges.subscribe(status => {
          if (status === 'NOT OK') {
            grp.get('remarks')?.setValidators([Validators.required,Validators.pattern(/^[A-Za-z0-9\s.,'_-]*$/)]);
          } else {
            grp.get('remarks')?.clearValidators();
          }
          grp.get('remarks')?.updateValueAndValidity();
        });
        return grp;
      }))
    });
  }
  async ngOnInit() {
    this.emp_code = await this.storageservice.getUser();
    this.cnt = await this.storageservice.getUserMob();
    this.getdetails();
    this.getcheckpoints();
    this.groupCheckpointsByType();
    this.checkPointList.forEach(checkpoint => this.collapsedTypes.add(checkpoint.type));
  }
  initializeForm() {
    this.checkpointForm = this.fb.group({
      checklistID: [{ value: this.generateChecklistID(), disabled: true }, Validators.required],
      empCode: [{ value: this.emp_code, disabled: true }, Validators.required],
      division: [{ value: this.division, disabled: true }, Validators.required],
      location: [{ value: this.location, disabled: true }, Validators.required],
      checkpoints: this.fb.array(this.checkPointList.map(checkpoint => {
        const grp = this.fb.group({
          id: [checkpoint.id],
          type: [checkpoint.type],
          name: [checkpoint.name],
          status: [checkpoint.status],
          remarks: [checkpoint.remarks],
          photo: [checkpoint.photo]
        });
        // Listen to status changes
        grp.get('status')?.valueChanges.subscribe(status => {
          if (status === 'NOT OK') {
            grp.get('remarks')?.setValidators([Validators.required,Validators.pattern(/^[A-Za-z0-9\s.,'_-]*$/)]);
          } else {
            grp.get('remarks')?.clearValidators();
          }
          grp.get('remarks')?.updateValueAndValidity();
        });

        return grp;
      }))
    });
  }
  getdetails() {
    this.inchargeservice.getIncharge(this.emp_code ? this.emp_code : "",this.cnt ? this.cnt : "").subscribe({
      next: (data) => {
        this.emp_code = data[0].EMP_CODE;
        this.division = data[0].DIVISION;
        this.division_code = data[0].DIV_CODE;
        this.location = data[0].LOCATION;
        this.location_code = data[0].LOC_CODE;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }
  getcheckpoints() {
    this.checkpointservice.getAllCheckpoint().subscribe({
      next: (data) => {
        this.checkpt = data;
        this.checkPointList = this.checkpt.map(e => ({
          id: parseInt(e.id, 10),
          type: e.type_name,
          name: e.NAME,
          status: "OK",
          remarks: "",
          photo: null,
          filename: "",
          filedata: new Blob([])
        }));
        this.groupCheckpointsByType();
        this.checkPointList.forEach(checkpoint => this.collapsedTypes.add(checkpoint.type));
        this.initializeForm();
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }
  groupCheckpointsByType() {
    this.checkPointList.forEach(checkpoint => {
      if (!this.groupedCheckpoints[checkpoint.type]) {
        this.groupedCheckpoints[checkpoint.type] = [];
      }
      this.groupedCheckpoints[checkpoint.type].push(checkpoint);
    });
  }
  private generateChecklistID(): string {
    const date = new Date();
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${this.location_code}/${month}-${year}`;
  }
  get checkpoints2(): FormArray {
    return this.checkpointForm.get('checkpoints') as FormArray;
  }
  // onFileChange(event: any, index: number) {
  //   const fileInput = event.target as HTMLInputElement;
  //   if (fileInput.files && fileInput.files.length > 0) {
  //     const file = fileInput.files[0];

  //     // Convert file to base64 string (if needed)
  //     const reader = new FileReader();
  //     reader.readAsDataURL(file);
  //     reader.onload = () => {
  //       const fileData = reader.result as string; // Base64 encoded file data

  //       // Update the form control with file name and data
  //       const checkpointsArray = this.checkpointForm.get('checkpoints') as FormArray;
  //       checkpointsArray.at(index).patchValue({
  //         photo: { name: file.name, data: fileData }  // Store both name and data
  //       });

  //       console.log('Updated Form:', this.checkpointForm.value);
  //     };
  //   }

  // }
  getCheckpointControl(index: number): FormGroup {
    return (this.checkpointForm.get('checkpoints') as FormArray).at(index) as FormGroup;
  }
  onFileChange(event: any, index: number) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
  
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
  
      const maxSizeInMB = 10;
  
      const checkpointsArray = this.checkpointForm.get('checkpoints') as FormArray;
      const checkpointControl = checkpointsArray.at(index);
  
      // Clear previous error
      checkpointControl.get('photo')?.setErrors(null);
  
      if (!allowedTypes.includes(file.type)) {
        checkpointControl.get('photo')?.setErrors({ invalidType: true });
        return;
      }
  
      if (file.size > maxSizeInMB * 1024 * 1024) {
        checkpointControl.get('photo')?.setErrors({ maxSizeExceeded: true });
        return;
      }
  
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const fileData = reader.result as string; // Base64 encoded
  
        checkpointControl.patchValue({
          photo: { name: file.name, data: fileData }
        });
  
      };
    }
  }
  

  // onsubmit() {
  //   if (this.checkpointForm.valid) {
  //     console.log('Updated Checkpoints2:', this.checkpointForm.getRawValue());
  //     const body = {
  //       checklist_id: this.checkpointForm.getRawValue().checklistID,
  //       div: this.division_code,
  //       emp_code: this.checkpointForm.getRawValue().empCode,
  //       loc: this.location_code,
  //       checkpoint: (this.checkpointForm.value.checkpoints as Array<{
  //         id: string;
  //         status: string;
  //         remarks?: string;
  //         photo?: { name: string; data: string }
  //       }>).map((checkpoint) => ({
  //         checkpoint_id: checkpoint.id.toString(),
  //         status: checkpoint.status.toUpperCase(),
  //         remarks: checkpoint.remarks || "",
  //         filename: checkpoint.photo ? checkpoint.photo.name : "",
  //         filedata: checkpoint.photo ? checkpoint.photo.data : ""
  //       }))
  //     }
  //     console.log('Body:', body);
  //     this.checklistservice.addchecklist(body).subscribe({
  //       next: (data) => {
  //         console.log(data);
  //         this.popupservice.showPopup('success', 'Checklist submitted successfully.');
  //         this.checkpointForm.reset();
  //       },
  //       error: (error) => {
  //         console.error('Error fetching data:', error);
  //         this.checkpointForm.reset();
  //         this.popupservice.showPopup('error', 'Error in submitting checklist.');
  //       },
  //     });
  //   } else {
  //     this.checkpointForm.markAllAsTouched();
  //     this.popupservice.showPopup('error', 'Please fill the form correctly.');
  //   }
  // }
  onsubmit() {
    if (this.checkpointForm.valid) {

      const formData = new FormData();

      formData.append('checklist_id', this.checkpointForm.getRawValue().checklistID);
      formData.append('div', this.division_code ?? '');
      formData.append('emp_code', this.checkpointForm.getRawValue().empCode);
      formData.append('loc', this.location_code ?? '');

      // Convert `checkpoints` to JSON string and append
      formData.append('checkpoint', JSON.stringify(
        (this.checkpointForm.value.checkpoints as Array<{
                  id: string;
                  status: string;
                  remarks?: string;
                  photo?: { name: string; data: string }
                }>).map((checkpoint) => ({
          checkpoint_id: checkpoint.id.toString(),
          status: checkpoint.status.toUpperCase(),
          remarks: checkpoint.remarks || '',
          filename: checkpoint.photo ? checkpoint.photo.name : '',
        }))
      ));

      // Append files if available
      (this.checkpointForm.value.checkpoints as Array<{
                id: string;
                status: string;
                remarks?: string;
                photo?: { name: string; data: string; type: string }
              }>).forEach((checkpoint) => {
        if (checkpoint.photo && checkpoint.photo.data) {
          const byteCharacters = atob(checkpoint.photo.data.split(',')[1]); // Decode base64
          const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));
          const byteArray = new Uint8Array(byteNumbers);
          const fileBlob = new Blob([byteArray], { type: checkpoint.photo.type }); // Create Blob

          formData.append('files', fileBlob, checkpoint.photo.name);
        }
      });

      // Send FormData
      this.checklistservice.addchecklist(formData).subscribe({
        next: (data) => {
          this.popupservice.showPopup('success', 'Checklist submitted successfully.');
          this.checkpointForm.reset();
        },
        error: (error) => {
          console.error('Error fetching data:', error);
          this.popupservice.showPopup('error', 'Error in submitting checklist.');
          this.checkpointForm.reset();
          this.router.navigate(['checklist']);
        },
      });

    }
  }

  nonEmptyValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value || control.value.trim() === '') {
        return { required: true };
      }
      return null;
    };
  }
  toggleCollapse(type: string): void {
    if (this.collapsedTypes.has(type)) {
      this.collapsedTypes.delete(type);
    } else {
      this.collapsedTypes.add(type);
    }
  }
  isCollapsed(type: string): boolean {
    return this.collapsedTypes.has(type);
  }
}


