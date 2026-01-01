import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import ContactMessageModel from "@/models/ContactMessage";

const messageSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
});

export async function GET() {
  try {
    await connectToDatabase();
    const messages = await ContactMessageModel.find().sort({ createdAt: -1 });
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Failed to fetch messages", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const created = await ContactMessageModel.create(parsed.data);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create message", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}
