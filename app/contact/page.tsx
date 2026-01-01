"use client";

import type React from "react";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";

export default function ContactPage() {
  const { t } = useLanguage();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitMessage = async () => {
      try {
        setIsSubmitting(true);
        setStatusMessage(null);
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error("Failed to submit message");
        }

        setFormData({ name: "", email: "", message: "" });
        setStatusMessage(t("contact.success"));
      } catch (error) {
        console.error(error);
        setStatusMessage(t("contact.error"));
      } finally {
        setIsSubmitting(false);
      }
    };

    submitMessage();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <main className="relative isolate overflow-hidden px-6 py-16 text-white">
      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-8">
          <div className="animate-fade-in">
            <p className="text-xs uppercase tracking-[0.3em] text-[#f2c9a0]">
              Atelier Contact
            </p>
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-white md:text-5xl">
              {t("contact.title")}
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/70 md:text-lg">
              {t("contact.subtitle")}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="text-xs uppercase tracking-[0.2em] text-white/60"
                  >
                    {t("contact.name")}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-2 block w-full rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-sm text-white placeholder-white/40 transition focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-[#f2c9a0]/40"
                    placeholder={t("contact.namePlaceholder")}
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="text-xs uppercase tracking-[0.2em] text-white/60"
                  >
                    {t("contact.email")}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="mt-2 block w-full rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-sm text-white placeholder-white/40 transition focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-[#f2c9a0]/40"
                    placeholder={t("contact.emailPlaceholder")}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="text-xs uppercase tracking-[0.2em] text-white/60"
                >
                  {t("contact.message")}
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="mt-2 block w-full resize-none rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-sm text-white placeholder-white/40 transition focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-[#f2c9a0]/40"
                  placeholder={t("contact.messagePlaceholder")}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#f2c9a0] px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#1a1a1a] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(242,201,160,0.35)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? t("contact.sending") : t("contact.send")}
                <span className="text-lg transition group-hover:translate-x-1">
                  ↗
                </span>
              </button>
            </form>

            {statusMessage && (
              <p className="mt-4 text-sm text-white/70">{statusMessage}</p>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="animate-fade-in-slow rounded-2xl border border-white/10 bg-[#121212] p-6">
            <h2 className="text-sm uppercase tracking-[0.3em] text-white/70">
              {t("contact.otherWays")}
            </h2>
            <div className="mt-6 space-y-4 text-sm text-white/70">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                  {t("contact.emailLabel")}
                </p>
                <p className="mt-2 text-base text-white">hello@gallery.com</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                  {t("contact.phoneLabel")}
                </p>
                <p className="mt-2 text-base text-white">+1 (555) 123-4567</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Studio Hours
            </p>
            <p className="mt-3 text-base text-white">Mon — Fri · 9am — 6pm</p>
            <p className="mt-1 text-white/60">
              Visits by appointment. Drop a note and we will confirm a slot.
            </p>
          </div>
        </aside>
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeInUp 700ms ease both;
        }
        .animate-fade-in-slow {
          animation: fadeInUp 900ms ease both 150ms;
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
