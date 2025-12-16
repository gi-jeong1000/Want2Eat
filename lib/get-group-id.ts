// 모임 ID를 가져오는 함수
// 현재는 하나의 고정된 모임 ID를 사용 (환경 변수에서 가져옴)
// 나중에 사용자별로 여러 모임을 가질 수 있도록 확장 가능

export function getGroupId(): string | null {
  // 환경 변수에서 모임 ID 가져오기
  const groupId = process.env.NEXT_PUBLIC_GROUP_ID;
  
  if (!groupId || groupId.includes("placeholder")) {
    console.warn("GROUP_ID가 설정되지 않았습니다.");
    return null;
  }
  
  return groupId;
}

export function getGroupIdFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  
  // 쿠키에서 group_id 가져오기 (필요한 경우)
  // 현재는 환경 변수에서 가져오므로 쿠키는 사용하지 않음
  return getGroupId();
}

