"use client";

import Link from "next/link";
import type { GalleryItem } from "@/types/gallery-item";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { useLanguage } from "@/components/language-provider";
import "swiper/css";
import "swiper/css/navigation";
import { useParams } from "next/navigation";
import { ImageWithSpinner } from "@/components/image-with-spinner";

export default function GalleryDetailPage() {
  const { id } = useParams();

  const [item, setItem] = useState<GalleryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { t, getLocalizedText } = useLanguage();
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(`/api/gallery/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch item");
        }
        const data: GalleryItem = await response.json();
        setItem(data);
        setErrorMessage(null);
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load gallery item.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  useEffect(() => {
    if (swiperRef.current && item) {
      swiperRef.current.slideTo(activeIndex);
    }
  }, [activeIndex, item]);

  if (isLoading) {
    return (
      <main className="relative isolate overflow-hidden min-h-[calc(100vh-320px)] px-6 py-16 text-white flex items-center justify-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,214,170,0.25),_transparent_55%),radial-gradient(circle_at_20%_80%,_rgba(159,196,255,0.2),_transparent_50%)]"
        />
        <div className="pointer-events-none absolute -top-24 right-10 h-56 w-56 rounded-full bg-[#2b2b2b]/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-6 h-64 w-64 rounded-full bg-[#3b2d20]/70 blur-3xl" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="h-16 w-16 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
        </div>
      </main>
    );
  }

  if (errorMessage || !item) {
    return (
      <main className="relative isolate overflow-hidden px-6 py-16 text-white">
        <div className="relative mx-auto max-w-7xl text-center">
          <p className="text-red-300">{t("home.error")}</p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:text-white"
            >
              {t("gallery.back")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const title = getLocalizedText(item.title);
  const fullDescription = getLocalizedText(item.fullDescription);
  const images =
    item.additionalImages.length > 0
      ? [item.mainImage, ...item.additionalImages]
      : [item.mainImage];
  const videos = item.videos ?? [];

  const getYouTubeId = (url: string) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes("youtu.be")) {
        return parsed.pathname.replace("/", "");
      }
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/embed/")[1] || null;
      }
      return parsed.searchParams.get("v");
    } catch {
      return null;
    }
  };

  const media = [
    ...images.map((src) => ({ type: "image" as const, src })),
    ...videos.map((src) => {
      const youtubeId = getYouTubeId(src);
      const embedUrl = youtubeId
        ? `https://www.youtube.com/embed/${youtubeId}`
        : src;
      return { type: "video" as const, src: embedUrl, youtubeId };
    }),
  ];

  return (
    <main className="relative isolate overflow-hidden px-6 py-16 text-white">
      <div className="relative mx-auto max-w-7xl space-y-10">
        <div className="animate-fade-in flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#f2c9a0]">
              Gallery Detail
            </p>
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-white md:text-5xl">
              {title}
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:-translate-y-0.5 hover:bg-white/10"
          >
            {t("gallery.back")}
          </Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-black/40">
            {media[activeIndex]?.type === "video" ? (
              <iframe
                src={media[activeIndex].src}
                title={`${title} video`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <ImageWithSpinner
                src={media[activeIndex]?.src || "/placeholder.svg"}
                alt={t("gallery.imageAlt")
                  .replace("{title}", title)
                  .replace("{index}", (activeIndex + 1).toString())}
                fill
                className="object-contain"
                priority
                wrapperClassName="h-full w-full"
              />
            )}
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 overflow-hidden">
            <button
              onClick={() => swiperRef.current?.slidePrev()}
              className="swiper-button-prev-custom shrink-0 rounded-full border border-white/10 bg-white/5 p-3 text-white/70 transition hover:text-white"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="flex-1 min-w-0 overflow-hidden">
              <Swiper
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                }}
                modules={[Navigation]}
                spaceBetween={4}
                slidesPerView={5}
                navigation={{
                  prevEl: ".swiper-button-prev-custom",
                  nextEl: ".swiper-button-next-custom",
                }}
                breakpoints={{
                  320: {
                    slidesPerView: 1,
                    spaceBetween: 8,
                  },
                  640: {
                    slidesPerView: 3,
                    spaceBetween: 12,
                  },
                  1024: {
                    slidesPerView: 6,
                    spaceBetween: 8,
                  },
                }}
                className="thumbnail-swiper"
              >
                {media.map((item, index) => (
                  <SwiperSlide key={index}>
                    <div
                      className={`rounded-2xl border border-white/10 bg-white/5 p-2 transition-all duration-300 hover:shadow-xl cursor-pointer ${
                        activeIndex === index
                          ? "border-[#f2c9a0]/60 bg-white/10"
                          : "opacity-70 hover:opacity-100"
                      }`}
                      onClick={() => {
                        setActiveIndex(index);
                      }}
                    >
                      {item.type === "video" ? (
                        <ImageWithSpinner
                          src={
                            item.youtubeId
                              ? `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`
                              : "/placeholder.svg"
                          }
                          alt={`${title} video ${index + 1}`}
                          fill
                          className="object-cover transition-transform duration-300 hover:scale-105"
                          wrapperClassName="h-28 w-full overflow-hidden rounded-xl"
                        />
                      ) : (
                        <ImageWithSpinner
                          src={item.src || "/placeholder.svg"}
                          alt={t("gallery.imageAlt")
                            .replace("{title}", title)
                            .replace("{index}", (index + 1).toString())}
                          fill
                          className="object-cover transition-transform duration-300 hover:scale-105"
                          wrapperClassName="h-28 w-full overflow-hidden rounded-xl"
                        />
                      )}
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            <button
              onClick={() => swiperRef.current?.slideNext()}
              className="swiper-button-next-custom shrink-0 rounded-full border border-white/10 bg-white/5 p-3 text-white/70 transition hover:text-white"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">
            About This Piece
          </p>
          <div
            className="mt-4 text-base leading-relaxed text-white/75 rich-text-content"
            dangerouslySetInnerHTML={{ __html: fullDescription }}
          />
        </div>
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeInUp 700ms ease both;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
