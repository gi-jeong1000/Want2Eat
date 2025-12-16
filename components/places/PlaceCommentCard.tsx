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
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-sm">
                {getUserNameBySupabaseId(comment.user_id) || "알 수 없음"}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(comment.created_at), "yyyy년 M월 d일 HH:mm", {
                  locale: ko,
                })}
              </span>
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[80px] resize-none"
                  disabled={updateMutation.isPending}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleUpdate}
                    disabled={updateMutation.isPending}
                  >
                    <Check className="h-3 w-3 mr-1" />
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
                  >
                    <X className="h-3 w-3 mr-1" />
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {comment.content}
              </p>
            )}
          </div>
          {isOwner && !isEditing && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

