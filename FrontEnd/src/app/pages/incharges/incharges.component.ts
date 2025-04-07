import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-incharges',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterModule],
  templateUrl: './incharges.component.html',
  styleUrl: './incharges.component.css'
})
export class InchargesComponent {
  tabs = [
    { label: 'Quick View', path: 'quick-view' },
    { label: 'Add Incharge', path: 'add' }
  ];
}
