"use client";

import { PlacePostWithImages } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ko } from "date-fns/locale/ko";
import Image from "next/image";
import { Calendar } from "lucide-react";

interface PlacePostCardProps {
  post: PlacePostWithImages;
}

export function PlacePostCard({ post }: PlacePostCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{post.title}</CardTitle>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {format(new Date(post.visited_at), "yyyy년 M월 d일", {
              locale: ko,
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {post.images && post.images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {post.images.map((image) => (
              <div
                key={image.id}
                className="relative aspect-square rounded-lg overflow-hidden border border-border"
              >
                <Image
                  src={image.image_url}
                  alt={post.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {post.content}
          </p>
        </div>
        <div className="text-xs text-muted-foreground pt-2 border-t">
          작성일:{" "}
          {format(new Date(post.created_at), "yyyy년 M월 d일 HH:mm", {
            locale: ko,
          })}
        </div>
      </CardContent>
    </Card>
  );
}
