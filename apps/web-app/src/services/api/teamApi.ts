const API_BASE = "http://localhost:8080";

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

export const teamApi = {
  // Lấy tất cả lớp học
  getAll: async (): Promise<{ data: Team[] }> => {
    const res = await fetch(`${API_BASE}/teams`);
    if (!res.ok) throw new Error("Failed to fetch teams");
    return res.json();
  },

  // Lấy 1 lớp học theo ID
  getById: async (id: number): Promise<{ data: Team }> => {
    const res = await fetch(`${API_BASE}/teams/${id}`);
    if (!res.ok) throw new Error("Failed to fetch team");
    return res.json();
  },

  // Lấy lớp học theo khoa
  getByDepartment: async (departmentId: number): Promise<{ data: Team[] }> => {
    const res = await fetch(`${API_BASE}/teams/department/${departmentId}`);
    if (!res.ok) throw new Error("Failed to fetch teams by department");
    return res.json();
  },

  // Tạo lớp học
  create: async (data: TeamRequest): Promise<{ data: Team }> => {
    const res = await fetch(`${API_BASE}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create team");
    return res.json();
  },

  // Cập nhật lớp học
  update: async (id: number, data: TeamRequest): Promise<{ data: Team }> => {
    const res = await fetch(`${API_BASE}/teams/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update team");
    return res.json();
  },

  // Xóa lớp học
  delete: async (id: number): Promise<{ data: null }> => {
    const res = await fetch(`${API_BASE}/teams/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete team");
    return res.json();
  },

  // Lấy danh sách thành viên lớp học
  getMembers: async (teamId: number): Promise<{ data: TeamMember[] }> => {
    const res = await fetch(`${API_BASE}/teams/${teamId}/members`);
    if (!res.ok) throw new Error("Failed to fetch team members");
    return res.json();
  },

  // Thêm thành viên vào lớp học
  addMember: async (
    teamId: number,
    data: AddTeamMemberRequest
  ): Promise<{ data: TeamMember }> => {
    const res = await fetch(`${API_BASE}/teams/${teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add team member");
    return res.json();
  },

  // Cập nhật trạng thái lớp học (khóa/mở khóa)
  updateStatus: async (teamId: number, isActive: boolean): Promise<{ data: Team }> => {
    const res = await fetch(`${API_BASE}/teams/${teamId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    if (!res.ok) throw new Error("Failed to update team status");
    return res.json();
  },
};
