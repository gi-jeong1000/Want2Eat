export type PlaceStatus = "want_to_go" | "visited" | "want_to_visit_again";

export interface Place {
  id: string;
  user_id: string;
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
}

export interface PlaceShare {
  id: string;
  place_id: string;
  shared_by: string;
  shared_with: string;
  created_at: string;
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

