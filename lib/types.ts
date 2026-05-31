// lib/types.ts

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  user_type: string;
  staff_level: number;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  token: string;
  user: AdminUser;
  staff_level: number;
}
