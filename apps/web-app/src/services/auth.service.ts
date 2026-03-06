type LoginPayload = {
  email: string;
  password: string;
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