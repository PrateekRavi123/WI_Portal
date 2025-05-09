import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RefreshService } from '../../../services/refresh/refresh.service';
import { LocationService } from '../../../services/location/location.service';
import { PopupService } from '../../../services/popup/popup.service';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { ChecklistService } from '../../../services/checklist/checklist.service';

@Component({
  selector: 'app-editpendingchecklist',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editpendingchecklist.component.html',
  styleUrl: './editpendingchecklist.component.css'
})
export class EditpendingchecklistComponent {
  @Output() formSubmitted = new EventEmitter<void>();
  @Input() user: any | null = null;
  editForm: FormGroup;
  circleList: any = [];
  divList: any = [];


  get f() { return this.editForm.controls as { [key: string]: any }; }


  constructor(private refreshService: RefreshService, private fb: FormBuilder, private locationservice: LocationService, private popupservice: PopupService, private dashboardservice: DashboardService,
    private checklistservice: ChecklistService
  ) {
    // Initialize the form with empty values
    this.editForm = this.fb.group({
      checklistid: [{ value: '', disabled: true }],
      type_name: [{ value: '', disabled: true }],
      name: [{ value: '', disabled: true }],
      role_name: [{ value: '', disabled: true }],
      status: [{ value: '', disabled: true }],
      loc: [{ value: '', disabled: true }],
      div: [{ value: '', disabled: true }],
      remarks: [{ value: '', disabled: true }],
      filename: [{ value: '', disabled: true }],
      filedata: [{ value: '', disabled: true }]
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && this.user) {
      this.getsinglechecklistcheckpoint(this.user.ID);
      this.editForm.patchValue({
        checklistid: this.user.CHECKLIST_ID,
        type_name: this.user.type_name,
        name: this.user.NAME,
        role_name: this.user.role_name,
        status: this.user.status,
        loc: this.user.LOC,
        div: this.user.DIV,
      });

    } else {
      this.editForm.reset();
      this.editForm.disable();
    }
  }


  getsinglechecklistcheckpoint(id:string) {
    const body = {
      id:id.toString()
    }
    this.checklistservice.getsinglechecklistcheckpoint(body).subscribe({
      next: (data) => {
        this.editForm.patchValue({
          remarks: data[0].remarks,
          filename: data[0].FILENAME,
          filedata: data[0].FILEDATA
        });
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }


  onFileChange( filename: string, data:  any) {
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
    const body = {
      loc_id: this.user.loc_id,
      loc_name: this.editForm.value.name,
      circle: this.editForm.value.circle,
      div_code: this.editForm.value.div,
    }
    this.locationservice.updatelocation(body).subscribe({
      next: (data) => {
        this.popupservice.showPopup('success', 'Location updated successfully.');
        this.editForm.reset();
        this.formSubmitted.emit();
        this.refreshService.triggerRefresh();
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.editForm.reset();
        this.popupservice.showPopup('error', 'Error in updating location.');
      },
    });
  }
}
