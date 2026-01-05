"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import type { LocalizedText } from "@/types/localized";
import { ImageWithSpinner } from "@/components/image-with-spinner";

export default function AboutPage() {
  const { t, getLocalizedText } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState<{
    title: LocalizedText;
    subtitle: LocalizedText;
    description: LocalizedText;
    image?: string;
    pdfLink?: string;
  } | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/about");
        if (!response.ok) {
          throw new Error("Failed to fetch about content");
        }
        const data = await response.json();
        setContent(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  const title = content ? getLocalizedText(content.title) : t("about.title");
  const subtitle = content?.subtitle
    ? getLocalizedText(content.subtitle)
    : t("about.subtitle");
  const description = content
    ? getLocalizedText(content.description)
    : t("about.story.p1");

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
      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-8">
          <div className="animate-fade-in">
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-white md:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/70 md:text-lg">
              {subtitle}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-base text-white/80 backdrop-blur-md md:p-8">
            <p className="leading-relaxed">{description}</p>
          </div>

          {content?.pdfLink ? (
            <a
              href={content.pdfLink}
              className="group inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#f2c9a0] px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#1a1a1a] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(242,201,160,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Download CV
              <span className="text-lg">↗</span>
            </a>
          ) : null}
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl ">
            <ImageWithSpinner
              src={content?.image || "/placeholder.svg?height=500&width=500"}
              alt={t("about.imageAlt")}
              fill
              className="object-cover"
              wrapperClassName="aspect-square overflow-hidden rounded-2xl"
            />
          </div>
        </aside>
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
