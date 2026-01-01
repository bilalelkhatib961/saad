"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  const rightsText = t("footer.rights").replace("{year}", year.toString());

  return (
    <footer className="bg-transparent">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <Link href="/" className="text-lg font-semibold text-white">
              {t("footer.brand")}
            </Link>
            <p className="mt-2 text-sm text-gray-500">{t("footer.tagline")}</p>
          </div>
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-sm text-gray-500 transition-colors hover:text-white"
            >
              {t("footer.home")}
            </Link>
            <Link
              href="/about"
              className="text-sm text-gray-500 transition-colors hover:text-white"
            >
              {t("footer.about")}
            </Link>
            <Link
              href="/contact"
              className="text-sm text-gray-500 transition-colors hover:text-white"
            >
              {t("footer.contact")}
            </Link>
            <Link
              href="/admin/signin"
              className="text-sm text-gray-500 transition-colors hover:text-white"
            >
              {t("footer.admin")}
            </Link>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 text-center">
          <p className="text-sm text-gray-400">{rightsText}</p>
        </div>
      </div>
    </footer>
  );
}
