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
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const safeName = sanitizeFilename(file.name || "upload");
    const filename = `${Date.now()}-${safeName}`;

    // Check if BLOB_READ_WRITE_TOKEN is available (Vercel production)
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (blobToken) {
      // Use Vercel Blob Storage for production
      try {
        const blob = await put(filename, file, {
          access: "public",
        });
        return NextResponse.json({ url: blob.url }, { status: 201 });
      } catch (blobError) {
        console.error(
          "Vercel Blob upload failed, falling back to local:",
          blobError
        );
        // Fall through to local storage if blob fails
      }
    }

    // Fallback to local filesystem for development
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);

    return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
  } catch (error) {
    console.error("Failed to upload file", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
