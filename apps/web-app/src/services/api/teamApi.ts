import { httpService } from "./http.service";

export interface Team {
  id: number;
  name: string;
  description?: string;
  joinCode: string;
  departmentId: number;
  createdAt?: string;
  isActive?: boolean;
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
}

export interface AddTeamMemberRequest {
  accountId: number;
  role: "MEMBER" | "LEADER";
}

// Interface cho cấu trúc wrap data của backend
export interface ApiSuccessResponse<T> {
  timestamp: string;
  status: number;
  message: string;
  data: T;
}

// Gateway route: /api/core/ -> core-service:8080/
const BASE_PATH = "/teams";

export const teamApi = {
  // Lấy tất cả lớp học
  getAll: async (): Promise<Team[]> => {
    return httpService.get<Team[]>(BASE_PATH);
  },

  // Lấy 1 lớp học theo ID
  getById: async (id: number): Promise<Team> => {
    return httpService.get<Team>(`${BASE_PATH}/${id}`);
  },

  // Lấy lớp học theo khoa
  getByDepartment: async (departmentId: number): Promise<Team[]> => {
    return httpService.get<Team[]>(`${BASE_PATH}/department/${departmentId}`);
  },

  // Tạo lớp học
  create: async (data: TeamRequest): Promise<Team> => {
    return httpService.post<Team>(BASE_PATH, data);
  },

  // Cập nhật lớp học
  update: async (id: number, data: TeamRequest): Promise<Team> => {
    return httpService.put<Team>(`${BASE_PATH}/${id}`, data);
  },

  // Xóa lớp học
  delete: async (id: number): Promise<null> => {
    return httpService.delete<null>(`${BASE_PATH}/${id}`);
  },

  // Lấy danh sách thành viên lớp học
  getMembers: async (teamId: number): Promise<TeamMember[]> => {
    return httpService.get<TeamMember[]>(`${BASE_PATH}/${teamId}/members`);
  },

  // Thêm thành viên vào lớp học
  addMember: async (
    teamId: number,
    data: AddTeamMemberRequest
  ): Promise<TeamMember> => {
    return httpService.post<TeamMember>(`${BASE_PATH}/${teamId}/members`, data);
  },

  // Xóa thành viên khỏi lớp học
  deleteMember: async (teamId: number, memberId: number): Promise<null> => {
    return httpService.delete<null>(`${BASE_PATH}/${teamId}/members/${memberId}`);
  },

  // Cập nhật trạng thái lớp học (khóa/mở khóa)
  updateStatus: async (teamId: number, isActive: boolean): Promise<Team> => {
    return httpService.patch<Team>(`${BASE_PATH}/${teamId}/status`, { isActive });
  },
};
