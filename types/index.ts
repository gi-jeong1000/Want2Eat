export type PlaceStatus = "want_to_go" | "visited" | "want_to_visit_again";

export interface Group {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  created_at: string;
}

export interface Place {
  id: string;
  user_id: string;
  group_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  naver_place_id: string | null;
  rating: number | null;
  comment: string | null;
  status: PlaceStatus;
  created_at: string;
  updated_at: string;
}

export interface PlaceImage {
  id: string;
  place_id: string;
  image_url: string;
  created_at: string;
}

export interface PlacePost {
  id: string;
  place_id: string;
  user_id: string;
  title: string;
  content: string;
  visited_at: string;
  created_at: string;
  updated_at: string;
}

export interface PlacePostImage {
  id: string;
  post_id: string;
  image_url: string;
  created_at: string;
}

export interface PlacePostWithImages extends PlacePost {
  images: PlacePostImage[];
}

export interface PlaceWithImages extends Place {
  images: PlaceImage[];
  posts?: PlacePostWithImages[];
  comments?: PlaceComment[];
}

export interface PlaceComment {
  id: string;
  place_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface NaverPlace {
  title: string;
  link: string;
  category: string;
  description: string;
  telephone: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
  placeId?: string;
}

export interface NaverSearchResponse {
  items: NaverPlace[];
  total: number;
  start: number;
  display: number;
}

// 카카오 맵 API 타입
export interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string; // 경도
  y: string; // 위도
  place_url: string;
  distance?: string;
}

export interface KakaoSearchResponse {
  documents: KakaoPlace[];
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
}

export interface KakaoPlaceDetail {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  // 음식점 정보
  menu_info?: string;
  // 운영 시간
  open_hour?: string;
  // 기타 정보
  homepage?: string;
  // 별점 (카카오맵에서 제공하는 경우)
  rating?: number;
}

