import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { PopupService } from '../../../services/popup/popup.service';
import { RefreshService } from '../../../services/refresh/refresh.service';
import { CheckpointService } from '../../../services/checkpoint/checkpoint.service';
import { CheckList, Checkpoint } from '../addchecklist/addchecklist.component';
import { InchargesService } from '../../../services/incharges/incharges.service';
import { ChecklistService } from '../../../services/checklist/checklist.service';
import { StorageService } from '../../../services/storage/storage.service';
import { ActivatedRoute } from '@angular/router';
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
          id: [checkpoint.id],
          type: [checkpoint.type],
          name: [checkpoint.name],
          status: [checkpoint.status],
          remarks: [checkpoint.remarks],
          photo: [checkpoint.photo],
          filename: [{ value: checkpoint.filename, disabled: true }],
          filedata: [{ value: checkpoint.filedata, disabled: true }]
        });
        // Listen to status changes
        grp.get('status')?.valueChanges.subscribe(status => {
          if (status === 'NOT OK') {
            grp.get('remarks')?.setValidators([this.nonEmptyValidator()]);
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
      console.log(params['CHECKLIST_ID']); // Fetch the ID
    });
    this.emp_code = await this.storageservice.getUser();
    this.getdetails();
    this.getcheckpoints();
    this.groupCheckpointsByType();
    this.checkPointList.forEach(checkpoint => this.collapsedTypes.add(checkpoint.type));
  }
  get checkpoints2(): FormArray {
    return this.editForm.get('checkpoints') as FormArray;
  }
  getcheckpoints() {
    const body = { checklist_id: String(this.CHECKLIST_ID) }
    this.checklistservice.getchecklistcheckpoint(body).subscribe({
      next: (data) => {
        this.checkpt = data;
        console.log('data', this.checkpt);
        this.checkPointList = this.checkpt.map(e => ({
          id: parseInt(e.id, 10),
          type: e.type_name,
          name: e.NAME,
          status: e.status,
          remarks: e.remarks,
          photo: null,
          filename: e.FILENAME,
          filedata: e.FILEDATA
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
    console.log('grp:', this.groupedCheckpoints);
  }
  getdetails() {
    const body = { checklist_id: String(this.CHECKLIST_ID) }
    this.checklistservice.getchecklist(body).subscribe({
      next: (data) => {
        console.log('getchecklist', data);
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
      console.log('User:', this.user);
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
          id: [checkpoint.id],
          type: [checkpoint.type],
          name: [checkpoint.name],
          status: [{ value: checkpoint.status, disabled: true }],
          remarks: [{ value: checkpoint.remarks, disabled: true }],
          photo: [{ value: checkpoint.filename, disabled: true }],
          filename: [{ value: checkpoint.filename, disabled: true }],
          filedata: [{ value: checkpoint.filedata, disabled: true }]
        });
        // Listen to status changes
        grp.get('status')?.valueChanges.subscribe(status => {
          if (status === 'NOT OK') {
            grp.get('remarks')?.setValidators([this.nonEmptyValidator()]);
          } else {
            grp.get('remarks')?.clearValidators();
          }
          grp.get('remarks')?.updateValueAndValidity();
        });

        return grp;
      }))
    });
  }
  onFileChange( filename: string, data:  any) {
    console.log('filename',filename);
    console.log('filedata',data);
    const fileData = data;
    const fileName = filename;
    if (!fileData) {
      console.error("No file data available.");
      return;
    }
    // Check if data is already a Blob
  let blob: Blob;

  if (data instanceof Blob) {
    // If it's already a Blob, just use it
    blob = data;
  } else if (data instanceof ArrayBuffer) {
    // If it's an ArrayBuffer, create a Blob from it
    blob = new Blob([data]);
  } else if (data && data.type && data.data) {
    // If it's a custom data structure like { type: 'Buffer', data: Array(9585) }
    // You may need to convert it into a Blob manually
    const byteArray = new Uint8Array(data.data); // Assuming data is an array of bytes
    blob = new Blob([byteArray], { type: data.type });
  } else {
    console.error("Provided data is not a valid Blob or ArrayBuffer.");
    return;
  }

  // Ensure blob has valid content
  if (!blob.size) {
    console.error("Provided Blob has no size (empty file).");
    return;
  }
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName || 'downloaded_file'; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  }

  onSubmit() {
    console.log('Profile Updated:', this.editForm.value);
    const body = {
      id: String(this.user.id),
      name: this.editForm.value.name,
      type: this.editForm.value.type,
      fwdrole: this.editForm.value.fwdrole
    }
    console.log('update body: ', body);
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
