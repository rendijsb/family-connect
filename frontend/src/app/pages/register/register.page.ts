import {Component, inject, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonContent, IonButton, IonInput, IonItem, IonLabel, IonCheckbox,
  IonCard, IonCardContent, IonIcon, IonText, IonGrid, IonRow, IonCol,
  IonHeader, IonToolbar, IonTitle, IonBackButton, IonButtons, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import {Router, RouterLink} from '@angular/router';
import { addIcons } from 'ionicons';
import {
  mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline,
  personOutline, phonePortraitOutline, checkmarkOutline,
  logoApple, logoGoogle, logoFacebook, arrowBackOutline
} from 'ionicons/icons';
import {AuthService} from '../../core/services/auth/auth.service';
import {catchError, EMPTY, finalize, tap} from 'rxjs';

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
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  registerForm: FormGroup;

  showPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  currentStep = signal<number>(1);
  totalSteps = signal<number>(2);

  constructor() {
    addIcons({
      mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline,
      personOutline, phonePortraitOutline, checkmarkOutline,
      logoApple, logoGoogle, logoFacebook, arrowBackOutline
    });

    this.registerForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[\d\s-()]{10,}$/)]],

      password: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]],
      agreeToTerms: [false, [Validators.requiredTrue]],
      subscribeToNewsletter: [false]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordStrengthValidator(control: any) {
    const value = control.value;
    if (!value) return null;

    const hasNumber: boolean = /[0-9]/.test(value);
    const hasUpper: boolean = /[A-Z]/.test(value);
    const hasLower: boolean = /[a-z]/.test(value);
    const hasSpecial: boolean = /[#?!@$%^&*-]/.test(value);

    const valid: boolean = hasNumber && hasUpper && hasLower && hasSpecial;
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
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  nextStep() {
    if (this.currentStep() < this.totalSteps()) {
      const step1Fields = ['firstName', 'lastName', 'email', 'phone'];
      const isStep1Valid = step1Fields.every(field => {
        const control = this.registerForm.get(field);
        return control?.valid || !control?.hasError('required');
      });

      if (isStep1Valid) {
        this.currentStep.set(this.currentStep() + 1);
      } else {
        step1Fields.forEach(field => {
          this.registerForm.get(field)?.markAsTouched();
        });
      }
    }
  }

  previousStep() {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
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
      this.isLoading.set(true);

      const formValue = this.registerForm.value;
      const payload = {
        ...formValue,
        password_confirmation: formValue.confirmPassword
      };

      this.authService.register(payload)
        .pipe(
          tap(() => this.router.navigate(['/'])),
          catchError(() => EMPTY),
          finalize(() => this.isLoading.set(false))
        )
        .subscribe();


    } else {
      this.markAllFieldsAsTouched();
    }
  }

  onSocialRegister(provider: string) {
    console.log('Social registration with:', provider);
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });
  }
}
