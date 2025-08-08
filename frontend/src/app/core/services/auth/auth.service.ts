import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { RoleEnum, User } from "../../../models/users/user.models";
import { Router } from "@angular/router";
import { catchError, from, Observable, switchMap, tap, throwError } from "rxjs";
import { ApiUrlService } from "../api.service";
import { StorageService } from "../storage.service";
import { ToastController, LoadingController, AlertController } from '@ionic/angular';

interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    token: string;
    tokenType: string;
  };
  error?: string;
}

interface ErrorResponse {
  success: boolean;
  message: string;
  errors?: { [key: string]: string[] };
  error?: string;
}

interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  agreeToTerms: boolean;
  subscribeToNewsletter?: boolean;
}

interface LoginPayload {
  email: string;
  password: string;
  remember?: boolean;
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

  readonly isAdmin = computed(() => this.currentUser()?.role?.id === 1); // RoleEnum.ADMIN
  readonly isModerator = computed(() => this.currentUser()?.role?.id === 2); // RoleEnum.MODERATOR
  readonly isFamilyOwner = computed(() => this.currentUser()?.role?.id === 3); // RoleEnum.FAMILY_OWNER
  readonly isFamilyMember = computed(() => this.currentUser()?.role?.id === 4); // RoleEnum.FAMILY_MEMBER
  readonly isClient = computed(() => this.currentUser()?.role?.id === 5); // RoleEnum.CLIENT
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

        this.verifyTokenValidity().subscribe({
          error: () => {
            this.clearAuthData();
          }
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      await this.clearAuthData();
    } finally {
      this.isInitialized.set(true);
    }
  }

  private verifyTokenValidity(): Observable<User> {
    return this.http.get<{success: boolean, data: User}>(
      this.apiUrlService.getUrl('auth/me')
    ).pipe(
      tap(response => {
        if (response.success) {
          this.currentUser.set(response.data);
          this.saveUserToStorage(response.data);
        }
      }),
      switchMap(response => [response.data]),
      catchError((error) => {
        this.clearAuthData();
        return throwError(() => error);
      })
    );
  }

  user(): User | null {
    return this.currentUser();
  }

  getToken(): string | null {
    return this.token();
  }

  register(userData: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      this.apiUrlService.getUrl('auth/register'),
      {
        name: `${userData.firstName} ${userData.lastName}`.trim(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        password_confirmation: userData.password_confirmation,
        phone: userData.phone,
        agreeToTerms: userData.agreeToTerms,
        subscribeToNewsletter: userData.subscribeToNewsletter || false
      }
    ).pipe(
      tap(async (response) => {
        if (response.success) {
          await this.handleAuthSuccess(response.data.user, response.data.token);
          await this.showToast(response.message || 'Registration successful!', 'success');
        }
      }),
      catchError(error => this.handleAuthError(error))
    );
  }

  login(credentials: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      this.apiUrlService.getUrl('auth/login'),
      {
        email: credentials.email,
        password: credentials.password,
        remember: credentials.remember || false
      }
    ).pipe(
      tap(async (response) => {
        if (response.success) {
          await this.handleAuthSuccess(response.data.user, response.data.token);
          await this.showToast(response.message || 'Login successful!', 'success');
        }
      }),
      catchError(error => this.handleAuthError(error))
    );
  }

  logout(): Observable<any> {
    return this.http.post(this.apiUrlService.getUrl('auth/logout'), {}).pipe(
      tap(async () => {
        await this.clearAuthData();
        this.currentUser.set(null);
        this.token.set(null);
        await this.router.navigate(['/login']);
        await this.showToast('Logged out successfully', 'success');
      }),
      catchError(async (error) => {
        await this.clearAuthData();
        this.currentUser.set(null);
        this.token.set(null);
        await this.router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  }

  forgotPassword(email: string): Observable<{success: boolean, message: string}> {
    return this.http.post<{success: boolean, message: string}>(
      this.apiUrlService.getUrl('auth/forgot-password'),
      { email }
    ).pipe(
      tap(response => {
        if (response.success) {
          this.showToast(response.message, 'success');
        }
      }),
      catchError(error => this.handleAuthError(error))
    );
  }

  resetPassword(resetData: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Observable<{success: boolean, message: string}> {
    return this.http.post<{success: boolean, message: string}>(
      this.apiUrlService.getUrl('auth/reset-password'),
      resetData
    ).pipe(
      tap(response => {
        if (response.success) {
          this.showToast(response.message, 'success');
        }
      }),
      catchError(error => this.handleAuthError(error))
    );
  }

  refreshUser(): Observable<User> {
    return this.http.get<{success: boolean, data: User}>(
      this.apiUrlService.getUrl('user')
    ).pipe(
      tap(response => {
        if (response.success) {
          this.currentUser.set(response.data);
          this.saveUserToStorage(response.data);
        }
      }),
      switchMap(response => [response.data]),
      catchError(error => this.handleAuthError(error))
    );
  }

  isAuthInitialized(): boolean {
    return this.isInitialized();
  }

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

  canManageFamily(): boolean {
    const user = this.currentUser();
    return user ? <boolean>user.canManageFamily : false;
  }

  hasRole(role: RoleEnum): boolean {
    const user = this.currentUser();
    return user?.role?.name === role;
  }

  hasAnyRole(roles: RoleEnum[]): boolean {
    const user = this.currentUser();
    return user ? roles.includes(user.role?.name as RoleEnum) : false;
  }

  private async handleAuthSuccess(user: User, token: string): Promise<void> {
    await this.setUserData(user, token);
    this.currentUser.set(user);
    this.token.set(token);
    this.redirectBasedOnRole(user.role?.name);
  }

  private handleAuthError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error) {
      const errorResponse = error.error as ErrorResponse;

      if (errorResponse.message) {
        errorMessage = errorResponse.message;
      } else if (errorResponse.errors) {
        const firstError = Object.values(errorResponse.errors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      } else if (errorResponse.error) {
        errorMessage = errorResponse.error;
      }
    } else if (error.status === 0) {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (error.status === 422) {
      errorMessage = 'Please check your input and try again.';
    } else if (error.status === 401) {
      errorMessage = 'Invalid credentials. Please try again.';
    }

    this.showToast(errorMessage, 'danger');
    return throwError(() => error);
  }

  private async setUserData(user: User, token: string): Promise<void> {
    await this.storage.setItem(this.tokenKey, token);
    await this.saveUserToStorage(user);
  }

  private async saveUserToStorage(user: User): Promise<void> {
    await this.storage.setItem(this.userKey, JSON.stringify(user));
  }

  private async clearAuthData(): Promise<void> {
    await this.storage.removeItem(this.tokenKey);
    await this.storage.removeItem(this.userKey);
  }

  private redirectBasedOnRole(roleName?: string): void {
    switch (roleName) {
      case 'admin':
      case 'moderator':
        this.router.navigate(['/dashboard']);
        break;
      case 'family_owner':
      case 'family_member':
        this.router.navigate(['/tabs/home']);
        break;
      case 'client':
      default:
        this.router.navigate(['/tabs/home']);
        break;
    }
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

  async showLoading(message: string = 'Please wait...'): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingController.create({
      message,
      spinner: 'crescent'
    });
    await loading.present();
    return loading;
  }

  async showAlert(header: string, message: string, buttons: string[] = ['OK']): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons
    });
    await alert.present();
  }
}
