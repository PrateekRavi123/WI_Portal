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
      filedata: [{ value: '', disabled: true }],
      filename2: [{ value: '', disabled: true }],
      filedata2: [{ value: '', disabled: true }],
      filename3: [{ value: '', disabled: true }],
      filedata3: [{ value: '', disabled: true }]
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && this.user) {
      this.getsinglechecklistcheckpoint(this.user.ID);
      this.editForm.patchValue({
        checklistid: this.user.CHECKLIST_ID,
        type_name: this.user.TYPE_NAME,
        name: this.user.NAME,
        role_name: this.user.ROLE_NAME,
        status: this.user.STATUS,
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
          remarks: data[0].REMARKS,
          filename: data[0].FILENAME,
          filedata: data[0].FILEDATA,
          filename2: data[0].FILENAME2,
          filedata2: data[0].FILEDATA2,
          filename3: data[0].FILENAME3,
          filedata3: data[0].FILEDATA3
        });
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }


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
      loc_id: this.user.LOC_ID,
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
