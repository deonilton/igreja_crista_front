export interface CasaDePaz {
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

export interface CasasDePazResponse {
  casas: CasaDePaz[];
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

export interface CasaDePazFormData {
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

export interface FullCasaDePaz {
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

export interface EvangelismoReport {
  id: number;
  casa_de_paz_id: number;
  cult_date: string;
  horario_inicio: string;
  horario_termino: string;
  responsavel: string;
  endereco: string;
  bairro: string;
  participantes: string;
  new_visitors: number;
  conversions: number;
  offeringAmount: number;
  observacoes: string;
  casa_de_paz?: {
    id: number;
    name: string;
    member?: {
      full_name: string;
    };
  };
}

export interface EvangelismoReportsResponse {
  reports: EvangelismoReport[];
  total: number;
  page: number;
  totalPages: number;
}
