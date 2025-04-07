import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})



export class PopupService {

  constructor() { }
  private popupsSubject = new BehaviorSubject<{ type: 'success' | 'error' | 'info', message: string }[]>([]);
  popups$ = this.popupsSubject.asObservable();



  // Show a new popup
  showPopup(type: 'success' | 'error' | 'info', message: string) {
    const currentPopups = this.popupsSubject.getValue();
    const newPopup = { type, message };
    
    // Add new popup to the list
    this.popupsSubject.next([...currentPopups, newPopup]);

    // Automatically remove the popup after 3 seconds
    setTimeout(() => {
      this.removePopup(newPopup);
    }, 3000); 
  }

  // Remove a specific popup
  private removePopup(popup: { type: 'success' | 'error' | 'info', message: string }) {
    const currentPopups = this.popupsSubject.getValue();
    const updatedPopups = currentPopups.filter(p => p !== popup);
    this.popupsSubject.next(updatedPopups);
  }



}
