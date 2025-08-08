import { Component, inject, signal, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import {
  IonContent, IonButton, IonInput, IonItem, IonLabel, IonCheckbox,
  IonCard, IonCardContent, IonIcon, IonText, IonGrid, IonRow, IonCol,
  IonHeader, IonToolbar, IonTitle, IonBackButton, IonButtons, IonSelect, IonSelectOption,
  IonAlert, IonLoading, IonToast, Platform
} from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline,
  personOutline, phonePortraitOutline, checkmarkOutline,
  logoApple, logoGoogle, logoFacebook, arrowBackOutline,
  alertCircleOutline, reloadOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth/auth.service';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterLink,
    IonContent, IonButton, IonInput, IonItem, IonLabel, IonCheckbox,
    IonCard, IonCardContent, IonIcon, IonText, IonGrid, IonRow, IonCol,
    IonHeader, IonToolbar, IonTitle, IonBackButton, IonButtons, IonSelect, IonSelectOption,
    IonAlert, IonLoading, IonToast
  ]
})
export class RegisterPage implements OnInit, OnDestroy {
  @ViewChild('registerCard', { read: ElementRef }) registerCard!: ElementRef;

  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platform = inject(Platform);
  private readonly destroy$ = new Subject<void>();

  registerForm!: FormGroup;

  // Signals for reactive state management
  showPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  currentStep = signal<number>(1);
  totalSteps = signal<number>(2);
  keyboardHeight = signal<number>(0);

  // Form validation state
  step1Valid = signal<boolean>(false);
  step2Valid = signal<boolean>(false);

  constructor() {
    this.addIcons();
    this.initializeForm();
    this.setupKeyboardHandling();
  }

  ngOnInit() {
    this.setupFormValidation();
    this.handleExistingAuthentication();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private addIcons() {
    addIcons({
      mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline,
      personOutline, phonePortraitOutline, checkmarkOutline,
      logoApple, logoGoogle, logoFacebook, arrowBackOutline,
      alertCircleOutline, reloadOutline
    });
  }

  private initializeForm() {
    this.registerForm = this.formBuilder.group({
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        this.nameValidator
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        this.nameValidator
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        this.emailValidator
      ]],
      phone: ['', [
        this.phoneValidator
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [
        Validators.required
      ]],
      agreeToTerms: [false, [
        Validators.requiredTrue
      ]],
      subscribeToNewsletter: [false]
    }, {
      validators: [this.passwordMatchValidator]
    });
  }

  private setupFormValidation() {
    // Watch for changes in step 1 fields
    const step1Fields = ['firstName', 'lastName', 'email', 'phone'];
    const step2Fields = ['password', 'confirmPassword', 'agreeToTerms'];

    this.registerForm.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.validateStep1();
      this.validateStep2();
    });

    // Initial validation
    this.validateStep1();
    this.validateStep2();
  }

  private validateStep1() {
    const step1Fields = ['firstName', 'lastName', 'email'];
    const isValid = step1Fields.every(field => {
      const control = this.registerForm.get(field);
      return control?.valid || (control?.value === '' && !control?.hasError('required'));
    });

    // Email is required, others can be empty but must be valid if filled
    const emailValid = this.registerForm.get('email')?.valid;
    const firstNameValid = this.registerForm.get('firstName')?.valid;
    const lastNameValid = this.registerForm.get('lastName')?.valid;
    const phoneValid = this.registerForm.get('phone')?.valid || !this.registerForm.get('phone')?.value;

    this.step1Valid.set(!!(emailValid && firstNameValid && lastNameValid && phoneValid));
  }

  private validateStep2() {
    const step2Fields = ['password', 'confirmPassword', 'agreeToTerms'];
    const isValid = step2Fields.every(field => {
      const control = this.registerForm.get(field);
      return control?.valid;
    }) && !this.registerForm.hasError('passwordMismatch');

    this.step2Valid.set(isValid);
  }

  private handleExistingAuthentication() {
    if (this.authService.isAuthenticated()) {
      this.redirectUser();
    }
  }

  private setupKeyboardHandling() {
    if (Capacitor.isNativePlatform()) {
      Keyboard.addListener('keyboardWillShow', (info) => {
        this.keyboardHeight.set(info.keyboardHeight);
        this.adjustLayoutForKeyboard(true);
      });

      Keyboard.addListener('keyboardWillHide', () => {
        this.keyboardHeight.set(0);
        this.adjustLayoutForKeyboard(false);
      });
    }
  }

  private adjustLayoutForKeyboard(keyboardVisible: boolean) {
    if (this.registerCard?.nativeElement) {
      if (keyboardVisible) {
        this.registerCard.nativeElement.style.transform = 'translateY(-50px)';
        this.registerCard.nativeElement.style.transition = 'transform 0.3s ease';
      } else {
        this.registerCard.nativeElement.style.transform = 'translateY(0)';
      }
    }
  }

  // Custom Validators
  private nameValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const namePattern = /^[a-zA-Z\s'-]+$/;
    if (!namePattern.test(control.value)) {
      return { invalidName: true };
    }
    return null;
  }

  private emailValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(control.value)) {
      return { invalidEmail: true };
    }
    return null;
  }

  private phoneValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const phonePattern = /^[\+]?[\d\s\-\(\)]{10,}$/;
    if (!phonePattern.test(control.value)) {
      return { invalidPhone: true };
    }
    return null;
  }

  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const value = control.value;
    const hasNumber = /[0-9]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasSpecial = /[#?!@$%^&*-]/.test(value);
    const isLongEnough = value.length >= 8;

    const errors: any = {};

    if (!isLongEnough) {
      errors.minLength = true;
    }

    if (!hasNumber || !hasUpper || !hasLower || !hasSpecial) {
      errors.weakPassword = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  private passwordMatchValidator(form: FormGroup): ValidationErrors | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  // UI Event Handlers
  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
    this.triggerHapticFeedback();
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.set(!this.showConfirmPassword());
    this.triggerHapticFeedback();
  }

  private async triggerHapticFeedback() {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.log('Haptics not available:', error);
      }
    }
  }

  // Step Navigation
  nextStep() {
    if (this.currentStep() < this.totalSteps()) {
      if (this.currentStep() === 1 && !this.step1Valid()) {
        this.markStep1FieldsAsTouched();
        this.showValidationErrors('Please fill in all required fields correctly.');
        return;
      }

      this.currentStep.set(this.currentStep() + 1);
      this.triggerHapticFeedback();
      this.scrollToTop();
    }
  }

  previousStep() {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
      this.triggerHapticFeedback();
      this.scrollToTop();
    }
  }

  private scrollToTop() {
    if (this.registerCard?.nativeElement) {
      this.registerCard.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  private markStep1FieldsAsTouched() {
    const step1Fields = ['firstName', 'lastName', 'email', 'phone'];
    step1Fields.forEach(field => {
      this.registerForm.get(field)?.markAsTouched();
    });
  }

  // Password Strength Calculation
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

  // Registration Process
  async onRegister() {
    if (!this.registerForm.valid) {
      this.markAllFieldsAsTouched();
      this.showValidationErrors('Please fix the errors in the form.');
      return;
    }

    if (!this.step2Valid()) {
      this.showValidationErrors('Please complete all required fields in step 2.');
      return;
    }

    this.isLoading.set(true);

    try {
      const formValue = this.registerForm.value;
      const payload = {
        ...formValue,
        password_confirmation: formValue.confirmPassword
      };

      this.authService.register(payload)
        .pipe(
          tap(() => {
            this.triggerHapticFeedback();
            this.redirectUser();
          }),
          catchError(error => {
            console.error('Registration error:', error);
            this.showValidationErrors('Registration failed. Please try again.');
            return EMPTY;
          }),
          finalize(() => {
            this.isLoading.set(false);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe();

    } catch (error) {
      this.isLoading.set(false);
      this.showValidationErrors('An unexpected error occurred. Please try again.');
    }
  }

  // Social Registration
  onSocialRegister(provider: string) {
    console.log('Social registration with:', provider);
    this.triggerHapticFeedback();
    // TODO: Implement social registration
    this.showValidationErrors(`${provider} registration will be available soon!`);
  }

  // Utility Methods
  private markAllFieldsAsTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });
  }

  private async showValidationErrors(message: string) {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 3000;
    toast.color = 'danger';
    toast.position = 'top';
    toast.buttons = [
      {
        text: 'Dismiss',
        role: 'cancel'
      }
    ];

    document.body.appendChild(toast);
    await toast.present();
  }

  private redirectUser() {
    const user = this.authService.user();
    if (user) {
      switch (user.role?.name) {
        case 'admin':
        case 'moderator':
          this.router.navigate(['/dashboard']);
          break;
        default:
          this.router.navigate(['/tabs/home']);
          break;
      }
    } else {
      this.router.navigate(['/tabs/home']);
    }
  }

  // Getters for template
  get currentStepValue() {
    return this.currentStep();
  }

  get totalStepsValue() {
    return this.totalSteps();
  }

  get canProceedToNextStep() {
    return this.currentStep() === 1 ? this.step1Valid() : this.step2Valid();
  }

  get isLastStep() {
    return this.currentStep() === this.totalSteps();
  }

  get showPreviousButton() {
    return this.currentStep() > 1;
  }

  get showNextButton() {
    return this.currentStep() < this.totalSteps();
  }

  get showRegisterButton() {
    return this.currentStep() === this.totalSteps();
  }

  // Error handling for template
  getFieldError(fieldName: string): string | null {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.touched || !field.errors) {
      return null;
    }

    const errors = field.errors;

    if (errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
    if (errors['email']) return 'Please enter a valid email address';
    if (errors['minlength']) return `${this.getFieldDisplayName(fieldName)} is too short`;
    if (errors['maxlength']) return `${this.getFieldDisplayName(fieldName)} is too long`;
    if (errors['invalidName']) return 'Please enter a valid name';
    if (errors['invalidEmail']) return 'Please enter a valid email address';
    if (errors['invalidPhone']) return 'Please enter a valid phone number';
    if (errors['weakPassword']) return 'Password must contain uppercase, lowercase, number and special character';

    return 'Invalid value';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone',
      password: 'Password',
      confirmPassword: 'Confirm password'
    };
    return displayNames[fieldName] || fieldName;
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.getFieldError(fieldName);
  }
}
