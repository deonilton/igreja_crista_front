export interface Ministry {
  id: string;
  name: string;
  description?: string;
}

export interface MinistryLeader {
  id: number;
  ministry_id: string;
  member_id: number;
  role: 'leader' | 'co_leader';
  created_at: string;
  updated_at: string;
  member?: {
    id: number;
    full_name: string;
    email: string | null;
    phone: string | null;
  };
  ministry?: {
    id: string;
    name: string;
  };
}

export interface MinistryWithLeaders extends Ministry {
  leaders: MinistryLeader[];
}

export interface MinistryLeadersResponse {
  ministries: MinistryWithLeaders[];
  total: number;
}

export interface CreateMinistryLeaderRequest {
  ministry_id: string;
  member_id: number;
  role: 'leader' | 'co_leader';
}

export interface UpdateMinistryLeaderRequest {
  member_id: number;
  role?: 'leader' | 'co_leader';
}

export interface MemberSearchResult {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
}
