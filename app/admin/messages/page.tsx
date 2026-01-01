"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin-logout-button";

type ContactMessage = {
  _id?: string;
  name: string;
  email: string;
  message: string;
  createdAt?: string;
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch("/api/messages");
        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }
        const data: ContactMessage[] = await response.json();
        setMessages(data);
      } catch (error) {
        console.error(error);
        setStatusMessage("Failed to load messages.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 text-white min-h-[calc(100vh-320px)]">
      <h1 className="text-3xl font-semibold">Contact Messages</h1>
      <p className="mt-2 text-sm text-gray-400">
        Messages submitted from the contact form.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="rounded-lg border border-gray-500 px-4 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-gray-300 hover:text-white"
        >
          Edit Gallery
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/items")}
          className="rounded-lg border border-gray-500 px-4 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-gray-300 hover:text-white"
        >
          View Items
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/about")}
          className="rounded-lg border border-gray-500 px-4 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-gray-300 hover:text-white"
        >
          Edit About
        </button>
        <AdminLogoutButton />
      </div>

      {statusMessage && (
        <p className="mt-4 text-sm text-gray-300">{statusMessage}</p>
      )}

      {isLoading ? (
        <p className="mt-6 text-gray-400">Loading...</p>
      ) : messages.length === 0 ? (
        <p className="mt-6 text-gray-400">No messages yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message._id ?? `${message.email}-${message.createdAt}`}
              className="rounded-xl border border-gray-700 bg-[#1c1c1c]/60 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {message.name}
                  </p>
                  <p className="text-xs text-gray-400">{message.email}</p>
                </div>
                {message.createdAt && (
                  <p className="text-xs text-gray-500">
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
              <p className="mt-3 text-sm text-gray-200 whitespace-pre-line">
                {message.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
