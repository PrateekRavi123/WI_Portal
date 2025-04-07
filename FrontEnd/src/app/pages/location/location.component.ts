import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterModule, RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-location',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterModule],
  templateUrl: './location.component.html',
  styleUrl: './location.component.css'
})
export class LocationComponent {
  tabs = [
    { label: 'Quick View', path: 'quick-view' },
    { label: 'Add Location', path: 'add' }
  ];
}
