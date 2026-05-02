import { apiClient } from "../api";

export interface Team {
  id: number;
  name: string;
  description?: string;
  joinCode: string;
  departmentId: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface TeamRequest {
  name: string;
  description: string;
  joinCode: string;
  departmentId: number;
}

export interface TeamMember {
  id: number;
  accountId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  joinedAt: string;
  avatar?: string;
}

export interface AddTeamMemberRequest {
  accountId?: number;
  email?: string;
  role: "MEMBER" | "LEADER";
}

const BASE_PATH = "/teams";

export const teamApi = {
  getAll: async (): Promise<Team[]> => {
    return apiClient.get<Team[]>(BASE_PATH);
  },

  getById: async (id: number): Promise<Team> => {
    return apiClient.get<Team>(`${BASE_PATH}/${id}`);
  },

  getByDepartment: async (departmentId: number): Promise<Team[]> => {
    return apiClient.get<Team[]>(`${BASE_PATH}/department/${departmentId}`);
  },

  create: async (data: TeamRequest): Promise<Team> => {
    return apiClient.post<Team, TeamRequest>(BASE_PATH, data);
  },

  update: async (id: number, data: TeamRequest): Promise<Team> => {
    return apiClient.update<Team, TeamRequest>(`${BASE_PATH}/${id}`, data);
  },

  delete: async (id: number): Promise<null> => {
    return apiClient.delete<null>(`${BASE_PATH}/${id}`);
  },

  getMembers: async (teamId: number): Promise<TeamMember[]> => {
    return apiClient.get<TeamMember[]>(`${BASE_PATH}/${teamId}/members`);
  },

  addMember: async (teamId: number, data: AddTeamMemberRequest): Promise<TeamMember> => {
    return apiClient.post<TeamMember, AddTeamMemberRequest>(`${BASE_PATH}/${teamId}/members`, data);
  },

  deleteMember: async (teamId: number, memberId: number): Promise<null> => {
    return apiClient.delete<null>(`${BASE_PATH}/${teamId}/members/${memberId}`);
  },

  updateStatus: async (teamId: number, isActive: boolean): Promise<Team> => {
    return apiClient.patch<Team, { isActive: boolean }>(`${BASE_PATH}/${teamId}/status`, { isActive });
  },
};