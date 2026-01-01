"use client";

import Link from "next/link";
import { useState } from "react";
import type { GalleryItem } from "@/types/gallery-item";
import { useLanguage } from "@/components/language-provider";
import { ImageWithSpinner } from "@/components/image-with-spinner";

interface GalleryCardProps {
  item: GalleryItem;
}

export function GalleryCard({ item }: GalleryCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { getLocalizedText } = useLanguage();
  const title = getLocalizedText(item.title);
  return (
    <Link href={`/gallery/${item._id}`}>
      <article
        className="group cursor-pointer overflow-hidden rounded-lg shadow-sm transition-all duration-300 hover:shadow-md h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-video overflow-hidden">
          <ImageWithSpinner
            src={item.mainImage}
            alt={title}
            fill
            className="object-cover transition-all duration-500 group-hover:scale-120"
            wrapperClassName="h-full w-full"
          />
        </div>
        <div className="p-5 border border-white/10 bg-white/5 text-base text-white/80 backdrop-blur-md h-full">
          <h3 className="text-lg font-semibold transition-colors">{title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed">
            {getLocalizedText(item.description)}
          </p>
        </div>
      </article>
    </Link>
  );
}
