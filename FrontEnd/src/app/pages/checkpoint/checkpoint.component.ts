import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { CheckpointService } from '../../services/checkpoint/checkpoint.service';
import { Checkpoint } from './quickviewcheckpt/quickviewcheckpt.component';
import { Observable } from 'rxjs';
@Component({
  selector: 'app-checkpoint',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterModule],
  templateUrl: './checkpoint.component.html',
  styleUrl: './checkpoint.component.css'
})
export class CheckpointComponent {
  constructor() {
    
  }
  tabs = [
    { label: 'Quick View', path: 'quick-view' },
    { label: 'Add Checkpoint', path: 'add' }
  ];

 
}
