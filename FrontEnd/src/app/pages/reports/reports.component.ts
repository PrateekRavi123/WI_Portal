import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { NotsubmittedchecklistComponent } from "./notsubmittedchecklist/notsubmittedchecklist.component";
import { ObservationsummaryComponent } from "./observationsummary/observationsummary.component";
import { CompiledchecksheetComponent } from "./compiledchecksheet/compiledchecksheet.component";

@Component({
  selector: 'app-reports',
  imports: [CommonModule, RouterModule, NotsubmittedchecklistComponent, ObservationsummaryComponent, CompiledchecksheetComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent {
 tabs = [
    { label: 'Not Submitted Checklist', key: 'notsubmittedchecklist' },
    { label: 'Observations Summary', key: 'observationsummary' },
    { label: 'Compiled Checksheet', key: 'compiledchecksheet' }
  ];
  activeTab = 'notsubmittedchecklist';
}
