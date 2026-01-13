import { NextResponse } from "next/server";
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

    // Return the token for client-side direct upload
    // Note: In production, consider implementing time-limited tokens or
    // IP restrictions for enhanced security
    // For now, we return the token as it's needed for @vercel/blob/client put()
    const elapsedMs = Date.now() - startTime;

    logInfo("upload_token_success", {
      requestId,
      route,
      elapsedMs,
      tokenConfigured: !!blobToken,
      message: "Token provided for client upload",
    });

    // Return token for client-side use with @vercel/blob/client
    return NextResponse.json(
      {
        token: blobToken,
        requestId,
      },
      { status: 200 }
    );
  } catch (error) {
    const elapsedMs = Date.now() - startTime;
    logError("upload_token_error", error, {
      requestId,
      route,
      elapsedMs,
    });

    return NextResponse.json(
      {
        error: "Failed to generate upload token",
        details: error instanceof Error ? error.message : String(error),
        requestId,
      },
      { status: 500 }
    );
  }
}
