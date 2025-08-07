export enum RoleEnum {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  CLIENT = 'client'
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: RoleEnum;
  token?: string;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}
