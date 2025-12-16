"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceWithImages } from "@/types";
import {
  MapPin,
  Star,
  CheckCircle2,
  Circle,
  Heart,
  Calendar,
  User,
} from "lucide-react";
import { PlaceStatus } from "@/types";

interface PlaceCardProps {
  place: PlaceWithImages;
  userName?: string;
}

const statusConfig: Record<
  PlaceStatus,
  { label: string; icon: any; color: string; bgColor: string }
> = {
  want_to_go: {
    label: "갈 곳",
    icon: Calendar,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  visited: {
    label: "갔던 곳",
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  want_to_visit_again: {
    label: "또 가고 싶은 곳",
    icon: Heart,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
  },
};

export function PlaceCard({ place, userName }: PlaceCardProps) {
  const statusInfo = statusConfig[place.status];
  const StatusIcon = statusInfo.icon;

  return (
    <Link href={`/places/${place.id}`}>
      <Card className="h-full hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 mb-2">
            <CardTitle className="flex-1 line-clamp-2 text-lg font-bold group-hover:text-blue-600 transition-colors">
              {place.name}
            </CardTitle>
            <div
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color} flex items-center gap-1.5 flex-shrink-0`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {statusInfo.label}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
            <span className="line-clamp-2 leading-relaxed">{place.address}</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {place.rating && (
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-gray-900">{place.rating.toFixed(1)}</span>
                <span className="text-gray-400">/ 5.0</span>
              </div>
            )}
            {place.posts && place.posts.length > 0 && (
              <div className="flex items-center gap-1.5 text-gray-500">
                <span className="text-xs">📝</span>
                <span className="text-xs">포스팅 {place.posts.length}개</span>
              </div>
            )}
          </div>

          {place.comment && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {place.comment}
              </p>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-2 border-t border-gray-100">
            <User className="h-3.5 w-3.5" />
            <span>{userName || "로딩 중..."}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
