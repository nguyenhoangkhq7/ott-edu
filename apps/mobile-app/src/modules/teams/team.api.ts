import { apiClient } from "../api";

export interface Team {
  id: number;
  name: string;
  description?: string;
  joinCode: string;
  departmentId: number;
  isActive?: boolean;
  isApprovalRequired?: boolean;
  createdAt?: string;
}

export interface TeamRequest {
  name: string;
  description: string;
  joinCode: string;
  departmentId: number;
  isApprovalRequired?: boolean;
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

export interface JoinRequestResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  requestedAt: string;
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

  updateApprovalSetting: async (teamId: number, isApprovalRequired: boolean): Promise<null> => {
    return apiClient.patch<null, null>(`${BASE_PATH}/${teamId}/approval-setting?isApprovalRequired=${isApprovalRequired}`, null);
  },

  joinWithCode: async (joinCode: string): Promise<Team> => {
    return apiClient.post<Team, null>(`${BASE_PATH}/join/${joinCode}`, null);
  },

  getPendingJoinRequests: async (teamId: number): Promise<JoinRequestResponse[]> => {
    return apiClient.get<JoinRequestResponse[]>(`${BASE_PATH}/${teamId}/join-requests`);
  },

  approveJoinRequest: async (teamId: number, requestId: number): Promise<null> => {
    return apiClient.post<null, null>(`${BASE_PATH}/${teamId}/join-requests/${requestId}/approve`, null);
  },

  rejectJoinRequest: async (teamId: number, requestId: number): Promise<null> => {
    return apiClient.post<null, null>(`${BASE_PATH}/${teamId}/join-requests/${requestId}/reject`, null);
  },
};