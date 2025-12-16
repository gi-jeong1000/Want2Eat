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
    <Card className="shadow-soft-lg border-sky-100/50 bg-gradient-to-br from-sky-50/50 to-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-sky-400 to-blue-400 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          코멘트 작성
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="이 장소에 대한 코멘트를 남겨보세요..."
            className="min-h-[120px]"
            disabled={isLoading}
          />
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isLoading || !content.trim()}
              className="rounded-xl"
            >
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? "작성 중..." : "작성하기"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

