import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { PopupService } from '../../services/popup/popup.service';

@Component({
  selector: 'app-popup',
  imports: [CommonModule],
  templateUrl: './popup.component.html',
  styleUrl: './popup.component.css'
})

export class PopupComponent {
  message: string = '';
  type: 'success' | 'error' | 'info' = 'info';
  visible: boolean = false;
  popups$: Observable<any>;
  constructor(private popupService: PopupService) {
    this.popups$ = this.popupService.popups$;
    // this.popupService.message$.subscribe(message => this.message = message);
    // this.popupService.type$.subscribe(type => this.type = type);
    // this.popupService.visible$.subscribe(visible => this.visible = visible);
    
  }
  get classes() {
    return {
      'popup-success': this.type === 'success',
      'popup-error': this.type === 'error',
      'popup-info': this.type === 'info'
    };
  } 
}
