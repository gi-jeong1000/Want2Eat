// Supabase user_id를 기반으로 사용자 이름 가져오기
// 환경 변수에서 사용자 정보를 가져옴

export function getUserNameBySupabaseId(supabaseUserId: string | null | undefined): string | null {
  if (!supabaseUserId) return null;

  // 환경 변수에서 사용자 정보 가져오기
  const users = [
    {
      name: "기정",
      supabaseUserId: process.env.USER1_SUPABASE_ID,
    },
    {
      name: "하늘",
      supabaseUserId: process.env.USER2_SUPABASE_ID,
    },
    {
      name: "테스트",
      supabaseUserId: process.env.TEST_USER_SUPABASE_ID,
    },
  ];

  const user = users.find((u) => u.supabaseUserId === supabaseUserId);
  return user ? user.name : null;
}

