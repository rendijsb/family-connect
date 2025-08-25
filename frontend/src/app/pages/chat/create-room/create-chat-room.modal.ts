import { Component, OnInit, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons,
  IonIcon, IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonLabel, IonCheckbox, IonModal, IonList, IonAvatar, IonChip
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline, chatbubbleOutline, peopleOutline, personOutline,
  megaphoneOutline, warningOutline, createOutline, addOutline
} from 'ionicons/icons';

import { ModalController } from '@ionic/angular';
import {
  ChatRoomTypeEnum,
  CreateChatRoomRequest,
  getChatRoomTypeName,
  getChatRoomTypeIcon
} from '../../../models/chat/chat.models';
import {
  FamilyMember,
  Family
} from '../../../models/families/family.models';
import { ValidationErrorDirective } from '../../../shared/directives/validation-error.directive';

export interface CreateChatRoomResult {
  name: string;
  description?: string;
  type: ChatRoomTypeEnum;
  memberIds: number[];
  isPrivate: boolean;
}

@Component({
  selector: 'app-create-chat-room-modal',
  templateUrl: './create-chat-room.modal.html',
  styleUrls: ['./create-chat-room.modal.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons,
    IonIcon, IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonLabel, IonCheckbox, IonModal, IonList, IonAvatar, IonChip,
    ValidationErrorDirective
  ]
})
export class CreateChatRoomModal implements OnInit {
  @Input() family!: Family;
  @Input() familyMembers: FamilyMember[] = [];

  private readonly formBuilder = inject(FormBuilder);
  private readonly modalController = inject(ModalController);

  chatRoomForm!: FormGroup;
  readonly isSubmitted = signal<boolean>(false);
  readonly selectedMembers = signal<number[]>([]);
  readonly ChatRoomTypeEnum = ChatRoomTypeEnum;

  readonly roomTypes = [
    {
      value: ChatRoomTypeEnum.GROUP,
      label: getChatRoomTypeName(ChatRoomTypeEnum.GROUP),
      icon: getChatRoomTypeIcon(ChatRoomTypeEnum.GROUP),
      description: 'Everyone can participate and see messages'
    },
    {
      value: ChatRoomTypeEnum.ANNOUNCEMENT,
      label: getChatRoomTypeName(ChatRoomTypeEnum.ANNOUNCEMENT),
      icon: getChatRoomTypeIcon(ChatRoomTypeEnum.ANNOUNCEMENT),
      description: 'Only moderators can send messages'
    },
    {
      value: ChatRoomTypeEnum.EMERGENCY,
      label: getChatRoomTypeName(ChatRoomTypeEnum.EMERGENCY),
      icon: getChatRoomTypeIcon(ChatRoomTypeEnum.EMERGENCY),
      description: 'Important notifications and alerts'
    }
  ];

  constructor() {
    this.addIcons();
    this.initializeForm();
  }

  ngOnInit() {
    // Pre-select all members by default
    const allMemberIds = this.familyMembers.map(member => member.id);
    this.selectedMembers.set(allMemberIds);
    this.chatRoomForm.patchValue({
      memberIds: allMemberIds
    });
  }

  private addIcons() {
    addIcons({
      closeOutline, chatbubbleOutline, peopleOutline, personOutline,
      megaphoneOutline, warningOutline, createOutline, addOutline
    });
  }

  private initializeForm() {
    this.chatRoomForm = this.formBuilder.group({
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      description: ['', [
        Validators.maxLength(200)
      ]],
      type: [ChatRoomTypeEnum.GROUP, [
        Validators.required
      ]],
      memberIds: [[], [
        Validators.required,
        Validators.minLength(1)
      ]],
      isPrivate: [false]
    });
  }

  async dismiss() {
    await this.modalController.dismiss();
  }

  async onCreateRoom() {
    this.isSubmitted.set(true);

    if (!this.chatRoomForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    const result: CreateChatRoomResult = {
      name: this.chatRoomForm.value.name.trim(),
      description: this.chatRoomForm.value.description?.trim() || undefined,
      type: this.chatRoomForm.value.type,
      memberIds: this.selectedMembers(),
      isPrivate: this.chatRoomForm.value.isPrivate
    };

    await this.modalController.dismiss(result, 'confirm');
  }

  onMemberToggle(memberId: number, event: any) {
    const isChecked = event.detail.checked;
    const currentSelected = this.selectedMembers();

    if (isChecked) {
      this.selectedMembers.set([...currentSelected, memberId]);
    } else {
      this.selectedMembers.set(currentSelected.filter(id => id !== memberId));
    }

    this.chatRoomForm.patchValue({
      memberIds: this.selectedMembers()
    });
  }

  toggleAllMembers() {
    const allMemberIds = this.familyMembers.map(member => member.id);
    const currentSelected = this.selectedMembers();

    if (currentSelected.length === allMemberIds.length) {
      // Deselect all
      this.selectedMembers.set([]);
    } else {
      // Select all
      this.selectedMembers.set(allMemberIds);
    }

    this.chatRoomForm.patchValue({
      memberIds: this.selectedMembers()
    });
  }

  isMemberSelected(memberId: number): boolean {
    return this.selectedMembers().includes(memberId);
  }

  getRoomTypeIcon(type: ChatRoomTypeEnum): string {
    return getChatRoomTypeIcon(type);
  }

  getRoomTypeName(type: ChatRoomTypeEnum): string {
    return getChatRoomTypeName(type);
  }

  private markFormGroupTouched() {
    Object.keys(this.chatRoomForm.controls).forEach(key => {
      this.chatRoomForm.get(key)?.markAsTouched();
    });
  }

  get selectedCount(): number {
    return this.selectedMembers().length;
  }

  get totalMembers(): number {
    return this.familyMembers.length;
  }
}
