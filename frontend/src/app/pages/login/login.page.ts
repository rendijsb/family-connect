import {Component, inject, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonContent, IonButton, IonInput, IonItem, IonLabel, IonCheckbox,
  IonCard, IonCardContent, IonIcon, IonText, IonGrid, IonRow, IonCol,
  IonHeader, IonToolbar, IonTitle, IonBackButton, IonButtons
} from '@ionic/angular/standalone';
import {Router, RouterLink} from '@angular/router';
import { addIcons } from 'ionicons';
import {
  mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline,
  logoApple, logoGoogle, logoFacebook, personOutline
} from 'ionicons/icons';
import {AuthService} from '../../core/services/auth/auth.service';
import {catchError, EMPTY, finalize, tap} from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterLink,
    IonContent, IonButton, IonInput, IonItem, IonLabel, IonCheckbox,
    IonCard, IonCardContent, IonIcon, IonText, IonGrid, IonRow, IonCol,
    IonHeader, IonToolbar, IonTitle, IonBackButton, IonButtons
  ]
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loginForm: FormGroup;

  showPassword = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  constructor(private formBuilder: FormBuilder) {
    addIcons({
      mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline,
      logoApple, logoGoogle, logoFacebook, personOutline
    });

    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    if (this.authService.isAuthenticated()) {
      this.redirectUser();
    }
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);

      const payload = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
        remember: this.loginForm.value.rememberMe
      };

      this.authService.login(payload)
        .pipe(
          tap(() => {
            this.redirectUser();
          }),
          catchError(error => {
            return EMPTY;
          }),
          finalize(() => {
            this.isLoading.set(false);
          })
        )
        .subscribe();

    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  onSocialLogin(provider: string) {
    // TODO: Implement social login
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
    }
  }
}
