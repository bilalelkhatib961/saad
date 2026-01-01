import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import GalleryItemModel from "@/models/GalleryItem";

type Params = {
  params: Promise<{ id: string }>;
};

const localizedTextSchema = z.object({
  en: z.string().min(1),
  fr: z.string().min(1),
});

const updateSchema = z.object({
  title: localizedTextSchema.optional(),
  description: localizedTextSchema.optional(),
  fullDescription: localizedTextSchema.optional(),
  mainImage: z.string().min(1).optional(),
  additionalImages: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
});

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;

    await connectToDatabase();
    const item = await GalleryItemModel.findById(id);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to fetch gallery item", error);
    return NextResponse.json(
      { error: "Failed to fetch gallery item" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const updated = await GalleryItemModel.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update gallery item", error);
    return NextResponse.json(
      { error: "Failed to update gallery item" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const deleted = await GalleryItemModel.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete gallery item", error);
    return NextResponse.json(
      { error: "Failed to delete gallery item" },
      { status: 500 }
    );
  }
}
