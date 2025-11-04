import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { CheckpointService } from '../../../services/checkpoint/checkpoint.service';
import { PopupService } from '../../../services/popup/popup.service';
import { InchargesService } from '../../../services/incharges/incharges.service';
import { StorageService } from '../../../services/storage/storage.service';
import { ChecklistService } from '../../../services/checklist/checklist.service';
import { Router } from '@angular/router';
export interface Location {
  loc_id: string;
  loc_name: string;
}
export interface CheckList {
  ID: number;
  TYPE: string;
  NAME: string;
  STATUS: string;
  REMARKS: string;
  PHOTO: File | null;
  FILENAME: string;
  FILEDATA: Blob;
  PHOTO2: File | null;
  FILENAME2: string;
  FILEDATA2: Blob;
  PHOTO3: File | null;
  FILENAME3: string;
  FILEDATA3: Blob;
}
export interface Checkpoint {
  ID: string;
  TYPE_ID: string;
  TYPE_NAME: string;
  NAME: string;
  ROLE_ID: string;
  ROLE_NAME: string;
  STATUS: string;
  REMARKS: string;
  FILENAME: string;
  FILEDATA: Blob;
  FILENAME2: string;
  FILEDATA2: Blob;
  FILENAME3: string;
  FILEDATA3: Blob;
}
@Component({
  selector: 'app-addchecklist',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './addchecklist.component.html',
  styleUrl: './addchecklist.component.css'
})
export class AddchecklistComponent {
  emp_id: string | null = '';
  emp_code: string | null = '';
  cnt: string | null = '';
  division: string | null = '';
  division_code: string | null = '';
  location: string | null = '';
  location_code: string | null = '';
  loclist: Location[] = [];
  checkpt: Checkpoint[] = [];
  checkPointList: CheckList[] = [];
  checkpointForm: FormGroup;
  groupedCheckpoints: { [key: string]: CheckList[] } = {};
  public Object = Object;
  private collapsedTypes: Set<string> = new Set();


  constructor(private router: Router, private fb: FormBuilder, private checklistservice: ChecklistService, private checkpointservice: CheckpointService, private popupservice: PopupService,
    private inchargeservice: InchargesService, private storageservice: StorageService) {
    this.checkpointForm = this.fb.group({
      checklistID: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_]+\/[A-Z]{3}-\d{4}$/)]],
      empCode: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      division: ['', [Validators.required]],
      location: ['', [Validators.required]],
      checkpoints: this.fb.array(this.checkPointList.map(checkpoint => {
        const grp = this.fb.group({
          id: [checkpoint.ID],
          type: [checkpoint.TYPE],
          name: [checkpoint.NAME],
          status: [checkpoint.STATUS],
          remarks: [checkpoint.REMARKS],
          photo: [checkpoint.PHOTO],
          photo2: [checkpoint.PHOTO2],
          photo3: [checkpoint.PHOTO3]
        });
        // Listen to status changes
        grp.get('status')?.valueChanges.subscribe(status => {
          if (status === 'NOT OK') {
            grp.get('remarks')?.setValidators([Validators.required, Validators.pattern(/^[A-Za-z0-9\s.,'_&\/-]*$/)]);
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
    this.emp_id = await this.storageservice.getUser();
    this.cnt = await this.storageservice.getUserMob();
    this.getcheckpoints();
  }
  initializeForm() {
    this.checkpointForm = this.fb.group({
      checklistID: [this.generateChecklistID(), [Validators.required, Validators.pattern(/^[A-Z0-9_]+\/[A-Z]{3}-\d{4}$/)]],
      empCode: [this.emp_code, [Validators.required, Validators.pattern(/^\d{8}$/)]],
      division: [this.division, [Validators.required]],
      location: [this.location, [Validators.required]],
      checkpoints: this.fb.array(this.checkPointList.map(checkpoint => {
        const grp = this.fb.group({
          id: [checkpoint.ID],
          type: [checkpoint.TYPE],
          name: [checkpoint.NAME],
          status: [checkpoint.STATUS],
          remarks: [checkpoint.REMARKS],
          photo: [checkpoint.PHOTO],
          photo2: [checkpoint.PHOTO2],
          photo3: [checkpoint.PHOTO3]
        });
        // Listen to status changes
        grp.get('status')?.valueChanges.subscribe(status => {
          if (status === 'NOT OK') {
            grp.get('remarks')?.setValidators([Validators.required, Validators.pattern(/^[A-Za-z0-9\s.,'_&\/-]*$/)]);
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
    this.inchargeservice.getIncharge(this.emp_id ? this.emp_id : "", this.cnt ? this.cnt : "").subscribe({
      next: (data) => {
        console.log(data);
        this.emp_code = data.emp_code;
        this.division = data.division;
        this.division_code = data.division_code;
        this.loclist = data.locations;
        this.location_code = this.loclist[0]?.loc_id;
        this.location = this.loclist[0]?.loc_name || '';
        this.initializeForm();
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }
  getcheckpoints() {
    this.checkpointservice.getallactivecheckpoint().subscribe({
      next: (data) => {
        this.checkpt = data;
        this.checkPointList = this.checkpt.map(e => ({
          ID: parseInt(e.ID, 10),
          TYPE: e.TYPE_NAME,
          NAME: e.NAME,
          STATUS: "OK",
          REMARKS: "",
          PHOTO: null,
          FILENAME: "",
          FILEDATA: new Blob([]),
          PHOTO2: null,
          FILENAME2: "",
          FILEDATA2: new Blob([]),
          PHOTO3: null,
          FILENAME3: "",
          FILEDATA3: new Blob([])
        }));
        this.getdetails();
        this.groupCheckpointsByType();
        this.checkPointList.forEach(checkpoint => this.collapsedTypes.add(checkpoint.TYPE));
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }
  groupCheckpointsByType() {
    this.checkPointList.forEach(checkpoint => {
      if (!this.groupedCheckpoints[checkpoint.TYPE]) {
        this.groupedCheckpoints[checkpoint.TYPE] = [];
      }
      this.groupedCheckpoints[checkpoint.TYPE].push(checkpoint);
    });
  }
  private generateChecklistID(): string {
    if (!this.location_code) return '';
    const date = new Date();
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${this.location_code}/${month}-${year}`;
  }
  get checkpoints2(): FormArray {
    return this.checkpointForm.get('checkpoints') as FormArray;
  }
  onLocationChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedValue = target.value;
    this.location_code = selectedValue;
    const selectedLoc = this.loclist.find(l => l.loc_id === selectedValue);
    this.location = selectedLoc ? selectedLoc.loc_name : '';
    this.initializeForm();
  }

  getCheckpointControl(index: number): FormGroup {
    return (this.checkpointForm.get('checkpoints') as FormArray).at(index) as FormGroup;
  }

  onFileChange(event: any, index: number, fileNumber: number) {
  const fileInput = event.target as HTMLInputElement;
  if (fileInput.files && fileInput.files.length > 0) {
    const file = fileInput.files[0];

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/jpg',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const maxSizeInMB = 10;

    const checkpointsArray = this.checkpointForm.get('checkpoints') as FormArray;
    const checkpointControl = checkpointsArray.at(index);

    // Determine which photo field to patch
    const field = `photo${fileNumber > 1 ? fileNumber : ''}`; // photo, photo2, photo3

    checkpointControl.get(field)?.setErrors(null);

    if (!allowedTypes.includes(file.type)) {
      checkpointControl.get(field)?.setErrors({ invalidType: true });
      return;
    }

    if (file.size > maxSizeInMB * 1024 * 1024) {
      checkpointControl.get(field)?.setErrors({ maxSizeExceeded: true });
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const fileData = reader.result as string;
      checkpointControl.patchValue({
        [field]: { name: file.name, data: fileData, type: file.type }
      });
    };
  }
}

onsubmit() {
  if (this.checkpointForm.valid) {
    const formData = new FormData();

    formData.append('checklist_id', this.checkpointForm.getRawValue().checklistID);
    formData.append('div', this.division_code ?? '');
    formData.append('emp_code', this.emp_id ?? '');
    formData.append('loc', this.location_code ?? '');

    const checkpoints = this.checkpointForm.value.checkpoints;

    // Convert checkpoints to JSON (filenames only)
    formData.append('checkpoint', JSON.stringify(
      checkpoints.map((c: any) => ({
        checkpoint_id: c.id,
        status: c.status.toUpperCase(),
        remarks: c.remarks || '',
        filename: c.photo?.name || '',
        filename2: c.photo2?.name || '',
        filename3: c.photo3?.name || ''
      }))
    ));

    // Append actual files to FormData
    checkpoints.forEach((c: any, index: number) => {
      ['photo', 'photo2', 'photo3'].forEach((field, fIndex) => {
        if (c[field]?.data) {
          const byteCharacters = atob(c[field].data.split(',')[1]);
          const byteNumbers = Array.from(byteCharacters).map(ch => ch.charCodeAt(0));
          const byteArray = new Uint8Array(byteNumbers);
          formData.append(`file_${index}_${fIndex + 1}`, new Blob([byteArray], { type: c[field].type }), c[field].name);
        }
      });
    });

    this.checklistservice.addchecklist(formData).subscribe({
      next: () => {
        this.popupservice.showPopup('success', 'Checklist submitted successfully.');
        this.checkpointForm.reset();
      },
      error: (error) => {
        console.error('Error submitting checklist:', error);
        this.popupservice.showPopup('error', 'Error in submitting checklist.');
      }
    });
  }
}

  // onsubmit() {
  //   if (this.checkpointForm.valid) {

  //     const formData = new FormData();

  //     formData.append('checklist_id', this.checkpointForm.getRawValue().checklistID);
  //     formData.append('div', this.division_code ?? '');
  //     formData.append('emp_code', this.emp_id ?? '');
  //     formData.append('loc', this.location_code ?? '');

  //     // Convert `checkpoints` to JSON string and append
  //     formData.append('checkpoint', JSON.stringify(
  //       (this.checkpointForm.value.checkpoints as Array<{
  //         id: string;
  //         status: string;
  //         remarks?: string;
  //         photo?: { name: string; data: string; }
  //         photo2?: { name: string; data: string; }
  //         photo3?: { name: string; data: string }
  //       }>).map((checkpoint) => ({
  //         checkpoint_id: checkpoint.id.toString(),
  //         status: checkpoint.status.toUpperCase(),
  //         remarks: checkpoint.remarks || '',
  //         filename: checkpoint.photo ? checkpoint.photo.name : '',
  //         filename2: checkpoint.photo2 ? checkpoint.photo2.name : '',
  //         filename3: checkpoint.photo3 ? checkpoint.photo3.name : ''
  //       }))
  //     ));

  //     // Append files if available
  //     (this.checkpointForm.value.checkpoints as Array<{
  //       id: string;
  //       status: string;
  //       remarks?: string;
  //       photo?: { name: string; data: string; type: string }
  //       photo2?: { name: string; data: string; type: string }
  //       photo3?: { name: string; data: string; type: string }
  //     }>).forEach((checkpoint,index) => {
  //       if (checkpoint.photo?.data) {
  //   const byteCharacters = atob(checkpoint.photo.data.split(',')[1]);
  //   const byteNumbers = Array.from(byteCharacters).map(c => c.charCodeAt(0));
  //   const byteArray = new Uint8Array(byteNumbers);
  //   formData.append(`file_${index}_1`, new Blob([byteArray], { type: checkpoint.photo.type }), checkpoint.photo.name);
  // }
  // if (checkpoint.photo2?.data) {
  //   const byteCharacters = atob(checkpoint.photo2.data.split(',')[1]);
  //   const byteNumbers = Array.from(byteCharacters).map(c => c.charCodeAt(0));
  //   const byteArray = new Uint8Array(byteNumbers);
  //   formData.append(`file_${index}_2`, new Blob([byteArray], { type: checkpoint.photo2.type }), checkpoint.photo2.name);
  // }
  // if (checkpoint.photo3?.data) {
  //   const byteCharacters = atob(checkpoint.photo3.data.split(',')[1]);
  //   const byteNumbers = Array.from(byteCharacters).map(c => c.charCodeAt(0));
  //   const byteArray = new Uint8Array(byteNumbers);
  //   formData.append(`file_${index}_3`, new Blob([byteArray], { type: checkpoint.photo3.type }), checkpoint.photo3.name);
  // }
  //     });

  //     // Send FormData
  //     this.checklistservice.addchecklist(formData).subscribe({
  //       next: (data) => {
  //         this.popupservice.showPopup('success', 'Checklist submitted successfully.');
  //         this.checkpointForm.reset();
  //       },
  //       error: (error) => {
  //         console.error('Error fetching data:', error);
  //         this.popupservice.showPopup('error', 'Error in submitting checklist.');
  //         this.checkpointForm.reset();
  //         this.router.navigate(['checklist']);
  //       },
  //     });

  //   }
  // }

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


