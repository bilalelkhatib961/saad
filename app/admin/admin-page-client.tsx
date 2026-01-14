"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { GalleryItem } from "@/types/gallery-item";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Spinner } from "@/components/ui/spinner";
import { ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { upload } from "@vercel/blob/client";

const emptyLocalized = { en: "", fr: "" };
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const WEBP_QUALITY = 0.85; // Quality for WebP conversion (0-1)

/**
 * Converts an image file to WebP format to reduce file size
 * @param file - The image file to convert
 * @param maxWidth - Maximum width for the image (default: 1920)
 * @param maxHeight - Maximum height for the image (default: 1920)
 * @returns Promise<File> - The converted WebP file or original file if conversion fails
 */
const convertImageToWebP = async (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920
): Promise<File> => {
  // Only convert image files
  if (!file.type.startsWith("image/")) {
    return file;
  }

  // Skip if already WebP
  if (file.type === "image/webp") {
    return file;
  }

  try {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        console.warn(
          "[WEBP_CONVERT] Canvas context not available, using original file"
        );
        resolve(file);
        return;
      }

      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and convert to WebP
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.warn(
                  "[WEBP_CONVERT] Failed to create blob, using original file"
                );
                resolve(file);
                return;
              }

              // Create new File with WebP extension
              const originalName = file.name.replace(/\.[^/.]+$/, "");
              const webpFile = new File([blob], `${originalName}.webp`, {
                type: "image/webp",
                lastModified: Date.now(),
              });

              console.log("[WEBP_CONVERT] Conversion successful", {
                original: {
                  name: file.name,
                  size: file.size,
                  type: file.type,
                },
                converted: {
                  name: webpFile.name,
                  size: webpFile.size,
                  type: webpFile.type,
                  reduction: `${(
                    ((file.size - webpFile.size) / file.size) *
                    100
                  ).toFixed(1)}%`,
                },
              });

              resolve(webpFile);
            },
            "image/webp",
            WEBP_QUALITY
          );
        } catch (error) {
          console.error("[WEBP_CONVERT] Error during conversion", error);
          resolve(file); // Fallback to original file
        }
      };

      img.onerror = () => {
        console.warn("[WEBP_CONVERT] Image load error, using original file");
        resolve(file);
      };

      // Load image from file
      img.src = URL.createObjectURL(file);
    });
  } catch (error) {
    console.error("[WEBP_CONVERT] Conversion failed", error);
    return file; // Fallback to original file
  }
};

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
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setIsSubmitting(true);

    if (!editingId && !mainImageFile) {
      setStatusMessage("Please upload the main image.");
      setIsSubmitting(false);
      return;
    }

    if (editingId && !existingMainImage && !mainImageFile) {
      setStatusMessage("Please upload a main image.");
      setIsSubmitting(false);
      return;
    }

    const uploadFile = async (file: File, requestId?: string) => {
      const fileRequestId =
        requestId ||
        `client-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const SMALL_FILE_THRESHOLD = 3.5 * 1024 * 1024; // 3.5MB - use old endpoint for small files

      // Convert image to WebP before upload to reduce size
      let fileToUpload = file;
      if (file.type.startsWith("image/")) {
        console.log("[CLIENT_UPLOAD] Converting image to WebP", {
          requestId: fileRequestId,
          fileName: file.name,
          originalSize: file.size,
        });
        fileToUpload = await convertImageToWebP(file);
      }

      // Validate file size (after conversion)
      if (fileToUpload.size > MAX_FILE_SIZE) {
        console.error("[CLIENT_UPLOAD] File too large", {
          requestId: fileRequestId,
          fileName: fileToUpload.name,
          fileSize: fileToUpload.size,
          maxSize: MAX_FILE_SIZE,
        });
        throw new Error(
          `File "${fileToUpload.name}" is too large (${(
            fileToUpload.size /
            1024 /
            1024
          ).toFixed(2)}MB). Maximum size is 5MB.`
        );
      }

      console.log("[CLIENT_UPLOAD] Starting upload", {
        requestId: fileRequestId,
        fileName: fileToUpload.name,
        fileSize: fileToUpload.size,
        fileType: fileToUpload.type,
        originalFileName:
          file.name !== fileToUpload.name ? file.name : undefined,
        useDirectUpload: fileToUpload.size > SMALL_FILE_THRESHOLD,
      });

      // For small files, use the old endpoint (faster, simpler)
      if (fileToUpload.size <= SMALL_FILE_THRESHOLD) {
        try {
          const formData = new FormData();
          formData.append("file", fileToUpload);
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("[CLIENT_UPLOAD] Small file upload failed", {
              requestId: fileRequestId,
              status: response.status,
              error: errorData,
            });
            throw new Error(
              errorData.details || errorData.error || "Upload failed"
            );
          }

          const data = await response.json();
          console.log("[CLIENT_UPLOAD] Small file upload successful", {
            requestId: fileRequestId,
            url: data.url,
          });
          return data.url;
        } catch (error) {
          console.error("[CLIENT_UPLOAD] Small file upload error", {
            requestId: fileRequestId,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      }

      // For large files, use direct-to-Blob upload
      try {
        console.log("[CLIENT_UPLOAD] Uploading to Blob", {
          requestId: fileRequestId,
          fileName: file.name,
          fileSize: file.size,
        });

        const sanitizeFilename = (filename: string) => {
          return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
        };
        const safeName = sanitizeFilename(fileToUpload.name || "upload");
        const filename = `${Date.now()}-${safeName}`;

        // Use @vercel/blob/client upload with handleUploadUrl
        // This automatically requests a token from the server and handles the upload
        const blob = await upload(filename, fileToUpload, {
          access: "public",
          handleUploadUrl: "/api/upload/token",
        });

        console.log("[CLIENT_UPLOAD] Blob upload successful", {
          requestId: fileRequestId,
          url: blob.url,
          pathname: blob.pathname,
        });

        // Notify completion endpoint (non-blocking)
        fetch("/api/upload/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: blob.url,
            pathname: blob.pathname,
            size: fileToUpload.size,
            contentType: fileToUpload.type,
            originalName: fileToUpload.name,
            requestId: fileRequestId,
          }),
        }).catch(() => {
          // Ignore completion notification errors
        });

        return blob.url;
      } catch (error) {
        console.error("[CLIENT_UPLOAD] Large file upload failed", {
          requestId: fileRequestId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
      }
    };

    const payload: Partial<GalleryItem> = {
      title: formState.title,
      description: formState.description,
      fullDescription: formState.fullDescription,
      videos: videoLinks.map((link) => link.trim()).filter(Boolean),
    };

    // Upload files sequentially to avoid timeout and memory issues
    try {
      if (mainImageFile) {
        try {
          payload.mainImage = await uploadFile(mainImageFile);
        } catch (uploadError) {
          throw new Error(
            `Failed to upload main image: ${
              uploadError instanceof Error
                ? uploadError.message
                : String(uploadError)
            }`
          );
        }
      }

      if (additionalImageFiles.length > 0 || additionalImagesChanged) {
        const uploadedAdditional: string[] = [];
        for (let i = 0; i < additionalImageFiles.length; i++) {
          const file = additionalImageFiles[i];
          try {
            const url = await uploadFile(file);
            uploadedAdditional.push(url);
            // Update status to show progress
            setStatusMessage(
              `Uploading images... (${i + 1}/${additionalImageFiles.length})`
            );
          } catch (fileError) {
            throw new Error(
              `Failed to upload "${file.name}": ${
                fileError instanceof Error
                  ? fileError.message
                  : String(fileError)
              }`
            );
          }
        }
        payload.additionalImages = [
          ...existingAdditionalImages,
          ...uploadedAdditional,
        ];
      }
    } catch (uploadError) {
      setStatusMessage(
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload files. Please check file sizes and try again."
      );
      setIsSubmitting(false);
      return;
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
        router.push("/admin/items");
      }
    } catch (error) {
      console.error(error);
      setStatusMessage(
        editingId ? "Failed to update item." : "Failed to create item."
      );
    } finally {
      setIsSubmitting(false);
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
    router.push("/admin/items");
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

  // Reorder functions for additional images
  const moveExistingImage = (fromIndex: number, toIndex: number) => {
    setExistingAdditionalImages((prev) => {
      const newArray = [...prev];
      const [removed] = newArray.splice(fromIndex, 1);
      newArray.splice(toIndex, 0, removed);
      setAdditionalImagesChanged(true);
      return newArray;
    });
  };

  const movePreviewImage = (fromIndex: number, toIndex: number) => {
    setAdditionalImageFiles((prev) => {
      const newArray = [...prev];
      const [removed] = newArray.splice(fromIndex, 1);
      newArray.splice(toIndex, 0, removed);
      return newArray;
    });
  };

  const moveImageUp = (index: number, isExisting: boolean) => {
    if (index === 0) return;
    if (isExisting) {
      moveExistingImage(index, index - 1);
    } else {
      movePreviewImage(index, index - 1);
    }
  };

  const moveImageDown = (index: number, isExisting: boolean) => {
    if (isExisting) {
      if (index === existingAdditionalImages.length - 1) return;
      moveExistingImage(index, index + 1);
    } else {
      if (index === additionalImageFiles.length - 1) return;
      movePreviewImage(index, index + 1);
    }
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
    onRemove: () => void,
    index?: number,
    totalCount?: number,
    onMoveUp?: () => void,
    onMoveDown?: () => void,
    onDragStart?: (e: React.DragEvent) => void,
    onDragOver?: (e: React.DragEvent) => void,
    onDrop?: (e: React.DragEvent) => void,
    draggable?: boolean
  ) => (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`relative w-32 overflow-hidden rounded-lg border border-gray-700 bg-[#141414] ${
        draggable ? "cursor-move" : ""
      }`}
    >
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
      {(onMoveUp || onMoveDown) && (
        <div className="absolute top-1 right-1 flex flex-col gap-1">
          {onMoveUp && index !== undefined && index > 0 && (
            <button
              type="button"
              onClick={onMoveUp}
              className="rounded bg-black/60 p-0.5 text-white hover:bg-black/80"
              aria-label="Move up"
            >
              <ArrowUp className="h-3 w-3" />
            </button>
          )}
          {onMoveDown &&
            index !== undefined &&
            totalCount !== undefined &&
            index < totalCount - 1 && (
              <button
                type="button"
                onClick={onMoveDown}
                className="rounded bg-black/60 p-0.5 text-white hover:bg-black/80"
                aria-label="Move down"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
            )}
        </div>
      )}
      {draggable && (
        <div className="absolute top-1 left-1 rounded bg-black/60 p-0.5 text-white">
          <GripVertical className="h-3 w-3" />
        </div>
      )}
    </div>
  );

  const renderExistingPreview = (
    previewUrl: string,
    label: string,
    onRemove: () => void,
    index?: number,
    totalCount?: number,
    onMoveUp?: () => void,
    onMoveDown?: () => void,
    onDragStart?: (e: React.DragEvent) => void,
    onDragOver?: (e: React.DragEvent) => void,
    onDrop?: (e: React.DragEvent) => void,
    draggable?: boolean
  ) => (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`relative w-32 overflow-hidden rounded-lg border border-gray-700 bg-[#141414] ${
        draggable ? "cursor-move" : ""
      }`}
    >
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
      {(onMoveUp || onMoveDown) && (
        <div className="absolute top-1 right-1 flex flex-col gap-1">
          {onMoveUp && index !== undefined && index > 0 && (
            <button
              type="button"
              onClick={onMoveUp}
              className="rounded bg-black/60 p-0.5 text-white hover:bg-black/80"
              aria-label="Move up"
            >
              <ArrowUp className="h-3 w-3" />
            </button>
          )}
          {onMoveDown &&
            index !== undefined &&
            totalCount !== undefined &&
            index < totalCount - 1 && (
              <button
                type="button"
                onClick={onMoveDown}
                className="rounded bg-black/60 p-0.5 text-white hover:bg-black/80"
                aria-label="Move down"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
            )}
        </div>
      )}
      {draggable && (
        <div className="absolute top-1 left-1 rounded bg-black/60 p-0.5 text-white">
          <GripVertical className="h-3 w-3" />
        </div>
      )}
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

        <div className="grid gap-4 grid-cols-1">
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Full Description (EN)
            </label>
            <RichTextEditor
              value={formState.fullDescription.en}
              onChange={(value) => handleChange("fullDescription", value, "en")}
              placeholder="Enter full description in English..."
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Full Description (FR)
            </label>
            <RichTextEditor
              value={formState.fullDescription.fr}
              onChange={(value) => handleChange("fullDescription", value, "fr")}
              placeholder="Enter full description in French..."
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
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file) {
                      if (file.size > MAX_FILE_SIZE) {
                        setStatusMessage(
                          `File "${file.name}" is too large (${(
                            file.size /
                            1024 /
                            1024
                          ).toFixed(2)}MB). Maximum size is 5MB.`
                        );
                        event.target.value = ""; // Clear the input
                        return;
                      }
                      setStatusMessage(null);
                    }
                    setMainImageFile(file);
                  }}
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
                Optional gallery detail images. Drag to reorder or use arrow
                buttons.
              </p>
            </div>
            <label className="cursor-pointer rounded-md bg-white px-3 py-2 text-xs font-semibold text-[#1f1f1f] transition-opacity hover:opacity-90">
              Choose files
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  const validFiles: File[] = [];
                  const invalidFiles: string[] = [];

                  files.forEach((file) => {
                    if (file.size > MAX_FILE_SIZE) {
                      invalidFiles.push(
                        `${file.name} (${(file.size / 1024 / 1024).toFixed(
                          2
                        )}MB)`
                      );
                    } else {
                      validFiles.push(file);
                    }
                  });

                  if (invalidFiles.length > 0) {
                    setStatusMessage(
                      `Some files are too large (max 5MB): ${invalidFiles.join(
                        ", "
                      )}`
                    );
                  } else {
                    setStatusMessage(null);
                  }

                  setAdditionalImageFiles(validFiles);
                }}
              />
            </label>
          </div>
          <div className="mt-3">
            {existingAdditionalImages.length === 0 &&
            additionalPreviews.length === 0 ? (
              <p className="text-xs text-gray-400">No file selected.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {existingAdditionalImages.map((url, index) => {
                  const totalExisting = existingAdditionalImages.length;
                  const totalPreviews = additionalPreviews.length;
                  const totalCount = totalExisting + totalPreviews;
                  const globalIndex = index;

                  return (
                    <div
                      key={url}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("type", "existing");
                        e.dataTransfer.setData("index", index.toString());
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add("opacity-50");
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove("opacity-50");
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove("opacity-50");
                        const dragType = e.dataTransfer.getData("type");
                        const dragIndex = parseInt(
                          e.dataTransfer.getData("index")
                        );

                        if (dragType === "existing" && dragIndex !== index) {
                          moveExistingImage(dragIndex, index);
                        }
                      }}
                    >
                      {renderExistingPreview(
                        url,
                        "Current",
                        () => {
                          setExistingAdditionalImages((prev) =>
                            prev.filter((item) => item !== url)
                          );
                          setAdditionalImagesChanged(true);
                        },
                        index,
                        totalCount,
                        () => moveImageUp(index, true),
                        () => moveImageDown(index, true),
                        undefined,
                        undefined,
                        undefined,
                        true
                      )}
                    </div>
                  );
                })}
                {additionalPreviews.map((preview, index) => {
                  const totalExisting = existingAdditionalImages.length;
                  const totalPreviews = additionalPreviews.length;
                  const totalCount = totalExisting + totalPreviews;
                  const globalIndex = totalExisting + index;

                  return (
                    <div
                      key={`${preview.file.name}-${preview.file.size}-${preview.file.lastModified}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("type", "preview");
                        e.dataTransfer.setData("index", index.toString());
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add("opacity-50");
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove("opacity-50");
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove("opacity-50");
                        const dragType = e.dataTransfer.getData("type");
                        const dragIndex = parseInt(
                          e.dataTransfer.getData("index")
                        );

                        if (dragType === "preview" && dragIndex !== index) {
                          movePreviewImage(dragIndex, index);
                        }
                      }}
                    >
                      {renderPreview(
                        preview.url,
                        preview.file.name,
                        () =>
                          setAdditionalImageFiles((prev) =>
                            prev.filter((file) => file !== preview.file)
                          ),
                        index,
                        totalCount,
                        () => moveImageUp(index, false),
                        () => moveImageDown(index, false),
                        undefined,
                        undefined,
                        undefined,
                        true
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-gray-600 bg-[#1c1c1c]/60 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">YouTube Videos</p>
              <p className="text-xs text-gray-400">
                Paste YouTube embed or share links to include videos in the
                carousel.
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

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-[#1f1f1f] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <Spinner className="size-4" />}
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
        </div>

        {statusMessage && (
          <p className="text-sm text-gray-300">{statusMessage}</p>
        )}
      </form>
    </main>
  );
}
