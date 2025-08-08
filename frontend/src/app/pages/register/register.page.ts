// src/app/pages/register/register.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonContent, IonButton, IonInput, IonItem, IonLabel, IonCheckbox,
  IonCard, IonCardContent, IonIcon, IonText, IonGrid, IonRow, IonCol,
  IonHeader, IonToolbar, IonTitle, IonBackButton, IonButtons, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline,
  personOutline, phonePortraitOutline, checkmarkOutline,
  logoApple, logoGoogle, logoFacebook, arrowBackOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterLink,
    IonContent, IonButton, IonInput, IonItem, IonLabel, IonCheckbox,
    IonCard, IonCardContent, IonIcon, IonText, IonGrid, IonRow, IonCol,
    IonHeader, IonToolbar, IonTitle, IonBackButton, IonButtons, IonSelect, IonSelectOption
  ]
})
export class RegisterPage {
  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  currentStep = 1;
  totalSteps = 2;

  constructor(private formBuilder: FormBuilder) {
    addIcons({
      mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline,
      personOutline, phonePortraitOutline, checkmarkOutline,
      logoApple, logoGoogle, logoFacebook, arrowBackOutline
    });

    this.registerForm = this.formBuilder.group({
      // Step 1: Basic Info
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s-()]{10,}$/)]],

      // Step 2: Account Setup
      password: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]],
      role: ['client', [Validators.required]],
      agreeToTerms: [false, [Validators.requiredTrue]],
      subscribeToNewsletter: [false]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordStrengthValidator(control: any) {
    const value = control.value;
    if (!value) return null;

    const hasNumber = /[0-9]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasSpecial = /[#?!@$%^&*-]/.test(value);

    const valid = hasNumber && hasUpper && hasLower && hasSpecial;
    return valid ? null : { weakPassword: true };
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      // Validate current step fields
      const step1Fields = ['firstName', 'lastName', 'email', 'phone'];
      const isStep1Valid = step1Fields.every(field =>
        this.registerForm.get(field)?.valid
      );

      if (isStep1Valid) {
        this.currentStep++;
      } else {
        // Mark step 1 fields as touched to show validation
        step1Fields.forEach(field => {
          this.registerForm.get(field)?.markAsTouched();
        });
      }
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  getPasswordStrength(): { strength: string, color: string, width: string } {
    const password = this.registerForm.get('password')?.value || '';
    let score = 0;

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[#?!@$%^&*-]/.test(password)) score++;

    switch (score) {
      case 0:
      case 1: return { strength: 'Weak', color: '#ef4444', width: '20%' };
      case 2: return { strength: 'Fair', color: '#f97316', width: '40%' };
      case 3: return { strength: 'Good', color: '#eab308', width: '60%' };
      case 4: return { strength: 'Strong', color: '#22c55e', width: '80%' };
      case 5: return { strength: 'Very Strong', color: '#16a34a', width: '100%' };
      default: return { strength: 'Weak', color: '#ef4444', width: '20%' };
    }
  }

  onRegister() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      // Add your registration logic here
      console.log('Registration form data:', this.registerForm.value);
    } else {
      // Mark all fields as touched to show validation errors
      this.markAllFieldsAsTouched();
    }
  }

  onSocialRegister(provider: string) {
    console.log('Social registration with:', provider);
    // Add social registration logic here
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });
  }
}
