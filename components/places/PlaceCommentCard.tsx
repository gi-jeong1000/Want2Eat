"use client";

import { PlaceComment } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUserNameBySupabaseId } from "@/lib/get-user-name";
import { getSupabaseUserId } from "@/lib/get-user-id";
import { format } from "date-fns";
import { ko } from "date-fns/locale/ko";
import { Trash2, Edit2, X, Check } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface PlaceCommentCardProps {
  comment: PlaceComment;
  placeId: string;
}

export function PlaceCommentCard({ comment, placeId }: PlaceCommentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const queryClient = useQueryClient();
  const currentUserId = getSupabaseUserId();
  const isOwner = currentUserId === comment.user_id;

  const updateMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/places/${placeId}/comments/${comment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "코멘트 수정에 실패했습니다.");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["place", placeId] });
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/places/${placeId}/comments/${comment.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "코멘트 삭제에 실패했습니다.");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["place", placeId] });
    },
  });

  const handleUpdate = () => {
    if (!editContent.trim()) {
      alert("코멘트 내용을 입력해주세요.");
      return;
    }
    updateMutation.mutate(editContent.trim());
  };

  const handleDelete = () => {
    if (confirm("정말 이 코멘트를 삭제하시겠습니까?")) {
      deleteMutation.mutate();
    }
  };

  return (
    <Card className="shadow-soft border-sky-100/50 hover-lift">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-sky-400 to-blue-400 flex items-center justify-center text-white font-bold text-sm">
                {getUserNameBySupabaseId(comment.user_id)?.charAt(0) || "?"}
              </div>
              <div>
                <span className="font-bold text-sm text-foreground block">
                  {getUserNameBySupabaseId(comment.user_id) || "알 수 없음"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(comment.created_at), "yyyy년 M월 d일 HH:mm", {
                    locale: ko,
                  })}
                </span>
              </div>
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[100px]"
                  disabled={updateMutation.isPending}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleUpdate}
                    disabled={updateMutation.isPending}
                    className="rounded-xl"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    저장
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                    disabled={updateMutation.isPending}
                    className="rounded-xl"
                  >
                    <X className="h-4 w-4 mr-1" />
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed pl-14">
                {comment.content}
              </p>
            )}
          </div>
          {isOwner && !isEditing && (
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-9 w-9 rounded-xl hover:bg-sky-100/80"
              >
                <Edit2 className="h-4 w-4 text-sky-600" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="h-9 w-9 rounded-xl hover:bg-red-100/80"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

