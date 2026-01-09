import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
}

export async function POST(request: Request) {
  console.log("[UPLOAD] Starting upload request");

  try {
    const formData = await request.formData();
    console.log("[UPLOAD] FormData received");

    const file = formData.get("file");
    const isFile = file instanceof File;
    console.log("[UPLOAD] File extracted from formData:", {
      isFile,
      fileName: isFile ? (file as File).name : "not a file",
      fileSize: isFile ? (file as File).size : "unknown",
      fileType: isFile ? (file as File).type : "unknown",
    });

    if (!file || !isFile) {
      console.error("[UPLOAD] Invalid file:", {
        fileExists: !!file,
        isFile,
        fileType: typeof file,
      });
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const safeName = sanitizeFilename(file.name || "upload");
    const filename = `${Date.now()}-${safeName}`;
    console.log("[UPLOAD] Generated filename:", filename);

    // Check if we're on Vercel (production/preview)
    const isVercel = !!process.env.VERCEL;
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const hasBlobToken = !!blobToken;

    console.log("[UPLOAD] Environment check:", {
      isVercel,
      hasBlobToken,
      blobTokenLength: blobToken?.length || 0,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    });

    // On Vercel, we MUST use Blob Storage (filesystem is read-only)
    if (isVercel) {
      if (!blobToken) {
        console.error(
          "[UPLOAD] ERROR: On Vercel but BLOB_READ_WRITE_TOKEN is not set!"
        );
        return NextResponse.json(
          {
            error: "Blob storage not configured",
            details:
              "BLOB_READ_WRITE_TOKEN environment variable is missing. Please configure Vercel Blob Storage in your project settings.",
          },
          { status: 500 }
        );
      }

      // Use Vercel Blob Storage for production
      console.log("[UPLOAD] Attempting Vercel Blob upload...");
      try {
        const blob = await put(filename, file, {
          access: "public",
        });
        console.log("[UPLOAD] Vercel Blob upload successful:", {
          url: blob.url,
          pathname: blob.pathname,
        });
        return NextResponse.json({ url: blob.url }, { status: 201 });
      } catch (blobError) {
        console.error("[UPLOAD] Vercel Blob upload failed:", {
          error:
            blobError instanceof Error ? blobError.message : String(blobError),
          stack: blobError instanceof Error ? blobError.stack : undefined,
          errorType: blobError?.constructor?.name,
        });
        // On Vercel, don't fall back to filesystem - it won't work
        return NextResponse.json(
          {
            error: "Failed to upload to Blob Storage",
            details:
              blobError instanceof Error
                ? blobError.message
                : String(blobError),
            hint: "Please check that BLOB_READ_WRITE_TOKEN is correctly set in your Vercel project settings.",
          },
          { status: 500 }
        );
      }
    }

    // Local development: Use Blob if token is available, otherwise use filesystem
    if (blobToken) {
      console.log(
        "[UPLOAD] Blob token available, attempting Vercel Blob upload..."
      );
      try {
        const blob = await put(filename, file, {
          access: "public",
        });
        console.log("[UPLOAD] Vercel Blob upload successful:", {
          url: blob.url,
          pathname: blob.pathname,
        });
        return NextResponse.json({ url: blob.url }, { status: 201 });
      } catch (blobError) {
        console.error(
          "[UPLOAD] Vercel Blob upload failed, falling back to local filesystem:",
          {
            error:
              blobError instanceof Error
                ? blobError.message
                : String(blobError),
          }
        );
        // Fall through to local storage if blob fails in development
      }
    } else {
      console.log("[UPLOAD] No Blob token found, using local filesystem");
    }

    // Fallback to local filesystem for development only
    console.log("[UPLOAD] Attempting local filesystem upload...");
    console.log("[UPLOAD] Upload directory:", UPLOAD_DIR);

    const bytes = await file.arrayBuffer();
    console.log(
      "[UPLOAD] File converted to ArrayBuffer, size:",
      bytes.byteLength
    );

    const buffer = Buffer.from(bytes);
    console.log("[UPLOAD] Buffer created, size:", buffer.length);

    console.log("[UPLOAD] Creating upload directory if it doesn't exist...");
    await mkdir(UPLOAD_DIR, { recursive: true });
    console.log("[UPLOAD] Directory created/verified");

    const filePath = path.join(UPLOAD_DIR, filename);
    console.log("[UPLOAD] Writing file to:", filePath);

    await writeFile(filePath, buffer);
    console.log("[UPLOAD] File written successfully");

    const publicUrl = `/uploads/${filename}`;
    console.log("[UPLOAD] Upload complete, returning URL:", publicUrl);

    return NextResponse.json({ url: publicUrl }, { status: 201 });
  } catch (error) {
    console.error("[UPLOAD] Upload failed with error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name,
      errorDetails: error,
    });

    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
