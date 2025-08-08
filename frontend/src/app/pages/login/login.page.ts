// src/app/pages/login/login.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonContent, IonButton, IonInput, IonItem, IonLabel, IonCheckbox,
  IonCard, IonCardContent, IonIcon, IonText, IonGrid, IonRow, IonCol,
  IonHeader, IonToolbar, IonTitle, IonBackButton, IonButtons
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline,
  logoApple, logoGoogle, logoFacebook, personOutline
} from 'ionicons/icons';

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
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;

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
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      // Add your login logic here
      console.log('Login form data:', this.loginForm.value);
    }
  }

  onSocialLogin(provider: string) {
    // Add social login logic here
  }
}
