export type UserRole = 'MHP' | 'CHW' | 'FAMILY' | 'ADMIN';

export class CreateUserDto {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
  workplace?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
}
