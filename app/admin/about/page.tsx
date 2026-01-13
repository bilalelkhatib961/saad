"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { LocalizedText } from "@/types/localized";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { Spinner } from "@/components/ui/spinner";
import { put } from "@vercel/blob/client";

const emptyLocalized = { en: "", fr: "" };
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const SMALL_FILE_THRESHOLD = 3.5 * 1024 * 1024; // 3.5MB

type AboutContent = {
  title: LocalizedText;
  subtitle: LocalizedText;
  description: LocalizedText;
  image: string;
  pdfLink: string;
};

const defaultContent: AboutContent = {
  title: { ...emptyLocalized },
  subtitle: { ...emptyLocalized },
  description: { ...emptyLocalized },
  image: "",
  pdfLink: "",
};

export default function AdminAboutPage() {
  const [content, setContent] = useState<AboutContent>(defaultContent);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const router = useRouter();

  const imagePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile]
  );
  const pdfName = pdfFile?.name || null;

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch("/api/about");
        if (!response.ok) {
          throw new Error("Failed to fetch about content");
        }
        const data = (await response.json()) as AboutContent | null;
        if (data) {
          setContent({
            ...data,
            subtitle: data.subtitle ?? { ...emptyLocalized },
            image: data.image ?? "",
            pdfLink: data.pdfLink ?? "",
          });
        }
      } catch (error) {
        console.error(error);
        setStatusMessage("Failed to load about content.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  const updateField = (
    field: keyof AboutContent,
    locale: "en" | "fr",
    value: string
  ) => {
    setContent((prev) => ({
      ...prev,
      [field]: {
        ...(prev[field] as LocalizedText),
        [locale]: value,
      },
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessage(null);
    setIsSubmitting(true);

    if (!content.image && !imageFile) {
      setStatusMessage("Please upload an image for the About page.");
      setIsSubmitting(false);
      return;
    }

    try {
      let imageUrl = content.image;
      let pdfUrl = content.pdfLink;
      const uploadFile = async (file: File) => {
        const requestId = `about-${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}`;

        if (file.size > MAX_FILE_SIZE) {
          throw new Error(
            `File "${file.name}" is too large (${(
              file.size /
              1024 /
              1024
            ).toFixed(2)}MB). Maximum size is 5MB.`
          );
        }

        console.log("[ABOUT_UPLOAD] Starting upload", {
          requestId,
          fileName: file.name,
          fileSize: file.size,
          useDirectUpload: file.size > SMALL_FILE_THRESHOLD,
        });

        // For small files, use the old endpoint
        if (file.size <= SMALL_FILE_THRESHOLD) {
          const formData = new FormData();
          formData.append("file", file);
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.details || errorData.error || "Upload failed"
            );
          }

          const data = await response.json();
          return data.url;
        }

        // For large files, use direct-to-Blob upload
        const tokenResponse = await fetch("/api/upload/token", {
          method: "POST",
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json().catch(() => ({}));
          throw new Error(
            errorData.details || errorData.error || "Failed to get upload token"
          );
        }

        const tokenData = await tokenResponse.json();
        const sanitizeFilename = (filename: string) => {
          return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
        };
        const safeName = sanitizeFilename(file.name || "upload");
        const filename = `${Date.now()}-${safeName}`;

        const blob = await put(filename, file, {
          access: "public",
          token: tokenData.token,
        });

        // Notify completion (non-blocking)
        fetch("/api/upload/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: blob.url,
            pathname: blob.pathname,
            size: file.size,
            contentType: file.type,
            originalName: file.name,
            requestId: tokenData.requestId || requestId,
          }),
        }).catch(() => {});

        return blob.url;
      };

      if (imageFile) {
        imageUrl = await uploadFile(imageFile);
      }

      if (pdfFile) {
        pdfUrl = await uploadFile(pdfFile);
      }

      const response = await fetch("/api/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...content, image: imageUrl, pdfLink: pdfUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to update content");
      }

      setStatusMessage("About content updated.");
      setImageFile(null);
      setPdfFile(null);
      setContent((prev) => ({ ...prev, image: imageUrl, pdfLink: pdfUrl }));
    } catch (error) {
      console.error(error);
      setStatusMessage("Failed to update about content.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 text-white">
      <h1 className="text-3xl font-semibold">Edit About Us</h1>
      <p className="mt-2 text-sm text-gray-400">
        Update the About page content in English and French.
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
          onClick={() => router.push("/admin/messages")}
          className="rounded-lg border border-gray-500 px-4 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-gray-300 hover:text-white"
        >
          View Messages
        </button>
        <AdminLogoutButton />
      </div>

      {isLoading ? (
        <p className="mt-6 text-gray-400">Loading...</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title (EN)</label>
              <input
                value={content.title.en}
                onChange={(event) =>
                  updateField("title", "en", event.target.value)
                }
                className="w-full rounded-lg border border-gray-600 bg-[#1f1f1f] px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Title (FR)</label>
              <input
                value={content.title.fr}
                onChange={(event) =>
                  updateField("title", "fr", event.target.value)
                }
                className="w-full rounded-lg border border-gray-600 bg-[#1f1f1f] px-3 py-2 text-sm text-white"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subtitle (EN)</label>
              <input
                value={content.subtitle.en}
                onChange={(event) =>
                  updateField("subtitle", "en", event.target.value)
                }
                className="w-full rounded-lg border border-gray-600 bg-[#1f1f1f] px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subtitle (FR)</label>
              <input
                value={content.subtitle.fr}
                onChange={(event) =>
                  updateField("subtitle", "fr", event.target.value)
                }
                className="w-full rounded-lg border border-gray-600 bg-[#1f1f1f] px-3 py-2 text-sm text-white"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (EN)</label>
              <textarea
                value={content.description.en}
                onChange={(event) =>
                  updateField("description", "en", event.target.value)
                }
                rows={6}
                className="w-full rounded-lg border border-gray-600 bg-[#1f1f1f] px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (FR)</label>
              <textarea
                value={content.description.fr}
                onChange={(event) =>
                  updateField("description", "fr", event.target.value)
                }
                rows={6}
                className="w-full rounded-lg border border-gray-600 bg-[#1f1f1f] px-3 py-2 text-sm text-white"
                required
              />
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-gray-600 bg-[#1c1c1c]/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">About Image</p>
                <p className="text-xs text-gray-400">
                  Main image shown on the About page.
                </p>
              </div>
              <label className="cursor-pointer rounded-md bg-white px-3 py-2 text-xs font-semibold text-[#1f1f1f] transition-opacity hover:opacity-90">
                Choose file
                <input
                  type="file"
                  accept="image/*"
                  required={!content.image}
                  className="sr-only"
                  onChange={(event) =>
                    setImageFile(event.target.files?.[0] ?? null)
                  }
                />
              </label>
            </div>
            <div className="mt-3">
              {imagePreview ? (
                <div className="relative w-40 overflow-hidden rounded-lg border border-gray-700 bg-[#141414]">
                  <img
                    src={imagePreview}
                    alt="New upload"
                    className="h-28 w-full object-cover"
                  />
                  <div className="flex items-center justify-between px-2 py-1 text-[11px] text-gray-300">
                    <span className="truncate">{imageFile?.name ?? "New"}</span>
                    <button
                      type="button"
                      onClick={() => setImageFile(null)}
                      className="rounded-full bg-white/10 p-1 text-gray-200 transition-colors hover:bg-white/20"
                      aria-label="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : content.image ? (
                <div className="relative w-40 overflow-hidden rounded-lg border border-gray-700 bg-[#141414]">
                  <img
                    src={content.image}
                    alt="Current about"
                    className="h-28 w-full object-cover"
                  />
                  <div className="flex items-center justify-between px-2 py-1 text-[11px] text-gray-300">
                    <span className="truncate">Current</span>
                    <button
                      type="button"
                      onClick={() =>
                        setContent((prev) => ({ ...prev, image: "" }))
                      }
                      className="rounded-full bg-red-500/20 p-1 text-red-100 transition-colors hover:bg-red-500/30"
                      aria-label="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">No file selected.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-gray-600 bg-[#1c1c1c]/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">PDF Upload</p>
                <p className="text-xs text-gray-400">
                  Upload a CV PDF for the About page button.
                </p>
              </div>
              <label className="cursor-pointer rounded-md bg-white px-3 py-2 text-xs font-semibold text-[#1f1f1f] transition-opacity hover:opacity-90">
                Choose file
                <input
                  type="file"
                  accept="application/pdf"
                  className="sr-only"
                  onChange={(event) =>
                    setPdfFile(event.target.files?.[0] ?? null)
                  }
                />
              </label>
            </div>
            <div className="mt-3">
              {pdfName ? (
                <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-[#141414] px-3 py-2 text-xs text-gray-300">
                  <span className="truncate">{pdfName}</span>
                  <button
                    type="button"
                    onClick={() => setPdfFile(null)}
                    className="rounded-full bg-white/10 p-1 text-gray-200 transition-colors hover:bg-white/20"
                    aria-label="Remove PDF"
                  >
                    ✕
                  </button>
                </div>
              ) : content.pdfLink ? (
                <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-[#141414] px-3 py-2 text-xs text-gray-300">
                  <span className="truncate">Current PDF</span>
                  <button
                    type="button"
                    onClick={() =>
                      setContent((prev) => ({ ...prev, pdfLink: "" }))
                    }
                    className="rounded-full bg-red-500/20 p-1 text-red-100 transition-colors hover:bg-red-500/30"
                    aria-label="Remove PDF"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-400">No file selected.</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-[#1f1f1f] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <Spinner className="size-4" />}
            Save About Content
          </button>
          {statusMessage && (
            <p className="text-sm text-gray-300">{statusMessage}</p>
          )}
        </form>
      )}
    </main>
  );
}
