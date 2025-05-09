
import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SmsServiceService } from '../../services/sms/sms-service.service';
import { CommonModule } from '@angular/common';
import e from 'express';
import { stat } from 'fs';
import { PopupService } from '../../services/popup/popup.service';
import { StorageService } from '../../services/storage/storage.service';


@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm = new FormGroup({
    mobileNumber: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]),
  });
  otpForm = new FormGroup({
    otpFirst: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]$/)]),
    otpSecond: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]$/)]),
    otpThird: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]$/)]),
    otpFourth: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]$/)]),
    otpFifth: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]$/)]),
    otpSixth: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]$/)])
  });
  otpSent: boolean = false;
  MobileNumber: string = '';
  timeLeft: number = 60;
  otpcount: number = 0;
  interval: any;
  constructor(private router: Router, private smsservice: SmsServiceService, private popupservice: PopupService, private storageService: StorageService) { 
    this.storageService.clearStorage();
  }

  ngOnInit(){
  this.storageService.clearStorage();
}

  onKeyUp(event: KeyboardEvent, currentInput: string) {
    const inputOrder = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
    const currentIndex = inputOrder.indexOf(currentInput);

    if (event.key === 'Backspace' && currentIndex > 0) {
      const previousInput = inputOrder[currentIndex - 1];
      (document.getElementById(previousInput) as HTMLInputElement).focus();
    } else if (event.key !== 'Backspace' && currentIndex < inputOrder.length - 1) {
      const nextInput = inputOrder[currentIndex + 1];
      (document.getElementById(nextInput) as HTMLInputElement).focus();
    }
  }
  startTimer() {
    this.timeLeft = 60;
    this.interval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        clearInterval(this.interval);
        this.popupservice.showPopup('error', 'OTP expired. Please request a new OTP.');
        this.otpSent = false;
      }
    }, 1000);
  }
  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    if (!this.otpSent) {
      this.sendOtp();
    } else {
      this.validateOtp();
    }
  }

  async sendOtp() {
    const mobileNumber = this.loginForm.value.mobileNumber;
    if (this.otpcount < 3) {
      if (mobileNumber) {
        const body = { cnt_no: mobileNumber };
        this.smsservice.sendOTP(body).subscribe({
          next: (data) => {
            if (data.msg === 'SMS sent successfully') {
              this.startTimer();
              this.otpcount = this.otpcount + 1;
              this.otpSent = true;
            } else if (data.msg === 'No user found.') {
              this.popupservice.showPopup('error', 'Not a registered user.');
            }else if (data.msg === 'OTP limit reached. Try again later.') {
              this.popupservice.showPopup('error', 'OTP limit reached. Try again later.');
            }
          },
          error: (error) => {
            console.error('Error fetching data:', error);
            this.popupservice.showPopup('error', 'Not Able to send OTP');
          },
        });
      }
    } else {
      this.popupservice.showPopup('error', 'You have exceeded the maximum number of OTP attempts. Please try again after 24 hours.');
    }
  }

  isOtpInvalid(): boolean {
    return (Object.keys(this.otpForm.controls) as (keyof typeof this.otpForm.controls)[])
      .some(key => this.otpForm.controls[key].invalid && this.otpForm.controls[key].touched);
  }

  getOtpFromForm(): string {
    const otpArray = [
      this.otpForm.value.otpFirst,
      this.otpForm.value.otpSecond,
      this.otpForm.value.otpThird,
      this.otpForm.value.otpFourth,
      this.otpForm.value.otpFifth,
      this.otpForm.value.otpSixth
    ];
    return otpArray.join('');
  }
  async validateOtp() {
    const mobileNumber = this.loginForm.value.mobileNumber;
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    } else {
      const body = { cnt_no: mobileNumber, val: this.getOtpFromForm() };
      this.smsservice.validateOtp(body).subscribe({
        next: (data) => {
          if (data.msg === 'OTP validated successfully.') {
            this.popupservice.showPopup('success', 'OTP validated successfully!');
            clearInterval(this.interval);
            this.otpSent = false;
            this.timeLeft = 60;
            this.router.navigate(['dashboard']);
            this.storageService.storeToken(data.token);
            this.storageService.storeUser(data.user);
            this.storageService.storeUserRole(data.role);
            this.storageService.storeUserMob(mobileNumber?mobileNumber:"");
          } else if (data.msg === 'No user found.') {
            this.otpForm.reset();
            this.popupservice.showPopup('error', 'Not a registered user.');
          }else if (data.msg === 'Incorrect OTP.') {
            this.otpForm.reset();
            this.popupservice.showPopup('error', 'Invalid OTP. Please try again.');
          }
        },
        error: (error) => {
          console.error('Error fetching data:', error);
          this.popupservice.showPopup('error', 'Invalid OTP. Please try again.');
        },
      });
    }

  }
}
