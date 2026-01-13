import { NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";
import { logInfo, logError } from "@/lib/logger";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  const route = "/api/upload/token";

  try {
    logInfo("upload_token_request_start", {
      requestId,
      route,
      method: request.method,
    });

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const isVercel = !!process.env.VERCEL;

    if (!blobToken) {
      logError(
        "upload_token_missing_token",
        new Error("BLOB_READ_WRITE_TOKEN not configured"),
        { requestId, route, isVercel }
      );
      return NextResponse.json(
        {
          error: "Blob storage not configured",
          details: "BLOB_READ_WRITE_TOKEN environment variable is missing.",
          requestId,
        },
        { status: 500 }
      );
    }

    // Use handleUpload from @vercel/blob/client to handle client uploads
    // This generates a client token and handles the upload flow
    const response = await handleUpload({
      request,
      body: request.body as any,
      onBeforeGenerateToken: async (
        pathname: string,
        clientPayload?: unknown
      ) => {
        logInfo("upload_token_generating", {
          requestId,
          pathname,
          clientPayload,
        });
        // Allow all file types, but you can restrict this
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "video/mp4",
            "video/webm",
            "application/pdf",
          ],
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({
        blob,
        tokenPayload,
      }: {
        blob: { url: string; pathname: string };
        tokenPayload?: unknown;
      }) => {
        logInfo("upload_token_completed", {
          requestId,
          url: blob.url,
          pathname: blob.pathname,
        });
      },
    } as any);

    const elapsedMs = Date.now() - startTime;
    logInfo("upload_token_success", {
      requestId,
      route,
      elapsedMs,
      message: "Client upload handled successfully",
    });

    return response;
  } catch (error) {
    const elapsedMs = Date.now() - startTime;
    logError("upload_token_error", error, {
      requestId,
      route,
      elapsedMs,
    });

    return NextResponse.json(
      {
        error: "Failed to handle upload",
        details: error instanceof Error ? error.message : String(error),
        requestId,
      },
      { status: 500 }
    );
  }
}
