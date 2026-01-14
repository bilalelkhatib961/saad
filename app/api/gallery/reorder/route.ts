import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import GalleryItemModel from "@/models/GalleryItem";

const reorderSchema = z.object({
  itemIds: z.array(z.string()).min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Update each item with its new order position
    const updatePromises = parsed.data.itemIds.map((id, index) =>
      GalleryItemModel.findByIdAndUpdate(id, { order: index }, { new: true })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder gallery items", error);
    return NextResponse.json(
      { error: "Failed to reorder gallery items" },
      { status: 500 }
    );
  }
}
