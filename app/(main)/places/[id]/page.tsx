"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseUserId } from "@/lib/get-user-id";
import { PlaceWithImages } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Star,
  CheckCircle2,
  Trash2,
  Loader2,
  Heart,
  Calendar,
  Plus,
  User,
  MessageSquare,
  ArrowLeft,
  Utensils,
  Phone,
  Globe,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale/ko";
import { PlaceStatus, PlaceComment } from "@/types";
import { PlaceCommentCard } from "@/components/places/PlaceCommentCard";
import { PlaceCommentForm } from "@/components/places/PlaceCommentForm";
import { PlacePostForm } from "@/components/places/PlacePostForm";
import { getPlaceDetail } from "@/lib/kakao/place";

export default function PlaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [kakaoDetail, setKakaoDetail] = useState<any>(null);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  // params.id를 안전하게 처리
  const placeId = typeof params.id === "string" ? params.id : params.id?.[0];

  if (!placeId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">장소 ID가 없습니다.</p>
      </div>
    );
  }

  const { data: place, isLoading } = useQuery({
    queryKey: ["place", placeId],
    queryFn: async () => {
      const response = await fetch(`/api/places/${placeId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorData = await response.json().catch(() => ({}));
        console.error("장소 조회 오류:", errorData.error || "알 수 없는 오류");
        return null;
      }

      const data = await response.json();
      return data as PlaceWithImages;
    },
  });

  // 카카오 맵 상세 정보 가져오기
  useEffect(() => {
    if (place?.naver_place_id) {
      getPlaceDetail(place.naver_place_id)
        .then((detail) => setKakaoDetail(detail))
        .catch((err) => console.error("카카오 상세 정보 조회 실패:", err));
    }
  }, [place?.naver_place_id]);

  // 사용자 이름 가져오기
  useEffect(() => {
    if (!place) return;

    const fetchUserNames = async () => {
      const userIds = new Set<string>();
      if (place.user_id) userIds.add(place.user_id);
      if (place.posts) {
        place.posts.forEach((post) => {
          if (post.user_id) userIds.add(post.user_id);
        });
      }
      if (place.comments) {
        place.comments.forEach((comment) => {
          if (comment.user_id) userIds.add(comment.user_id);
        });
      }

      const namePromises = Array.from(userIds).map(async (userId) => {
        try {
          const response = await fetch(`/api/users/${userId}`);
          if (response.ok) {
            const data = await response.json();
            return { userId, name: data.name };
          }
        } catch (err) {
          console.error(`사용자 ${userId} 이름 조회 실패:`, err);
        }
        return { userId, name: "알 수 없음" };
      });

      const results = await Promise.all(namePromises);
      const nameMap: Record<string, string> = {};
      results.forEach(({ userId, name }) => {
        nameMap[userId] = name;
      });
      setUserNames(nameMap);
    };

    fetchUserNames();
  }, [place]);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
      ) {
        throw new Error("Supabase가 설정되지 않았습니다.");
      }

      if (place?.images && place.images.length > 0) {
        const imagePaths = place.images.map((img) => {
          const url = new URL(img.image_url);
          return url.pathname.split("/").slice(-2).join("/");
        });
        await supabase.storage.from("place-images").remove(imagePaths);
      }

      await supabase.from("place_images").delete().eq("place_id", placeId);
      const { error } = await supabase
        .from("places")
        .delete()
        .eq("id", placeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["places"] });
      router.push("/places");
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/places/${placeId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "코멘트 작성에 실패했습니다.");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["place", placeId] });
      setShowCommentForm(false);
    },
  });

  const handleCreateComment = (content: string) => {
    createCommentMutation.mutate(content);
  };

  const createPostMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      visited_at: string;
      images: File[];
    }) => {
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
      ) {
        throw new Error("Supabase가 설정되지 않았습니다.");
      }

      const userId = getSupabaseUserId();
      if (!userId) throw new Error("로그인이 필요합니다.");

      const { data: post, error: postError } = await supabase
        .from("place_posts")
        .insert({
          place_id: placeId,
          user_id: userId,
          title: data.title,
          content: data.content,
          visited_at: data.visited_at,
        } as any)
        .select()
        .single();

      if (postError) throw postError;

      const postData = post as { id: string } | null;

      if (data.images.length > 0 && postData) {
        const uploadPromises = data.images.map(async (file) => {
          const fileExt = file.name.split(".").pop();
          const fileName = `posts/${postData.id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("place-images")
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from("place-images").getPublicUrl(fileName);

          return {
            post_id: postData.id,
            image_url: publicUrl,
          };
        });

        const imageData = await Promise.all(uploadPromises);

        const { error: imagesError } = await supabase
          .from("place_post_images")
          .insert(imageData as any);

        if (imagesError) throw imagesError;
      }

      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["place", placeId] });
      queryClient.invalidateQueries({ queryKey: ["places"] });
      setShowPostForm(false);
    },
  });

  const handleCreatePost = (data: {
    title: string;
    content: string;
    visited_at: string;
    images: File[];
  }) => {
    createPostMutation.mutate(data);
  };

  const handleDelete = () => {
    if (confirm("정말 이 장소를 삭제하시겠습니까?")) {
      deleteMutation.mutate();
    }
  };

  const currentUserId = getSupabaseUserId();
  const isOwner = place && currentUserId === place.user_id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">장소를 찾을 수 없습니다.</p>
          <Button onClick={() => router.push("/places")}>
            장소 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  // 상태 태그 스타일
  const getStatusTag = () => {
    if (place.status === "want_to_go") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <Calendar className="h-3.5 w-3.5" />
          갈 곳
        </span>
      );
    }
    if (place.status === "visited") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          갔던 곳
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-pink-50 text-pink-700 border border-pink-200">
        <Heart className="h-3.5 w-3.5" />
        또 가고 싶은 곳
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 뒤로가기 버튼 */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="h-9 px-3 -ml-2"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            뒤로
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 1. 식당 사진 (카카오 맵 기반) */}
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
          {place.images && place.images.length > 0 ? (
            <Image
              src={place.images[0].image_url}
              alt={place.name}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          ) : kakaoDetail?.place_url ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-sky-50 p-8">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-blue-200 rounded-full blur-2xl opacity-30" />
                <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
                  <Utensils className="h-16 w-16 text-blue-400" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-2">
                {place.name}
              </p>
              <a
                href={kakaoDetail.place_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 hover:underline transition-colors font-medium"
              >
                <MapPin className="h-3.5 w-3.5" />
                카카오맵에서 사진과 메뉴 보기
              </a>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-50">
              <MapPin className="h-16 w-16 text-blue-300" />
            </div>
          )}
        </div>

        {/* 2. 식당 이름 + 태그 (갈곳/간곳, 작성자, 삭제 버튼) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                {place.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                {getStatusTag()}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                  <User className="h-3.5 w-3.5" />
                  {userNames[place.user_id] || "로딩 중..."}
                </span>
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* 주소 */}
          <div className="flex items-start gap-2 text-sm text-gray-600 pt-3 border-t border-gray-100">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span className="flex-1">{place.address}</span>
          </div>
        </div>

        {/* 3. 별점, 메뉴들 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          {/* 별점 */}
          {place.rating && (
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <span className="text-lg font-semibold text-gray-900">
                {place.rating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">/ 5.0</span>
            </div>
          )}

          {/* 카테고리 정보 */}
          {kakaoDetail?.category_name && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium">
                {kakaoDetail.category_name}
              </span>
            </div>
          )}

          {/* 전화번호 */}
          {kakaoDetail?.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-700 pt-4 border-t border-gray-100">
              <Phone className="h-4 w-4 text-gray-400" />
              <a
                href={`tel:${kakaoDetail.phone}`}
                className="hover:text-blue-600 hover:underline"
              >
                {kakaoDetail.phone}
              </a>
            </div>
          )}

          {/* 홈페이지 */}
          {kakaoDetail?.homepage && (
            <div className="flex items-center gap-2 text-sm text-gray-700 pt-2">
              <Globe className="h-4 w-4 text-gray-400" />
              <a
                href={kakaoDetail.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate"
              >
                홈페이지
              </a>
            </div>
          )}

          {/* 카카오맵 링크 - 사진과 메뉴 정보 확인 */}
          {kakaoDetail?.place_url && (
            <div className="pt-4 border-t border-gray-100">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">
                      카카오맵에서 더 보기
                    </h4>
                    <p className="text-xs text-gray-600 mb-3">
                      사진, 메뉴, 리뷰 등 상세 정보를 카카오맵에서 확인하세요
                    </p>
                    <a
                      href={kakaoDetail.place_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      카카오맵에서 보기
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. 댓글 섹션 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              댓글 {place.comments?.length || 0}
            </h2>
            {!showCommentForm && (
              <Button
                size="sm"
                onClick={() => setShowCommentForm(true)}
                className="h-9"
              >
                <MessageSquare className="h-4 w-4 mr-1.5" />
                댓글 작성
              </Button>
            )}
          </div>

          {showCommentForm && (
            <div className="mb-6">
              <PlaceCommentForm
                placeId={placeId}
                onSubmit={handleCreateComment}
                isLoading={createCommentMutation.isPending}
              />
            </div>
          )}

          {place.comments && place.comments.length > 0 ? (
            <div className="space-y-4">
              {place.comments.map((comment: PlaceComment) => (
                <PlaceCommentCard
                  key={comment.id}
                  comment={comment}
                  placeId={placeId}
                  userName={userNames[comment.user_id]}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-4">
                아직 작성된 댓글이 없습니다.
              </p>
              {!showCommentForm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCommentForm(true)}
                >
                  첫 댓글 작성하기
                </Button>
              )}
            </div>
          )}
        </div>

        {/* 5. 방문 기록 섹션 (사진 등록) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              방문 기록 {place.posts?.length || 0}
            </h2>
            {!showPostForm && (
              <Button
                size="sm"
                onClick={() => setShowPostForm(true)}
                className="h-9"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                기록 작성
              </Button>
            )}
          </div>

          {showPostForm && (
            <div className="mb-6">
              <PlacePostForm
                placeName={place.name}
                onSubmit={handleCreatePost}
                onCancel={() => setShowPostForm(false)}
                isLoading={createPostMutation.isPending}
              />
            </div>
          )}

          {place.posts && place.posts.length > 0 ? (
            <div className="space-y-6">
              {place.posts.map((post) => (
                <div
                  key={post.id}
                  className="border-t border-gray-100 pt-6 first:border-t-0 first:pt-0"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-sky-400 flex items-center justify-center text-white text-sm font-semibold">
                      {userNames[post.user_id]?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {userNames[post.user_id] || "로딩 중..."}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(post.visited_at), "yyyy년 M월 d일", {
                          locale: ko,
                        })}
                      </p>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-3">
                    {post.content}
                  </p>
                  {post.images && post.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {post.images.map((img) => (
                        <div
                          key={img.id}
                          className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                        >
                          <Image
                            src={img.image_url}
                            alt={post.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-4">
                아직 작성된 방문 기록이 없습니다.
              </p>
              {!showPostForm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPostForm(true)}
                >
                  첫 기록 작성하기
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
