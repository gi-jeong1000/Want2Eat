"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Upload, Loader2, Calendar } from "lucide-react";
import Image from "next/image";

interface PlacePostFormProps {
  placeName: string;
  onSubmit: (data: {
    title: string;
    content: string;
    visited_at: string;
    images: File[];
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PlacePostForm({
  placeName,
  onSubmit,
  onCancel,
  isLoading,
}: PlacePostFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visitedAt, setVisitedAt] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = [...images, ...files];
    setImages(newImages);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);

    URL.revokeObjectURL(previews[index]);

    setImages(newImages);
    setPreviews(newPreviews);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }
    onSubmit({
      title,
      content,
      visited_at: new Date(visitedAt).toISOString(),
      images,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {placeName} 방문 기록
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="방문 기록 제목을 입력하세요"
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="visited_at">방문 날짜</Label>
            <Input
              id="visited_at"
              type="date"
              value={visitedAt}
              onChange={(e) => setVisitedAt(e.target.value)}
              required
              className="h-11"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>내용</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="이번 방문에 대한 이야기를 남겨보세요..."
            rows={8}
            className="resize-none"
            required
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            사진 ({previews.length}장)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-11"
          >
            <Upload className="h-4 w-4 mr-2" />
            사진 추가
          </Button>

          {previews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {previews.map((preview, index) => (
                <div
                  key={index}
                  className="relative aspect-square group rounded-lg overflow-hidden border border-border"
                >
                  <Image
                    src={preview}
                    alt={`미리보기 ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90 shadow-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-11"
          disabled={isLoading}
        >
          취소
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1 h-11">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : (
            "포스팅 작성"
          )}
        </Button>
      </div>
    </form>
  );
}
