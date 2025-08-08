export enum RoleEnum {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  FAMILY_OWNER = 'family_owner',
  FAMILY_MEMBER = 'family_member',
  CLIENT = 'client'
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: RoleEnum;
  role_display_name?: string;
  token?: string;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}
