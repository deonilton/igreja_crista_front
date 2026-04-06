export interface SmallFamily {
  id: number;
  member_id: number;
  created_at: string;
  updated_at: string;
  member?: {
    id: number;
    full_name: string;
    email: string | null;
    phone: string | null;
  };
}

export interface SmallFamiliesResponse {
  families: SmallFamily[];
  total: number;
  page: number;
  totalPages: number;
}

export interface MemberSearchResult {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
}

export interface FamilyMember {
  name: string;
  age: number;
}

export interface SmallFamilyFormData {
  name: string;
  responsible_id: number | null;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  host_name: string;
  host_age: number | null;
  family_members: FamilyMember[];
  is_converted: boolean;
  has_bible: boolean;
  meeting_days: string[];
}

export interface Leader {
  id: number;
  member_id: number;
  member: {
    id: number;
    full_name: string;
  };
}

export interface FullSmallFamily {
  id: number;
  name: string;
  responsible_id: number;
  responsible_name: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  host_name: string;
  host_age: number;
  is_converted: boolean;
  has_bible: boolean;
  meeting_days: string[];
  family_members: FamilyMember[];
  created_at: string;
}
