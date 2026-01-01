"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { GalleryItem } from "@/types/gallery-item";
import { AdminLogoutButton } from "@/components/admin-logout-button";

const emptyLocalized = { en: "", fr: "" };

export default function AdminPageClient() {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [existingMainImage, setExistingMainImage] = useState<string | null>(
    null
  );
  const [existingAdditionalImages, setExistingAdditionalImages] = useState<
    string[]
  >([]);
  const [additionalImagesChanged, setAdditionalImagesChanged] = useState(false);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
  const [videoLinks, setVideoLinks] = useState<string[]>([]);
  const [formState, setFormState] = useState({
    title: { ...emptyLocalized },
    description: { ...emptyLocalized },
    fullDescription: { ...emptyLocalized },
  });
  const [isLoadingItem, setIsLoadingItem] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get("edit");
    if (!id) return;

    const fetchItem = async () => {
      try {
        setIsLoadingItem(true);
        const response = await fetch(`/api/gallery/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch item");
        }
        const data: GalleryItem = await response.json();
        setEditingId(data._id ?? id);
        setFormState({
          title: data.title,
          description: data.description,
          fullDescription: data.fullDescription,
        });
        setExistingMainImage(data.mainImage ?? null);
        setExistingAdditionalImages(data.additionalImages ?? []);
        setVideoLinks(data.videos ?? []);
        setAdditionalImagesChanged(false);
        setStatusMessage(null);
      } catch (error) {
        console.error(error);
        setStatusMessage("Failed to load item for editing.");
      } finally {
        setIsLoadingItem(false);
      }
    };

    fetchItem();
  }, [searchParams]);

  const handleChange = (
    field: keyof typeof formState,
    value: string,
    locale?: "en" | "fr"
  ) => {
    setFormState((prev) => {
      if (locale) {
        return {
          ...prev,
          [field]: {
            ...(prev[field] as typeof emptyLocalized),
            [locale]: value,
          },
        };
      }

      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessage(null);

    if (!editingId && !mainImageFile) {
      setStatusMessage("Please upload the main image.");
      return;
    }

    if (editingId && !existingMainImage && !mainImageFile) {
      setStatusMessage("Please upload a main image.");
      return;
    }

    const uploadFile = async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      const data: { url: string } = await response.json();
      return data.url;
    };

    const payload: Partial<GalleryItem> = {
      title: formState.title,
      description: formState.description,
      fullDescription: formState.fullDescription,
      videos: videoLinks.map((link) => link.trim()).filter(Boolean),
    };

    if (mainImageFile) {
      payload.mainImage = await uploadFile(mainImageFile);
    }

    if (additionalImageFiles.length > 0 || additionalImagesChanged) {
      const uploadedAdditional = await Promise.all(
        additionalImageFiles.map((file) => uploadFile(file))
      );
      payload.additionalImages = [
        ...existingAdditionalImages,
        ...uploadedAdditional,
      ];
    }

    try {
      const response = await fetch(
        editingId ? `/api/gallery/${editingId}` : "/api/gallery",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      console.error(response);

      if (!response.ok) {
        throw new Error(
          editingId ? "Failed to update item" : "Failed to create item"
        );
      }

      setFormState({
        title: { ...emptyLocalized },
        description: { ...emptyLocalized },
        fullDescription: { ...emptyLocalized },
      });
      setMainImageFile(null);
      setAdditionalImageFiles([]);
      setExistingMainImage(null);
      setExistingAdditionalImages([]);
      setVideoLinks([]);
      setAdditionalImagesChanged(false);
      setEditingId(null);
      setStatusMessage(
        editingId ? "Item updated successfully." : "Item created successfully."
      );
      if (editingId) {
        router.push("/admin");
      }
    } catch (error) {
      console.error(error);
      setStatusMessage(
        editingId ? "Failed to update item." : "Failed to create item."
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormState({
      title: { ...emptyLocalized },
      description: { ...emptyLocalized },
      fullDescription: { ...emptyLocalized },
    });
    setMainImageFile(null);
    setAdditionalImageFiles([]);
    setExistingMainImage(null);
    setExistingAdditionalImages([]);
    setVideoLinks([]);
    setAdditionalImagesChanged(false);
    setStatusMessage(null);
    router.push("/admin");
  };

  const updateVideoLink = (index: number, value: string) => {
    setVideoLinks((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addVideoLink = () => {
    setVideoLinks((prev) => [...prev, ""]);
  };

  const removeVideoLink = (index: number) => {
    setVideoLinks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const mainPreview = useMemo(
    () => (mainImageFile ? URL.createObjectURL(mainImageFile) : null),
    [mainImageFile]
  );
  const additionalPreviews = useMemo(
    () =>
      additionalImageFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [additionalImageFiles]
  );

  useEffect(() => {
    return () => {
      if (mainPreview) URL.revokeObjectURL(mainPreview);
      additionalPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [mainPreview, additionalPreviews]);

  const renderPreview = (
    previewUrl: string,
    label: string,
    onRemove: () => void
  ) => (
    <div className="relative w-32 overflow-hidden rounded-lg border border-gray-700 bg-[#141414]">
      <img src={previewUrl} alt={label} className="h-24 w-full object-cover" />
      <div className="flex items-center justify-between px-2 py-1 text-[11px] text-gray-300">
        <span className="truncate">{label}</span>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full bg-white/10 p-1 text-gray-200 transition-colors hover:bg-white/20"
          aria-label="Remove image"
        >
          ✕
        </button>
      </div>
    </div>
  );

  const renderExistingPreview = (
    previewUrl: string,
    label: string,
    onRemove: () => void
  ) => (
    <div className="relative w-32 overflow-hidden rounded-lg border border-gray-700 bg-[#141414]">
      <img src={previewUrl} alt={label} className="h-24 w-full object-cover" />
      <div className="flex items-center justify-between px-2 py-1 text-[11px] text-gray-300">
        <span className="truncate">{label}</span>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full bg-red-500/20 p-1 text-red-100 transition-colors hover:bg-red-500/30"
          aria-label="Remove image"
        >
          ✕
        </button>
      </div>
    </div>
  );

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 text-white">
      <h1 className="text-3xl font-semibold">Admin Gallery</h1>
      <p className="mt-2 text-sm text-gray-400">
        Add or update gallery items with English and French content.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => router.push("/admin/items")}
          className="rounded-lg border border-gray-500 px-4 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-gray-300 hover:text-white"
        >
          View existing items
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/about")}
          className="rounded-lg border border-gray-500 px-4 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-gray-300 hover:text-white"
        >
          Edit About
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

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {editingId && (
          <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Editing item. Upload new images only if you want to replace them.
          </div>
        )}
        {isLoadingItem && (
          <p className="text-sm text-gray-400">Loading item...</p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Title (EN)</label>
            <input
              value={formState.title.en}
              onChange={(event) =>
                handleChange("title", event.target.value, "en")
              }
              className="w-full rounded-lg border border-gray-600 bg-[#1f1f1f] px-3 py-2 text-sm text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Title (FR)</label>
            <input
              value={formState.title.fr}
              onChange={(event) =>
                handleChange("title", event.target.value, "fr")
              }
              className="w-full rounded-lg border border-gray-600 bg-[#1f1f1f] px-3 py-2 text-sm text-white"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Description (EN)
            </label>
            <input
              value={formState.description.en}
              onChange={(event) =>
                handleChange("description", event.target.value, "en")
              }
              className="w-full rounded-lg border border-gray-600 bg-[#1f1f1f] px-3 py-2 text-sm text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Description (FR)
            </label>
            <input
              value={formState.description.fr}
              onChange={(event) =>
                handleChange("description", event.target.value, "fr")
              }
              className="w-full rounded-lg border border-gray-600 bg-[#1f1f1f] px-3 py-2 text-sm text-white"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Full Description (EN)
            </label>
            <textarea
              value={formState.fullDescription.en}
              onChange={(event) =>
                handleChange("fullDescription", event.target.value, "en")
              }
              rows={4}
              className="w-full rounded-lg border border-gray-600 bg-[#1f1f1f] px-3 py-2 text-sm text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Full Description (FR)
            </label>
            <textarea
              value={formState.fullDescription.fr}
              onChange={(event) =>
                handleChange("fullDescription", event.target.value, "fr")
              }
              rows={4}
              className="w-full rounded-lg border border-gray-600 bg-[#1f1f1f] px-3 py-2 text-sm text-white"
              required
            />
          </div>
        </div>

        <div>
          <div className="rounded-xl border border-dashed border-gray-600 bg-[#1c1c1c]/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Main Image</p>
                <p className="text-xs text-gray-400">
                  Upload the primary image shown in the gallery.
                </p>
              </div>
              <label className="cursor-pointer rounded-md bg-white px-3 py-2 text-xs font-semibold text-[#1f1f1f] transition-opacity hover:opacity-90">
                Choose file
                <input
                  type="file"
                  accept="image/*"
                  required={!editingId || !existingMainImage}
                  className="sr-only"
                  onChange={(event) =>
                    setMainImageFile(event.target.files?.[0] ?? null)
                  }
                />
              </label>
            </div>
            <div className="mt-3">
              {mainPreview ? (
                renderPreview(mainPreview, mainImageFile?.name ?? "Main", () =>
                  setMainImageFile(null)
                )
              ) : existingMainImage ? (
                renderExistingPreview(existingMainImage, "Current", () => {
                  setExistingMainImage(null);
                })
              ) : (
                <p className="text-xs text-gray-400">No file selected.</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-gray-600 bg-[#1c1c1c]/60 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">
                Additional Images
              </p>
              <p className="text-xs text-gray-400">
                Optional gallery detail images.
              </p>
            </div>
            <label className="cursor-pointer rounded-md bg-white px-3 py-2 text-xs font-semibold text-[#1f1f1f] transition-opacity hover:opacity-90">
              Choose files
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(event) =>
                  setAdditionalImageFiles(Array.from(event.target.files ?? []))
                }
              />
            </label>
          </div>
          <div className="mt-3">
            {existingAdditionalImages.length === 0 &&
            additionalPreviews.length === 0 ? (
              <p className="text-xs text-gray-400">No file selected.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {existingAdditionalImages.map((url) => (
                  <div key={url}>
                    {renderExistingPreview(url, "Current", () => {
                      setExistingAdditionalImages((prev) =>
                        prev.filter((item) => item !== url)
                      );
                      setAdditionalImagesChanged(true);
                    })}
                  </div>
                ))}
                {additionalPreviews.map((preview) => (
                  <div
                    key={`${preview.file.name}-${preview.file.size}-${preview.file.lastModified}`}
                  >
                    {renderPreview(preview.url, preview.file.name, () =>
                      setAdditionalImageFiles((prev) =>
                        prev.filter((file) => file !== preview.file)
                      )
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-gray-600 bg-[#1c1c1c]/60 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">YouTube Videos</p>
              <p className="text-xs text-gray-400">
                Paste YouTube embed or share links to include videos in the carousel.
              </p>
            </div>
            <button
              type="button"
              onClick={addVideoLink}
              className="rounded-md border border-gray-500 px-3 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-gray-300 hover:text-white"
            >
              Add video
            </button>
          </div>
          {videoLinks.length === 0 ? (
            <p className="mt-3 text-xs text-gray-400">No videos added.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {videoLinks.map((link, index) => (
                <div
                  key={`video-${index}`}
                  className="flex flex-wrap items-center gap-2"
                >
                  <input
                    value={link}
                    onChange={(event) =>
                      updateVideoLink(index, event.target.value)
                    }
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="min-w-0 flex-1 rounded-lg border border-gray-600 bg-[#1f1f1f] px-3 py-2 text-sm text-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeVideoLink(index)}
                    className="rounded-md border border-red-500/60 px-3 py-2 text-xs font-semibold text-red-200 transition-colors hover:border-red-400 hover:text-red-100"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-[#1f1f1f] transition-opacity hover:opacity-90"
        >
          {editingId ? "Update Item" : "Create Item"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={handleCancelEdit}
            className="rounded-lg border border-gray-500 px-5 py-2 text-sm font-semibold text-gray-200 transition-colors hover:border-gray-300 hover:text-white"
          >
            Cancel
          </button>
        )}

        {statusMessage && (
          <p className="text-sm text-gray-300">{statusMessage}</p>
        )}
      </form>
    </main>
  );
}
