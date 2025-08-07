import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { RoleEnum, User } from "../../../models/users/user.models";
import { Router } from "@angular/router";
import { catchError, from, Observable, switchMap, tap, throwError } from "rxjs";
import { ApiUrlService } from "../api.service";
import { StorageService } from "../storage.service";
import { ToastController, LoadingController, AlertController } from '@ionic/angular';

interface AuthResponse {
  data: User;
  message?: string;
}

interface ErrorResponse {
  message: string;
  errors?: { [key: string]: string[] };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey = 'auth_token';
  private readonly userKey = 'user_data';
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrlService = inject(ApiUrlService);
  private readonly storage = inject(StorageService);
  private readonly toastController = inject(ToastController);
  private readonly loadingController = inject(LoadingController);
  private readonly alertController = inject(AlertController);

  private currentUser = signal<User | null>(null);
  private token = signal<string | null>(null);
  private isInitialized = signal<boolean>(false);

  readonly isAdmin = computed(() => this.currentUser()?.role === RoleEnum.ADMIN);
  readonly isModerator = computed(() => this.currentUser()?.role === RoleEnum.MODERATOR);
  readonly isClient = computed(() => this.currentUser()?.role === RoleEnum.CLIENT);
  readonly isAuthenticated = computed(() => !!this.token() && !!this.currentUser());

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    try {
      const token = await this.storage.getItem(this.tokenKey);
      const userDataString = await this.storage.getItem(this.userKey);

      if (token && userDataString) {
        const userData = JSON.parse(userDataString);
        this.currentUser.set(userData);
        this.token.set(token);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      await this.clearAuthData();
    } finally {
      this.isInitialized.set(true);
    }
  }

  user() {
    return this.currentUser();
  }

  getToken(): string | null {
    return this.token();
  }

  register(userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Observable<AuthResponse> {
    const formData = this.createFormData(userData);

    return this.http.post<AuthResponse>(
      this.apiUrlService.getUrl('api/auth/register'),
      formData
    ).pipe(
      tap(response => this.handleAuthSuccess(response.data)),
      catchError(error => this.handleAuthError(error))
    );
  }

  login(credentials: {
    email: string;
    password: string;
    remember_me?: boolean;
  }): Observable<AuthResponse> {
    const formData = this.createFormData(credentials);

    return this.http.post<AuthResponse>(
      this.apiUrlService.getUrl('api/auth/login'),
      formData
    ).pipe(
      tap(response => this.handleAuthSuccess(response.data)),
      catchError(error => this.handleAuthError(error))
    );
  }

  logout(): Observable<any> {
    return this.http.post(this.apiUrlService.getUrl('api/auth/logout'), {}).pipe(
      tap(async () => {
        await this.clearAuthData();
        this.currentUser.set(null);
        this.token.set(null);
        await this.router.navigate(['/login']);
        await this.showToast('Logged out successfully', 'success');
      }),
      catchError(async (error) => {
        // Even if logout fails on server, clear local data
        await this.clearAuthData();
        this.currentUser.set(null);
        this.token.set(null);
        await this.router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  }

  forgotPassword(email: string): Observable<{message: string}> {
    const formData = new FormData();
    formData.append('email', email);

    return this.http.post<{message: string}>(
      this.apiUrlService.getUrl('api/auth/forgot-password'),
      formData
    ).pipe(
      catchError(error => this.handleAuthError(error))
    );
  }

  resetPassword(resetData: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Observable<{message: string}> {
    const formData = this.createFormData(resetData);

    return this.http.post<{message: string}>(
      this.apiUrlService.getUrl('api/auth/reset-password'),
      formData
    ).pipe(
      catchError(error => this.handleAuthError(error))
    );
  }

  // Get fresh user data from server
  refreshUser(): Observable<User> {
    return this.http.get<{data: User}>(
      this.apiUrlService.getUrl('api/user')
    ).pipe(
      tap(response => {
        this.currentUser.set(response.data);
        this.saveUserToStorage(response.data);
      }),
      switchMap(response => [response.data]),
      catchError(error => this.handleAuthError(error))
    );
  }

  // Update user profile
  updateProfile(userData: Partial<User>): Observable<User> {
    const formData = this.createFormData(userData);

    return this.http.post<{data: User}>(
      this.apiUrlService.getUrl('api/user/update'),
      formData
    ).pipe(
      tap(response => {
        this.currentUser.set(response.data);
        this.saveUserToStorage(response.data);
      }),
      switchMap(response => [response.data]),
      catchError(error => this.handleAuthError(error))
    );
  }

  // Check if auth is initialized
  isAuthInitialized(): boolean {
    return this.isInitialized();
  }

  // Wait for auth to initialize
  waitForInitialization(): Observable<boolean> {
    return new Observable(subscriber => {
      const checkInitialization = () => {
        if (this.isInitialized()) {
          subscriber.next(true);
          subscriber.complete();
        } else {
          setTimeout(checkInitialization, 10);
        }
      };
      checkInitialization();
    });
  }

  private async handleAuthSuccess(user: User): Promise<void> {
    await this.setUserData(user);
    this.currentUser.set(user);
    this.redirectBasedOnRole(user.role);
    await this.showToast('Successfully authenticated!', 'success');
  }

  private handleAuthError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }

    this.showToast(errorMessage, 'danger');
    return throwError(() => error);
  }

  private async setUserData(user: User): Promise<void> {
    if (user.token) {
      await this.storage.setItem(this.tokenKey, user.token);
      this.token.set(user.token);
    }
    await this.saveUserToStorage(user);
  }

  private async saveUserToStorage(user: User): Promise<void> {
    // Don't save token in user object to avoid duplication
    const userToSave = { ...user };
    delete userToSave.token;
    await this.storage.setItem(this.userKey, JSON.stringify(userToSave));
  }

  private async clearAuthData(): Promise<void> {
    await this.storage.removeItem(this.tokenKey);
    await this.storage.removeItem(this.userKey);
  }

  private redirectBasedOnRole(role: RoleEnum): void {
    switch (role) {
      case RoleEnum.ADMIN:
        this.router.navigate(['/admin/dashboard']);
        break;
      case RoleEnum.MODERATOR:
        this.router.navigate(['/admin/dashboard']);
        break;
      case RoleEnum.CLIENT:
        this.router.navigate(['/tabs/home']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }

  private createFormData(data: any): FormData {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return formData;
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  // Utility method for showing loading
  async showLoading(message: string = 'Please wait...'): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingController.create({
      message,
      spinner: 'crescent'
    });
    await loading.present();
    return loading;
  }

  // Utility method for showing alerts
  async showAlert(header: string, message: string, buttons: string[] = ['OK']): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons
    });
    await alert.present();
  }
}
