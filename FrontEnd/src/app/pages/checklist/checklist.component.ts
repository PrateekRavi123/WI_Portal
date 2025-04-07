import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-checklist',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterModule],
  templateUrl: './checklist.component.html',
  styleUrl: './checklist.component.css'
})
export class ChecklistComponent {
  
  constructor() {}
 

  tabs = [
    { label: 'Quick View', path: 'quick-view' },
    { label: 'Add Checklist', path: 'add' }
  ];
}
