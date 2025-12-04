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
} from "lucide-react";
import Image from "next/image";
import { PlaceStatus } from "@/types";

interface PlaceCardProps {
  place: PlaceWithImages;
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

export function PlaceCard({ place }: PlaceCardProps) {
  const statusInfo = statusConfig[place.status];
  const StatusIcon = statusInfo.icon;

  return (
    <Link href={`/places/${place.id}`}>
      <Card className="h-full hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer overflow-hidden group">
        {place.images && place.images.length > 0 ? (
          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
            <Image
              src={place.images[0].image_url}
              alt={place.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-2 right-2">
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color} flex items-center gap-1`}
              >
                <StatusIcon className="h-3 w-3" />
                {statusInfo.label}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-48 w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center rounded-t-lg group-hover:from-blue-100 group-hover:via-indigo-100 group-hover:to-purple-100 transition-colors relative">
            <MapPin className="h-12 w-12 text-muted-foreground opacity-50" />
            <div className="absolute top-2 right-2">
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color} flex items-center gap-1`}
              >
                <StatusIcon className="h-3 w-3" />
                {statusInfo.label}
              </div>
            </div>
          </div>
        )}
        <CardHeader className="pb-3">
          <CardTitle className="flex items-start justify-between gap-2">
            <span className="flex-1 line-clamp-2">{place.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="flex items-start text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-1">{place.address}</span>
          </div>
          {place.rating && (
            <div className="flex items-center text-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1.5" />
              <span className="font-medium">{place.rating.toFixed(1)}</span>
            </div>
          )}
          {place.comment && (
            <p className="text-sm text-muted-foreground line-clamp-2 pt-1">
              {place.comment}
            </p>
          )}
          {place.posts && place.posts.length > 0 && (
            <div className="flex items-center text-xs text-muted-foreground pt-1">
              <span>📝 포스팅 {place.posts.length}개</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
