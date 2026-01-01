import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import GalleryItemModel from "@/models/GalleryItem";

const localizedTextSchema = z.object({
  en: z.string().min(1),
  fr: z.string().min(1),
});

const galleryItemSchema = z.object({
  title: localizedTextSchema,
  description: localizedTextSchema,
  fullDescription: localizedTextSchema,
  mainImage: z.string().min(1),
  additionalImages: z.array(z.string()).default([]),
  videos: z.array(z.string()).default([]),
});

export async function GET() {
  try {
    await connectToDatabase();
    const items = await GalleryItemModel.find().sort({ createdAt: -1 });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch gallery items", error);
    return NextResponse.json(
      { error: "Failed to fetch gallery items" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = galleryItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const created = await GalleryItemModel.create(parsed.data);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create gallery item", error);
    return NextResponse.json(
      { error: "Failed to create gallery item" },
      { status: 500 }
    );
  }
}
