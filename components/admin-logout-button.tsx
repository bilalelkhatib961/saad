"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/admin/signin");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="rounded-lg border border-gray-500 px-4 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-gray-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? "Signing out..." : "Logout"}
    </button>
  );
}
