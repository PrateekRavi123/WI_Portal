import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { PopupService } from '../../../services/popup/popup.service';
import { RefreshService } from '../../../services/refresh/refresh.service';
import { CheckpointService } from '../../../services/checkpoint/checkpoint.service';
import { InchargesService } from '../../../services/incharges/incharges.service';
import { ChecklistService } from '../../../services/checklist/checklist.service';
import { StorageService } from '../../../services/storage/storage.service';
import { ActivatedRoute } from '@angular/router';
export interface CheckList {
  ID: number;
  TYPE: string;
  NAME: string;
  STATUS: string;
  REMARKS: string;
  PHOTO: File | null;
  FILENAME: string;
  FILEDATA: string;
  PHOTO2: File | null;
  FILENAME2: string;
  FILEDATA2: string;
  PHOTO3: File | null;
  FILENAME3: string;
  FILEDATA3: string;
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
  FILEDATA: string;
  FILENAME2: string;
  FILEDATA2: string;
  FILENAME3: string;
  FILEDATA3: string;
}
@Component({
  selector: 'app-editchecklist',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editchecklist.component.html',
  styleUrl: './editchecklist.component.css'
})
export class EditchecklistComponent {
  @Output() formSubmitted = new EventEmitter<void>();
  @Input() user: any | null = null;
  CHECKLIST_ID: string | null = '';
  emp_code: string | null = '';
  division: string | null = '';
  division_code: string | null = '';
  location: string | null = '';
  location_code: string | null = '';
  createdon: string | null = '';
  checkpt: Checkpoint[] = [];
  checkPointList: CheckList[] = [];
  editForm: FormGroup;
  groupedCheckpoints: { [key: string]: CheckList[] } = {};
  public Object = Object;
  private collapsedTypes: Set<string> = new Set();

  get f() { return this.editForm.controls as { [key: string]: any }; }


  constructor(private route: ActivatedRoute, private fb: FormBuilder, private checklistservice: ChecklistService, private checkpointservice: CheckpointService, private popupservice: PopupService,
    private inchargeservice: InchargesService, private storageservice: StorageService, private refreshService: RefreshService) {
    // Initialize the form with empty values
    this.editForm = this.fb.group({
      checklistID: [{ value: '', disabled: true }, Validators.required],
      empCode: [{ value: '', disabled: true }, Validators.required],
      division: [{ value: '', disabled: true }, Validators.required],
      location: [{ value: '', disabled: true }, Validators.required],
      createdon: [{ value: '', disabled: true }, Validators.required],
      checkpoints: this.fb.array(this.checkPointList.map(checkpoint => {
        const grp = this.fb.group({
          id: [checkpoint.ID],
          type: [checkpoint.TYPE],
          name: [checkpoint.NAME],
          status: [checkpoint.STATUS],
          remarks: [checkpoint.REMARKS],
          photo: [checkpoint.PHOTO],
          filename: [{ value: checkpoint.FILENAME, disabled: true }],
          filedata: [{ value: checkpoint.FILEDATA, disabled: true }],
          photo2: [checkpoint.PHOTO],
          filename2: [{ value: checkpoint.FILENAME, disabled: true }],
          filedata2: [{ value: checkpoint.FILEDATA, disabled: true }],
          photo3: [checkpoint.PHOTO],
          filename3: [{ value: checkpoint.FILENAME, disabled: true }],
          filedata3: [{ value: checkpoint.FILEDATA, disabled: true }]
        });
        // Listen to status changes
        grp.get('status')?.valueChanges.subscribe(status => {
          if (status === 'NOT OK') {
            grp.get('remarks')?.setValidators([Validators.required,Validators.pattern(/^[A-Za-z0-9\s.,'_&\/-]*$/)]);
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
    this.route.queryParams.subscribe(params => {
      this.CHECKLIST_ID = params['CHECKLIST_ID'];
    });
    this.emp_code = await this.storageservice.getUser();
    this.getdetails();
    this.getcheckpoints();
    this.groupCheckpointsByType();
    this.checkPointList.forEach(checkpoint => this.collapsedTypes.add(checkpoint.TYPE));
  }
  get checkpoints2(): FormArray {
    return this.editForm.get('checkpoints') as FormArray;
  }
  getcheckpoints() {
    const body = { checklist_id: this.CHECKLIST_ID }
    this.checklistservice.getchecklistcheckpoint(body).subscribe({
      next: (data) => {
        this.checkpt = data;
        this.checkPointList = this.checkpt.map(e => ({
          ID: parseInt(e.ID, 10),
          TYPE: e.TYPE_NAME,
          NAME: e.NAME,
          STATUS: e.STATUS,
          REMARKS: e.REMARKS,
          PHOTO: null,
          FILENAME: e.FILENAME,
          FILEDATA: e.FILEDATA,
          PHOTO2: null,
          FILENAME2: e.FILENAME2,
          FILEDATA2: e.FILEDATA2,
          PHOTO3: null,
          FILENAME3: e.FILENAME3,
          FILEDATA3: e.FILEDATA3
        }));
        this.groupCheckpointsByType();
        this.checkPointList.forEach(checkpoint => this.collapsedTypes.add(checkpoint.TYPE));
        this.initializeForm();
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
  getdetails() {
    const body = { checklist_id: String(this.CHECKLIST_ID) }
    this.checklistservice.getchecklist(body).subscribe({
      next: (data) => {
        this.emp_code = data[0].EMP_CODE;
        this.division = data[0].DIV;
        this.division_code = data[0].DIV_CODE;
        this.location = data[0].LOC;
        this.location_code = data[0].LOC_CODE;
        this.createdon = data[0].CREATED_ON;
        const date = new Date(data[0].CREATED_ON);
        this.createdon = date.toLocaleString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: true,
          timeZone: 'UTC'
        });
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && this.user) {
      // Enable the form fields and set their values when user input is set
      this.editForm.enable();
      this.editForm.patchValue({
        type: this.user.TYPE,
        name: this.user.NAME,
        fwdrole: this.user.FORWARD_ROLE,
      });
    } else {
      // If user is null, disable the form fields
      this.editForm.reset();
      this.editForm.disable();
    }
  }
  initializeForm() {
    this.editForm = this.fb.group({
      checklistID: [{ value: this.CHECKLIST_ID, disabled: true }, Validators.required],
      empCode: [{ value: this.emp_code, disabled: true }, Validators.required],
      division: [{ value: this.division, disabled: true }, Validators.required],
      location: [{ value: this.location, disabled: true }, Validators.required],
      createdon: [{ value: this.createdon, disabled: true }, Validators.required],
      checkpoints: this.fb.array(this.checkPointList.map(checkpoint => {
        const grp = this.fb.group({
          id: [checkpoint.ID],
          type: [checkpoint.TYPE],
          name: [checkpoint.NAME],
          status: [{ value: checkpoint.STATUS, disabled: true }],
          remarks: [{ value: checkpoint.REMARKS, disabled: true }],
          photo: [{ value: checkpoint.FILENAME, disabled: true }],
          filename: [{ value: checkpoint.FILENAME, disabled: true }],
          filedata: [{ value: checkpoint.FILEDATA, disabled: true }],
          photo2: [{ value: checkpoint.FILENAME2, disabled: true }],
          filename2: [{ value: checkpoint.FILENAME2, disabled: true }],
          filedata2: [{ value: checkpoint.FILEDATA2, disabled: true }],
          photo3: [{ value: checkpoint.FILENAME3, disabled: true }],
          filename3: [{ value: checkpoint.FILENAME3, disabled: true }],
          filedata3: [{ value: checkpoint.FILEDATA3, disabled: true }]
        });
        // Listen to status changes
        grp.get('status')?.valueChanges.subscribe(status => {
          if (status === 'NOT OK') {
            grp.get('remarks')?.setValidators([Validators.required,Validators.pattern(/^[A-Za-z0-9\s.,'_&\/-]*$/)]);
          } else {
            grp.get('remarks')?.clearValidators();
          }
          grp.get('remarks')?.updateValueAndValidity();
        });

        return grp;
      }))
    });
  }
  // onFileChange( filename: string, data:  any) {
  //   const fileData = data;
  //   const fileName = filename;
  //   if (!fileData) {
  //     console.error("No file data available.");
  //     return;
  //   }
  //   // Check if data is already a Blob
  // let blob: Blob;
  //   console.log(data);
  // if (data instanceof Blob) {
  //   // If it's already a Blob, just use it
  //   blob = data;
  // } else if (data instanceof ArrayBuffer) {
  //   // If it's an ArrayBuffer, create a Blob from it
  //   blob = new Blob([data]);
  // } else if (data && data.type && data.data) {
  //   // If it's a custom data structure like { type: 'Buffer', data: Array(9585) }
  //   // You may need to convert it into a Blob manually
  //   const byteArray = new Uint8Array(data.data); // Assuming data is an array of bytes
  //   blob = new Blob([byteArray], { type: data.type });
  // } else {
  //   console.error("Provided data is not a valid Blob or ArrayBuffer.");
  //   return;
  // }

  // // Ensure blob has valid content
  // if (!blob.size) {
  //   console.error("Provided Blob has no size (empty file).");
  //   return;
  // }
  //   const link = document.createElement('a');
  //   link.href = window.URL.createObjectURL(blob);
  //   link.download = fileName || 'downloaded_file'; 
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);

  // }
onFileChange(filename: string, base64Data: string) {
  if (!base64Data) {
    console.error("No file data available.");
    return;
  }

  try {
    // Decode base64 to binary
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);

    // Guess MIME type from filename (optional but improves UX)
    const mimeType = this.getMimeTypeFromFilename(filename);

    // Create a Blob
    const blob = new Blob([byteArray], { type: mimeType });

    // Create a temporary link for download or viewing
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename || 'downloaded_file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (err) {
    console.error("Error processing file download:", err);
  }
}
getMimeTypeFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'doc': return 'application/msword';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls': return 'application/vnd.ms-excel';
    case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default: return 'application/octet-stream'; // fallback
  }
}

  onSubmit() {
    const body = {
      id: String(this.user.id),
      name: this.editForm.value.name,
      type: this.editForm.value.type,
      fwdrole: this.editForm.value.fwdrole
    }
    this.checkpointservice.updatecheckpoint(body).subscribe({
      next: (data) => {
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
