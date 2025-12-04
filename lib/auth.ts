// 간단한 파일 기반 인증 시스템
// Vercel 환경 변수에서 계정 정보를 가져옴

export interface User {
  id: string;
  username: string;
  name: string;
  supabaseUserId?: string; // Supabase user_id 매핑용
}

// 계정 정보 (환경 변수에서 비밀번호 가져오기)
const USER_CONFIG = [
  {
    username: "chun",
    password: process.env.USER1_PASSWORD || "1009",
    name: "기정",
    id: "1",
    supabaseUserId: process.env.USER1_SUPABASE_ID || "1", // Supabase user_id
  },
  {
    username: "haneul",
    password: process.env.USER2_PASSWORD || "1009",
    name: "하늘",
    id: "2",
    supabaseUserId: process.env.USER2_SUPABASE_ID || "2", // Supabase user_id
  },
  {
    username: "test",
    password: process.env.TEST_USER_PASSWORD || "test123",
    name: "테스트",
    id: "3",
    supabaseUserId: process.env.TEST_USER_SUPABASE_ID || "3", // Supabase user_id
  },
];

export function authenticate(username: string, password: string): User | null {
  const user = USER_CONFIG.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    supabaseUserId: user.supabaseUserId,
  };
}

export function getUserById(id: string): User | null {
  const user = USER_CONFIG.find((u) => u.id === id);
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    supabaseUserId: user.supabaseUserId,
  };
}

export function getUserByUsername(username: string): User | null {
  const user = USER_CONFIG.find((u) => u.username === username);
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    supabaseUserId: user.supabaseUserId,
  };
}
