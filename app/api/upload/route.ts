import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { logInfo, logError, logWarn } from "@/lib/logger";
import crypto from "crypto";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_PAYLOAD_SIZE = 3.5 * 1024 * 1024; // 3.5MB - Vercel limit is ~4.5MB, we use 3.5MB as safety margin

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  const route = "/api/upload";

  try {
    const contentType = request.headers.get("content-type") || "unknown";
    const contentLength = request.headers.get("content-length");
    const contentLengthNum = contentLength ? parseInt(contentLength, 10) : null;

    logInfo("upload_request_start", {
      requestId,
      route,
      method: request.method,
      contentType,
      contentLength: contentLengthNum,
    });

    // Early rejection for large payloads
    if (contentLengthNum && contentLengthNum > MAX_PAYLOAD_SIZE) {
      logWarn("upload_payload_too_large", {
        requestId,
        route,
        contentLength: contentLengthNum,
        maxSize: MAX_PAYLOAD_SIZE,
        message:
          "Request body too large. Use direct-to-Blob upload via /api/upload/token",
      });

      return NextResponse.json(
        {
          error: "Request Entity Too Large",
          details: `Upload too large for Vercel Functions (${(
            contentLengthNum /
            1024 /
            1024
          ).toFixed(2)}MB). Maximum size is ${(
            MAX_PAYLOAD_SIZE /
            1024 /
            1024
          ).toFixed(2)}MB.`,
          hint: "Use direct-to-Blob upload by calling /api/upload/token first, then upload directly to Vercel Blob.",
          requestId,
        },
        { status: 413 }
      );
    }

    // Warn if content-length is missing (could be streaming/chunked)
    if (!contentLengthNum) {
      logWarn("upload_missing_content_length", {
        requestId,
        route,
        message: "Content-Length header missing, proceeding with caution",
      });
    }

    const formData = await request.formData();
    logInfo("upload_formdata_received", { requestId, route });

    const file = formData.get("file");
    const isFile = file instanceof File;

    if (!file || !isFile) {
      logError(
        "upload_invalid_file",
        new Error("No file or invalid file type"),
        {
          requestId,
          route,
          fileExists: !!file,
          isFile,
          fileType: typeof file,
        }
      );
      return NextResponse.json(
        { error: "No file uploaded", requestId },
        { status: 400 }
      );
    }

    const fileSize = file.size;
    const fileName = file.name;
    const fileType = file.type;

    logInfo("upload_file_extracted", {
      requestId,
      route,
      fileName,
      fileSize,
      fileType,
    });

    // Check file size after extraction (in case content-length was missing)
    if (fileSize > MAX_PAYLOAD_SIZE) {
      logWarn("upload_file_too_large", {
        requestId,
        route,
        fileSize,
        fileName,
        maxSize: MAX_PAYLOAD_SIZE,
        message: "File too large after extraction. Use direct-to-Blob upload.",
      });

      return NextResponse.json(
        {
          error: "File Too Large",
          details: `File "${fileName}" is too large (${(
            fileSize /
            1024 /
            1024
          ).toFixed(2)}MB). Maximum size is ${(
            MAX_PAYLOAD_SIZE /
            1024 /
            1024
          ).toFixed(2)}MB.`,
          hint: "Use direct-to-Blob upload by calling /api/upload/token first, then upload directly to Vercel Blob.",
          requestId,
        },
        { status: 413 }
      );
    }

    const safeName = sanitizeFilename(file.name || "upload");
    const filename = `${Date.now()}-${safeName}`;

    // Check if we're on Vercel (production/preview)
    const isVercel = !!process.env.VERCEL;
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const hasBlobToken = !!blobToken;
    const tokenFormatValid = blobToken?.startsWith("vercel_blob_") || false;

    console.log({
      requestId,
      route,
      isVercel,
      hasBlobToken,
      tokenFormatValid,
      filename,
    });

    logInfo("upload_environment_check", {
      requestId,
      route,
      isVercel,
      hasBlobToken,
      tokenFormatValid,
      filename,
    });

    // On Vercel, we MUST use Blob Storage (filesystem is read-only)
    if (isVercel) {
      if (!blobToken) {
        logError(
          "upload_missing_token_vercel",
          new Error("BLOB_READ_WRITE_TOKEN not set on Vercel"),
          { requestId, route }
        );
        return NextResponse.json(
          {
            error: "Blob storage not configured",
            details:
              "BLOB_READ_WRITE_TOKEN environment variable is missing. Please configure Vercel Blob Storage in your project settings.",
            requestId,
          },
          { status: 500 }
        );
      }

      if (!tokenFormatValid) {
        logError(
          "upload_invalid_token_format",
          new Error("BLOB_READ_WRITE_TOKEN format invalid"),
          { requestId, route }
        );
        return NextResponse.json(
          {
            error: "Invalid Blob token format",
            details:
              "The BLOB_READ_WRITE_TOKEN appears to be invalid. Please regenerate it from your Blob store settings in Vercel.",
            hint: "Token should start with 'vercel_blob_'. Go to Storage → Your Blob Store → Settings → Tokens to regenerate.",
            requestId,
          },
          { status: 500 }
        );
      }

      // Use Vercel Blob Storage for production
      logInfo("upload_blob_attempt", { requestId, route, filename });
      try {
        const blob = await put(filename, file, {
          access: "public",
        });
        const elapsedMs = Date.now() - startTime;
        logInfo("upload_blob_success", {
          requestId,
          route,
          elapsedMs,
          url: blob.url,
          pathname: blob.pathname,
          fileSize,
        });
        return NextResponse.json({ url: blob.url, requestId }, { status: 201 });
      } catch (blobError) {
        const elapsedMs = Date.now() - startTime;
        logError("upload_blob_failed", blobError, {
          requestId,
          route,
          elapsedMs,
          filename,
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
            requestId,
          },
          { status: 500 }
        );
      }
    }

    // Local development: Use Blob if token is available, otherwise use filesystem
    if (blobToken) {
      logInfo("upload_blob_attempt_local", { requestId, route, filename });
      try {
        const blob = await put(filename, file, {
          access: "public",
        });
        const elapsedMs = Date.now() - startTime;
        logInfo("upload_blob_success_local", {
          requestId,
          route,
          elapsedMs,
          url: blob.url,
          pathname: blob.pathname,
        });
        return NextResponse.json({ url: blob.url, requestId }, { status: 201 });
      } catch (blobError) {
        logWarn("upload_blob_failed_local_fallback", {
          requestId,
          route,
          error:
            blobError instanceof Error ? blobError.message : String(blobError),
          message: "Falling back to local filesystem",
        });
        // Fall through to local storage if blob fails in development
      }
    } else {
      logInfo("upload_filesystem_fallback", {
        requestId,
        route,
        message: "No Blob token found, using local filesystem",
      });
    }

    // Fallback to local filesystem for development only
    logInfo("upload_filesystem_start", {
      requestId,
      route,
      uploadDir: UPLOAD_DIR,
      filename,
    });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await mkdir(UPLOAD_DIR, { recursive: true });

    const filePath = path.join(UPLOAD_DIR, filename);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;
    const elapsedMs = Date.now() - startTime;

    logInfo("upload_filesystem_success", {
      requestId,
      route,
      elapsedMs,
      url: publicUrl,
      fileSize,
    });

    return NextResponse.json({ url: publicUrl, requestId }, { status: 201 });
  } catch (error) {
    const elapsedMs = Date.now() - startTime;
    logError("upload_request_error", error, {
      requestId,
      route,
      elapsedMs,
    });

    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : String(error),
        requestId,
      },
      { status: 500 }
    );
  }
}
