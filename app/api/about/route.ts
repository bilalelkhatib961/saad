import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import AboutContentModel from "@/models/AboutContent";

const localizedTextSchema = z.object({
  en: z.string().min(1),
  fr: z.string().min(1),
});

const aboutSchema = z.object({
  title: localizedTextSchema,
  description: localizedTextSchema,
  image: z.string().min(1).optional(),
  pdfLink: z.string().min(1).optional(),
});

export async function GET() {
  try {
    await connectToDatabase();
    const content = await AboutContentModel.findOne();
    return NextResponse.json(content ?? null);
  } catch (error) {
    console.error("Failed to fetch about content", error);
    return NextResponse.json(
      { error: "Failed to fetch about content" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = aboutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const existing = await AboutContentModel.findOne();

    const updated = existing
      ? await AboutContentModel.findByIdAndUpdate(existing._id, parsed.data, {
          new: true,
        })
      : await AboutContentModel.create(parsed.data);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update about content", error);
    return NextResponse.json(
      { error: "Failed to update about content" },
      { status: 500 }
    );
  }
}
