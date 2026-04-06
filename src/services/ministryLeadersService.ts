import api from './api';
import type { 
  Ministry, 
  MinistryLeader, 
  MinistryWithLeaders, 
  MinistryLeadersResponse,
  CreateMinistryLeaderRequest,
  UpdateMinistryLeaderRequest,
  MemberSearchResult 
} from '../types/ministryLeaders';

class MinistryLeadersService {
  // Buscar todos os ministérios com seus líderes
  async getMinistriesWithLeaders(): Promise<MinistryWithLeaders[]> {
    const response = await api.get<MinistryLeadersResponse>('/ministries/leaders');
    return response.data.ministries;
  }

  // Buscar líderes de um ministério específico
  async getMinistryLeaders(ministryId: string): Promise<MinistryLeader[]> {
    const response = await api.get<MinistryLeader[]>(`/ministries/${ministryId}/leaders`);
    return response.data;
  }

  // Adicionar líder a um ministério
  async addLeader(data: CreateMinistryLeaderRequest): Promise<MinistryLeader> {
    const response = await api.post<MinistryLeader>('/ministries/leaders', data);
    return response.data;
  }

  // Atualizar líder de um ministério
  async updateLeader(leaderId: number, data: UpdateMinistryLeaderRequest): Promise<MinistryLeader> {
    const response = await api.put<MinistryLeader>(`/ministries/leaders/${leaderId}`, data);
    return response.data;
  }

  // Remover líder de um ministério
  async removeLeader(leaderId: number): Promise<void> {
    await api.delete(`/ministries/leaders/${leaderId}`);
  }

  // Buscar membros para autocomplete
  async searchMembers(query: string): Promise<MemberSearchResult[]> {
    const response = await api.get<MemberSearchResult[]>('/ministries/members/search', {
      params: { query }
    });
    return response.data;
  }

  // Verificar se membro é líder de algum ministério
  async getMemberLeaderships(memberId: number): Promise<MinistryLeader[]> {
    const response = await api.get<MinistryLeader[]>(`/members/${memberId}/leaderships`);
    return response.data;
  }
}

export default new MinistryLeadersService();
