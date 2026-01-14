import { NextResponse } from "next/server";
import { logInfo, logError } from "@/lib/logger";
import crypto from "crypto";

export const runtime = "nodejs";

interface CompleteRequestBody {
  url: string;
  pathname?: string;
  size?: number;
  contentType?: string;
  originalName?: string;
  requestId?: string;
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  const route = "/api/upload/complete";

  try {
    logInfo("upload_complete_request_start", {
      requestId,
      route,
      method: request.method,
      contentType: request.headers.get("content-type"),
    });

    const body = (await request.json()) as CompleteRequestBody;
    const incomingRequestId = body.requestId || requestId;

    // Validate required fields
    if (!body.url) {
      logError(
        "upload_complete_validation_error",
        new Error("Missing required field: url"),
        {
          requestId: incomingRequestId,
          route,
          body: { ...body, url: undefined },
        }
      );
      return NextResponse.json(
        {
          error: "Missing required field: url",
          requestId: incomingRequestId,
        },
        { status: 400 }
      );
    }

    logInfo("upload_complete_processing", {
      requestId: incomingRequestId,
      route,
      url: body.url,
      pathname: body.pathname,
      size: body.size,
      contentType: body.contentType,
      originalName: body.originalName,
    });

    // Here you could optionally save to database
    // For now, we just validate and return success

    const elapsedMs = Date.now() - startTime;

    logInfo("upload_complete_success", {
      requestId: incomingRequestId,
      route,
      elapsedMs,
      url: body.url,
    });

    return NextResponse.json(
      {
        ok: true,
        file: {
          url: body.url,
          pathname: body.pathname,
          size: body.size,
          contentType: body.contentType,
          originalName: body.originalName,
        },
        requestId: incomingRequestId,
      },
      { status: 200 }
    );
  } catch (error) {
    const elapsedMs = Date.now() - startTime;
    logError("upload_complete_error", error, {
      requestId,
      route,
      elapsedMs,
    });

    return NextResponse.json(
      {
        error: "Failed to complete upload",
        details: error instanceof Error ? error.message : String(error),
        requestId,
      },
      { status: 500 }
    );
  }
}
