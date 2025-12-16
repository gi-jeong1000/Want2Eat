"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send } from "lucide-react";
import { useState } from "react";

interface PlaceCommentFormProps {
  placeId: string;
  onSubmit: (content: string) => void;
  isLoading?: boolean;
}

export function PlaceCommentForm({
  placeId,
  onSubmit,
  isLoading = false,
}: PlaceCommentFormProps) {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert("코멘트 내용을 입력해주세요.");
      return;
    }
    onSubmit(content.trim());
    setContent("");
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          코멘트 작성
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="이 장소에 대한 코멘트를 남겨보세요..."
            className="min-h-[100px] resize-none"
            disabled={isLoading}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || !content.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? "작성 중..." : "작성하기"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

