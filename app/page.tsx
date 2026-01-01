"use client";

import { GalleryCard } from "@/components/gallery-card";
import type { GalleryItem } from "@/types/gallery-item";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

const ITEMS_PER_PAGE = 6;

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { t } = useLanguage();
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = items.slice(startIndex, endIndex);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("/api/gallery");
        if (!response.ok) {
          throw new Error("Failed to fetch items");
        }
        const data: GalleryItem[] = await response.json();
        setItems(data);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage("Failed to load gallery items.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

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

  return (
    <main className="relative isolate overflow-hidden px-6 py-16 text-white">
      <div className="relative mx-auto max-w-7xl">
        <div className="animate-fade-in mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#f2c9a0]">
            Curated Works
          </p>
          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-white md:text-5xl">
            {t("home.title")}
          </h1>
          <p className="mt-4 text-base text-white/70 md:text-lg">
            {t("home.subtitle")}
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="h-16 w-16 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
            </div>
          )}
          {!isLoading && errorMessage && (
            <p className="col-span-full text-center text-red-300">
              {t("home.error")}
            </p>
          )}
          {!isLoading && !errorMessage && items.length === 0 && (
            <p className="col-span-full text-center text-white/60">
              {t("home.empty")}
            </p>
          )}
          {!isLoading &&
            !errorMessage &&
            currentItems.map((item) => (
              <GalleryCard key={`${item._id ?? item.id}`} item={item} />
            ))}
        </div>

        {items?.length > 5 && (
          <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("home.previous")}
            </button>

            <div className="flex flex-wrap items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                      currentPage === page
                        ? "bg-[#f2c9a0] text-[#1a1a1a]"
                        : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("home.next")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
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
