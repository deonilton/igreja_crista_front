import type { PermissionResource } from '../permissions/accessControl';

// User types
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'lider' | 'colaborador' | 'membro';
  ministries?: string[];
}

// Auth context
export interface AuthContextData {
  user: User | null;
  loading: boolean;
  signed: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (resource: PermissionResource, ministry?: string) => boolean;
  hasMinistryAccess: (ministry: string) => boolean;
  refreshUser: () => Promise<void>;
}

// Member types
export interface Member {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  gender: 'M' | 'F' | 'Outro' | null;
  address: string | null;
  house_number: string | null;
  complement: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  baptism_date: string | null;
  membership_date: string | null;
  status: 'Ativo' | 'Inativo' | 'Visitante';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberFormData {
  full_name: string;
  email: string;
  phone: string;
  birth_date: string;
  gender: string;
  address: string;
  house_number: string;
  complement: string;
  city: string;
  state: string;
  zip_code: string;
  baptism_date: string;
  membership_date: string;
  status: string;
  notes: string;
}

// Dashboard types
export interface DashboardStats {
  total: number;
  actives: number;
  inactives: number;
  visitors: number;
  recentRegistrations: number;
}

export interface AgeRangeStats {
  children: number;
  teenagers: number;
  youngAdults: number;
  adults: number;
  elderly: number;
}

export interface GenderStat {
  gender: string;
  total: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentMembers: Member[];
  genderDistribution: GenderStat[];
}

// API response types
export interface LoginResponse {
  token: string;
  user: User;
}

export interface MembersResponse {
  members: Member[];
  total: number;
  page: number;
  totalPages: number;
}

export interface MemberResponse {
  member: Member;
}

export interface ApiError {
  error: string;
}

// Re-export occurrence types
export * from './occurrences';

// Re-export cult report types
export * from './cultReports';
