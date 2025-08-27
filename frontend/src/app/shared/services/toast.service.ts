import { inject, Injectable } from '@angular/core';
import { ToastController, LoadingController, AlertController, ActionSheetController } from '@ionic/angular';

export interface AlertButton {
  text: string;
  role?: 'cancel' | 'destructive' | 'confirm';
  cssClass?: string;
  handler?: () => void | boolean | Promise<void | boolean>;
}

export interface AlertInput {
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'radio' | 'checkbox';
  placeholder?: string;
  value?: any;
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  id?: string;
  min?: string | number;
  max?: string | number;
  attributes?: { [key: string]: any };
}

export interface ActionSheetButton {
  text: string;
  role?: 'cancel' | 'destructive';
  icon?: string;
  cssClass?: string;
  handler?: () => void | boolean | Promise<void | boolean>;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toastController = inject(ToastController);
  private readonly loadingController = inject(LoadingController);
  private readonly alertController = inject(AlertController);
  private readonly actionSheetController = inject(ActionSheetController);

  // Toast Methods
  async showToast(message: string, color: 'success' | 'danger' | 'warning' | 'primary' = 'success'): Promise<void> {
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

  async showToastWithDuration(message: string, duration: number = 3000, color: 'success' | 'danger' | 'warning' | 'primary' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color,
      position: 'top'
    });
    await toast.present();
  }

  // Loading Methods
  async showLoading(message: string = 'Please wait...'): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingController.create({
      message,
      spinner: 'crescent'
    });
    await loading.present();
    return loading;
  }

  async hideLoading(): Promise<void> {
    try {
      await this.loadingController.dismiss();
    } catch (error) {
      // Loading might already be dismissed
      console.log('Loading already dismissed');
    }
  }

  // Basic Alert Methods
  async showAlert(header: string, message: string, buttons: AlertButton[] = [{ text: 'OK', role: 'confirm' }]): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons
    });
    await alert.present();
  }

  async showAlertWithInputs(
    header: string,
    message: string,
    inputs: AlertInput[],
    buttons: AlertButton[]
  ): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      inputs,
      buttons
    });
    await alert.present();
  }

  // Confirmation Dialogs
  async showConfirmation(
    title: string,
    message: string,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: title,
        message: message,
        buttons: [
          {
            text: cancelText,
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: confirmText,
            role: 'confirm',
            handler: () => resolve(true)
          }
        ]
      });
      await alert.present();
    });
  }

  async showDestructiveConfirmation(
    title: string,
    message: string,
    confirmText: string = 'Delete',
    cancelText: string = 'Cancel'
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: title,
        message: message,
        buttons: [
          {
            text: cancelText,
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: confirmText,
            role: 'destructive',
            handler: () => resolve(true)
          }
        ]
      });
      await alert.present();
    });
  }

  // Input Prompts
  async showTextInput(
    title: string,
    message: string,
    placeholder: string = '',
    defaultValue: string = ''
  ): Promise<string | null> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: title,
        message: message,
        inputs: [
          {
            name: 'input',
            type: 'text',
            placeholder: placeholder,
            value: defaultValue
          }
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => resolve(null)
          },
          {
            text: 'OK',
            role: 'confirm',
            handler: (data) => resolve(data.input?.trim() || null)
          }
        ]
      });
      await alert.present();
    });
  }

  async showEmailInput(
    title: string,
    message: string,
    placeholder: string = 'Enter email address'
  ): Promise<string | null> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: title,
        message: message,
        inputs: [
          {
            name: 'email',
            type: 'email',
            placeholder: placeholder
          }
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => resolve(null)
          },
          {
            text: 'OK',
            role: 'confirm',
            handler: (data) => resolve(data.email?.trim() || null)
          }
        ]
      });
      await alert.present();
    });
  }

  // Join Code Input
  async showJoinCodeInput(): Promise<string | null> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: 'Join Family',
        message: 'Enter the family join code to join an existing family.',
        cssClass: 'custom-alert',
        inputs: [
          {
            name: 'joinCode',
            type: 'text',
            placeholder: 'Enter join code',
            attributes: {
              maxlength: 8,
            }
          }
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => resolve(null)
          },
          {
            text: 'Join',
            role: 'confirm',
            handler: (data) => resolve(data.joinCode?.trim().toUpperCase() || null)
          }
        ]
      });
      await alert.present();
    });
  }

  // Family Member Invitation (Two-step process)
  async showInviteMemberDialog(): Promise<{ email: string; role: number } | null> {
    // Step 1: Get email address
    const email = await this.showEmailInput(
      'Invite Family Member',
      'Enter the email address of the person you want to invite.'
    );

    if (!email) return null;

    // Step 2: Select role
    const role = await this.showRoleSelection();

    if (role === null) return null;

    return { email, role };
  }

  // Role selection for family invitations
  async showRoleSelection(): Promise<number | null> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: 'Select Member Role',
        message: 'Choose the role for this family member.',
        inputs: [
          {
            name: 'role',
            type: 'radio',
            label: 'Family Member',
            value: 4, // FamilyRoleEnum.MEMBER
            checked: true
          },
          {
            name: 'role',
            type: 'radio',
            label: 'Family Moderator',
            value: 3 // FamilyRoleEnum.MODERATOR
          }
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => resolve(null)
          },
          {
            text: 'Send Invite',
            role: 'confirm',
            handler: (data) => resolve(data.role)
          }
        ]
      });
      await alert.present();
    });
  }

  // Delete Confirmation with Text Input
  async showDeleteConfirmation(itemName: string, itemType: string = 'item'): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: `Delete ${itemType}`,
        message: `Are you sure you want to permanently delete "${itemName}"? This action cannot be undone.`,
        inputs: [
          {
            name: 'confirmation',
            type: 'text',
            placeholder: `Type "${itemName}" to confirm`
          }
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: 'Delete',
            role: 'destructive',
            handler: (data) => {
              if (data.confirmation === itemName) {
                resolve(true);
              } else {
                this.showToast('Name does not match. Please try again.', 'danger');
                resolve(false);
              }
            }
          }
        ]
      });
      await alert.present();
    });
  }

  // Action Sheets
  async showActionSheet(header: string, buttons: ActionSheetButton[]): Promise<void> {
    const actionSheet = await this.actionSheetController.create({
      header,
      buttons: [
        ...buttons,
        {
          text: 'Cancel',
          role: 'cancel',
          icon: 'close-outline'
        }
      ]
    });
    await actionSheet.present();
  }

  // Copy to Clipboard with Toast
  async copyToClipboard(text: string, successMessage: string = 'Copied to clipboard!'): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      await this.showToastWithDuration(successMessage, 2000, 'success');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      await this.showToast('Failed to copy to clipboard', 'danger');
    }
  }

  // Share with Fallback to Copy
  async shareWithFallback(shareData: ShareData, fallbackText: string, fallbackMessage: string): Promise<void> {
    if (navigator.share) {
      try {
        // Filter out invalid URLs (custom schemes) for Web Share API
        const validShareData: ShareData = {
          title: shareData.title,
          text: shareData.text
        };

        // Only include URL if it's a valid HTTP/HTTPS URL
        if (shareData.url && (shareData.url.startsWith('http://') || shareData.url.startsWith('https://'))) {
          validShareData.url = shareData.url;
        }

        await navigator.share(validShareData);
      } catch (error) {
        console.error('Share failed:', error);
        await this.copyToClipboard(fallbackText, fallbackMessage);
      }
    } else {
      await this.copyToClipboard(fallbackText, fallbackMessage);
    }
  }
}
