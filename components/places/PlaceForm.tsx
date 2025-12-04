"use client";

import { useState, useRef } from "react";
import { NaverPlace } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Upload, Loader2, MapPin } from "lucide-react";
import Image from "next/image";
import { PlaceStatus } from "@/types";

interface PlaceFormProps {
  place: NaverPlace;
  onSubmit: (data: {
    comment: string;
    images: File[];
    status: PlaceStatus;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PlaceForm({
  place,
  onSubmit,
  onCancel,
  isLoading,
}: PlaceFormProps) {
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<PlaceStatus>("want_to_go");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = [...images, ...files];
    setImages(newImages);

    // 미리보기 생성
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);

    // URL 해제
    URL.revokeObjectURL(previews[index]);

    setImages(newImages);
    setPreviews(newPreviews);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ comment, images, status });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            선택한 장소
          </CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold text-lg mb-2">
            {place.title.replace(/<[^>]*>/g, "")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {place.roadAddress || place.address}
          </p>
          {place.category && (
            <p className="text-xs text-muted-foreground mt-2 px-2 py-1 bg-muted rounded-md inline-block">
              {place.category.split(">").pop()?.trim()}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>상태 선택</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setStatus("want_to_go")}
              className={`p-4 rounded-lg border-2 transition-all ${
                status === "want_to_go"
                  ? "border-blue-500 bg-blue-50"
                  : "border-border hover:border-blue-300"
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">📅</div>
                <div className="text-sm font-medium">갈 곳</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setStatus("visited")}
              className={`p-4 rounded-lg border-2 transition-all ${
                status === "visited"
                  ? "border-green-500 bg-green-50"
                  : "border-border hover:border-green-300"
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">✅</div>
                <div className="text-sm font-medium">갔던 곳</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setStatus("want_to_visit_again")}
              className={`p-4 rounded-lg border-2 transition-all ${
                status === "want_to_visit_again"
                  ? "border-pink-500 bg-pink-50"
                  : "border-border hover:border-pink-300"
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">❤️</div>
                <div className="text-sm font-medium">또 가고 싶은 곳</div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>코멘트</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="이 장소에 대한 코멘트를 입력하세요..."
            rows={5}
            className="resize-none"
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
            "저장"
          )}
        </Button>
      </div>
    </form>
  );
}
