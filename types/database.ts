export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      places: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          naver_place_id: string | null;
          rating: number | null;
          comment: string | null;
          status: "want_to_go" | "visited" | "want_to_visit_again";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          naver_place_id?: string | null;
          rating?: number | null;
          comment?: string | null;
          status?: "want_to_go" | "visited" | "want_to_visit_again";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          address?: string;
          latitude?: number;
          longitude?: number;
          naver_place_id?: string | null;
          rating?: number | null;
          comment?: string | null;
          status?: "want_to_go" | "visited" | "want_to_visit_again";
          created_at?: string;
          updated_at?: string;
        };
      };
      place_images: {
        Row: {
          id: string;
          place_id: string;
          image_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          place_id: string;
          image_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          place_id?: string;
          image_url?: string;
          created_at?: string;
        };
      };
      place_posts: {
        Row: {
          id: string;
          place_id: string;
          user_id: string;
          title: string;
          content: string;
          visited_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          place_id: string;
          user_id: string;
          title: string;
          content: string;
          visited_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          place_id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          visited_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      place_post_images: {
        Row: {
          id: string;
          post_id: string;
          image_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          image_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          image_url?: string;
          created_at?: string;
        };
      };
      place_shares: {
        Row: {
          id: string;
          place_id: string;
          shared_by: string;
          shared_with: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          place_id: string;
          shared_by: string;
          shared_with: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          place_id?: string;
          shared_by?: string;
          shared_with?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

