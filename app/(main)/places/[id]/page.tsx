"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseUserId } from "@/lib/get-user-id";
import { PlaceWithImages } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Star,
  CheckCircle2,
  Circle,
  Trash2,
  Save,
  Loader2,
  Heart,
  Calendar,
  Plus,
  Share2,
  User,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale/ko";
import { PlaceStatus, PlacePostWithImages, PlaceComment } from "@/types";
import { PlacePostCard } from "@/components/places/PlacePostCard";
import { PlacePostForm } from "@/components/places/PlacePostForm";
import { PlaceCommentCard } from "@/components/places/PlaceCommentCard";
import { PlaceCommentForm } from "@/components/places/PlaceCommentForm";
import { getUserNameBySupabaseId } from "@/lib/get-user-name";

export default function PlaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<PlaceStatus>("want_to_go");
  const [isEditing, setIsEditing] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [showShareForm, setShowShareForm] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

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
      // 서버 사이드 API를 통해 조회 (RLS 정책 우회)
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

  useEffect(() => {
    if (place) {
      setComment(place.comment || "");
      setStatus(place.status);
    }
  }, [place]);

  const updateMutation = useMutation({
    mutationFn: async (updates: { comment?: string; status?: PlaceStatus }) => {
      // 환경 변수가 없으면 에러 발생
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
      ) {
        throw new Error("Supabase가 설정되지 않았습니다.");
      }

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      } as any;

      // @ts-ignore - Supabase 타입 추론 문제
      const { data, error } = await (supabase.from("places") as any)
        .update(updateData)
        .eq("id", placeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["place", placeId] });
      queryClient.invalidateQueries({ queryKey: ["places"] });
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // 환경 변수가 없으면 에러 발생
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
      ) {
        throw new Error("Supabase가 설정되지 않았습니다.");
      }

      // 이미지 삭제
      if (place?.images && place.images.length > 0) {
        const imagePaths = place.images.map((img) => {
          const url = new URL(img.image_url);
          return url.pathname.split("/").slice(-2).join("/");
        });

        await supabase.storage.from("place-images").remove(imagePaths);
      }

      // place_images 테이블에서 삭제
      await supabase.from("place_images").delete().eq("place_id", placeId);

      // places 테이블에서 삭제
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

      // 파일 기반 인증에서 user_id 가져오기
      const userId = getSupabaseUserId();
      if (!userId) throw new Error("로그인이 필요합니다.");

      // 포스팅 생성
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

      // 타입 단언
      const postData = post as { id: string } | null;

      // 이미지 업로드
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

  const sharePlaceMutation = useMutation({
    mutationFn: async (email: string) => {
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
      ) {
        throw new Error("Supabase가 설정되지 않았습니다.");
      }

      // 파일 기반 인증에서 user_id 가져오기
      const userId = getSupabaseUserId();
      if (!userId) throw new Error("로그인이 필요합니다.");

      // 공유 기능: 이메일로 사용자 찾기
      // Supabase에서는 auth.users를 직접 조회할 수 없으므로
      // 간단하게 공유 링크를 생성하거나, 사용자 프로필 테이블을 만들어야 함
      // 여기서는 공유 기능을 나중에 구현하고, 일단 알림만 표시

      // TODO: 공유 기능 구현
      // 1. 사용자 프로필 테이블 생성 (email, user_id)
      // 2. 이메일로 사용자 찾기
      // 3. place_shares에 저장

      alert("공유 기능은 준비 중입니다. 곧 사용할 수 있습니다!");
      throw new Error("공유 기능 준비 중");
    },
    onSuccess: () => {
      setShareEmail("");
      setShowShareForm(false);
      alert("장소가 공유되었습니다!");
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

  const handleSave = () => {
    updateMutation.mutate({
      comment,
      status,
    });
  };

  const handleCreatePost = (data: {
    title: string;
    content: string;
    visited_at: string;
    images: File[];
  }) => {
    createPostMutation.mutate(data);
  };

  const handleShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail.trim()) {
      alert("이메일을 입력해주세요.");
      return;
    }
    sharePlaceMutation.mutate(shareEmail);
  };

  const handleDelete = () => {
    if (confirm("정말 이 장소를 삭제하시겠습니까?")) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            장소를 찾을 수 없습니다
          </h2>
          <p className="text-muted-foreground mb-6">
            요청하신 장소가 존재하지 않거나 삭제되었습니다.
          </p>
          <Button onClick={() => router.push("/places")}>
            장소 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 -ml-2"
        >
          ← 뒤로가기
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{place.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{place.address}</span>
            </div>
          </div>
          {place.status === "want_to_go" && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
              <Calendar className="h-4 w-4" />갈 곳
            </div>
          )}
          {place.status === "visited" && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              갔던 곳
            </div>
          )}
          {place.status === "want_to_visit_again" && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-50 text-pink-700 rounded-full text-sm font-medium">
              <Heart className="h-4 w-4" />또 가고 싶은 곳
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {place.images && place.images.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>사진</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    ({place.images.length}장)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {place.images.map((image) => (
                    <div
                      key={image.id}
                      className="relative aspect-square rounded-lg overflow-hidden border border-border group"
                    >
                      <Image
                        src={image.image_url}
                        alt={place.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                위치 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start text-sm">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="break-words">{place.address}</span>
              </div>
              {place.rating && (
                <div className="flex items-center text-sm pt-2 border-t">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-2" />
                  <span className="font-medium">
                    네이버 별점: {place.rating.toFixed(1)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm pt-2 border-t">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  저장한 사람: {getUserNameBySupabaseId(place.user_id) || "알 수 없음"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>상태 및 코멘트</CardTitle>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setComment(place.comment || "");
                        setStatus(place.status);
                      }}
                      disabled={updateMutation.isPending}
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      저장
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    수정
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-3">
                  <Label>상태 선택</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus("want_to_go")}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        status === "want_to_go"
                          ? "border-blue-500 bg-blue-50"
                          : "border-border hover:border-blue-300"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-xl mb-1">📅</div>
                        <div className="text-xs font-medium">갈 곳</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("visited")}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        status === "visited"
                          ? "border-green-500 bg-green-50"
                          : "border-border hover:border-green-300"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-xl mb-1">✅</div>
                        <div className="text-xs font-medium">갔던 곳</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("want_to_visit_again")}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        status === "want_to_visit_again"
                          ? "border-pink-500 bg-pink-50"
                          : "border-border hover:border-pink-300"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-xl mb-1">❤️</div>
                        <div className="text-xs font-medium">
                          또 가고 싶은 곳
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  {place.status === "want_to_go" && (
                    <>
                      <Calendar className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <span className="font-medium">갈 곳</span>
                    </>
                  )}
                  {place.status === "visited" && (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="font-medium">갔던 곳</span>
                    </>
                  )}
                  {place.status === "want_to_visit_again" && (
                    <>
                      <Heart className="h-5 w-5 text-pink-500 flex-shrink-0" />
                      <span className="font-medium">또 가고 싶은 곳</span>
                    </>
                  )}
                </div>
              )}
              <div>
                <Label className="text-base font-semibold">코멘트</Label>
                {isEditing ? (
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="이 장소에 대한 코멘트를 입력하세요..."
                    className="mt-2 resize-none"
                    rows={6}
                  />
                ) : (
                  <div className="mt-2 p-4 bg-muted/30 rounded-lg min-h-[120px]">
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {place.comment || (
                        <span className="text-muted-foreground italic">
                          코멘트가 없습니다.
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                장소 공유
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showShareForm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowShareForm(true)}
                  className="w-full"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  연인/친구와 공유하기
                </Button>
              ) : (
                <form onSubmit={handleShare} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="공유할 이메일 주소"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    required
                    className="h-10"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowShareForm(false);
                        setShareEmail("");
                      }}
                      className="flex-1"
                      disabled={sharePlaceMutation.isPending}
                    >
                      취소
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={sharePlaceMutation.isPending}
                    >
                      {sharePlaceMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        "공유"
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    공유된 장소는 상대방도 확인하고 포스팅을 작성할 수 있습니다.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">위험한 작업</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="w-full"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                장소 삭제
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                삭제된 장소는 복구할 수 없습니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 포스팅 섹션 */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">방문 기록</h2>
            <p className="text-muted-foreground text-sm mt-1">
              함께 갔던 순간들을 기록해보세요
            </p>
          </div>
          {!showPostForm && (
            <Button onClick={() => setShowPostForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              포스팅 작성
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
              <PlacePostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">
              아직 작성된 방문 기록이 없습니다.
            </p>
            {!showPostForm && (
              <Button
                variant="outline"
                onClick={() => setShowPostForm(true)}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />첫 포스팅 작성하기
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 코멘트 섹션 */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">코멘트</h2>
            <p className="text-muted-foreground text-sm mt-1">
              구성원들과 자유롭게 소통해보세요
            </p>
          </div>
          {!showCommentForm && (
            <Button onClick={() => setShowCommentForm(true)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              코멘트 작성
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
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">
              아직 작성된 코멘트가 없습니다.
            </p>
            {!showCommentForm && (
              <Button
                variant="outline"
                onClick={() => setShowCommentForm(true)}
                className="mt-4"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                첫 코멘트 작성하기
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
