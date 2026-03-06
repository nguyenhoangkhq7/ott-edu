type LoginPayload = {
  email: string;
  password: string;
};

export type SchoolOption = {
  id: number;
  name: string;
};

export type DepartmentOption = {
  id: number;
  name: string;
  schoolId: number;
};

export type RegisterPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleName: "ROLE_STUDENT" | "ROLE_INSTRUCTOR";
  code: string;
  schoolId: number | null;
  departmentId: number | null;
  customSchool: string | null;
  customDepartment: string | null;
};

type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

const MOCK_EMAIL = "admin@ott.edu.vn";
const MOCK_PASSWORD = "12345678";
const DEFAULT_API_BASE_URL = "http://localhost:8000";

function getApiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_URL?.trim();
  return value && value.length > 0 ? value.replace(/\/$/, "") : DEFAULT_API_BASE_URL;
}

async function parseErrorResponse(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) {
    return "Không thể xử lý yêu cầu lúc này.";
  }

  try {
    const data = JSON.parse(text) as { message?: string };
    if (typeof data.message === "string" && data.message.trim().length > 0) {
      return data.message;
    }
  } catch {
    // Keep plain text fallback below when response is not JSON.
  }

  return text;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export async function mockLogin(payload: LoginPayload): Promise<LoginResponse> {
  await sleep(900);

  const email = payload.email.trim().toLowerCase();
  const password = payload.password;

  if (email !== MOCK_EMAIL || password !== MOCK_PASSWORD) {
    throw new Error("Email hoặc mật khẩu chưa chính xác.");
  }

  return {
    accessToken: "mock-jwt-token",
    user: {
      id: "user-admin",
      name: "OTT Admin",
      email: MOCK_EMAIL,
    },
  };
}

export async function getSchools(): Promise<SchoolOption[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/core/schools`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return (await response.json()) as SchoolOption[];
}

export async function getDepartmentsBySchoolId(schoolId: number): Promise<DepartmentOption[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/core/schools/${schoolId}/departments`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return (await response.json()) as DepartmentOption[];
}

export async function registerAccount(payload: RegisterPayload): Promise<string> {
  const response = await fetch(`${getApiBaseUrl()}/api/core/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  const text = await response.text();
  return text || "Tạo tài khoản thành công!";
}