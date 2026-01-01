"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/components/language-provider";

export function Navbar() {
  const pathname = usePathname();
  const { language, toggleLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/", label: t("nav.gallery") },
    { href: "/about", label: t("nav.about") },
    { href: "/contact", label: t("nav.contact") },
  ];

  return (
    <nav className="fixed w-full top-0 z-50 border-b border-white/10 bg-[#0f0f0f]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between py-5">
        <Link href="/" className="group flex items-baseline gap-3">
          <span className="text-xs uppercase tracking-[0.4em] text-[#f2c9a0]">
            Atelier
          </span>
          <span className="font-serif text-xl font-semibold text-white transition group-hover:text-white/80">
            Saad Hwalla
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition ${
                pathname === link.href ? "text-white" : "hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={toggleLanguage}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:text-white"
          >
            <span className="flex items-center gap-2">
              {language === "en"
                ? t("nav.language.english")
                : t("nav.language.french")}
              <Image
                src={
                  language === "en"
                    ? "https://flagcdn.com/16x12/gb.png"
                    : "https://flagcdn.com/16x12/fr.png"
                }
                alt={language === "en" ? "English" : "Francais"}
                width={16}
                height={16}
                className="rounded-full"
              />
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-2 text-white/80 transition hover:text-white md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
        >
          <span className="text-lg">{isOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      <div
        className={`md:hidden ${
          isOpen ? "block" : "hidden"
        } border-t border-white/10 bg-[#0f0f0f]/95`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`transition ${
                pathname === link.href ? "text-white" : "hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => {
              toggleLanguage();
              setIsOpen(false);
            }}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:text-white"
          >
            {language === "en"
              ? t("nav.language.english")
              : t("nav.language.french")}
            <Image
              src={
                language === "en"
                  ? "https://flagcdn.com/16x12/gb.png"
                  : "https://flagcdn.com/16x12/fr.png"
              }
              alt={language === "en" ? "English" : "Francais"}
              width={16}
              height={16}
              className="rounded-full"
            />
          </button>
        </div>
      </div>
    </nav>
  );
}
