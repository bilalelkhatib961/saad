import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import UserModel from "@/models/User";
import { ensureAdminUser } from "@/lib/seedAdminUser";
import { adminAuthCookieName, signAdminToken } from "@/lib/auth";

const signInSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signInSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectToDatabase();
    await ensureAdminUser();

    const user = await UserModel.findOne({
      username: parsed.data.username,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(
      parsed.data.password,
      user.passwordHash
    );

    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = await signAdminToken({
      userId: user._id.toString(),
      username: user.username,
    });

    const response = NextResponse.json({
      ok: true,
      user: { id: user._id.toString(), username: user.username },
    });

    response.cookies.set({
      name: adminAuthCookieName,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Sign-in failed", error);
    return NextResponse.json({ error: "Sign-in failed" }, { status: 500 });
  }
}
