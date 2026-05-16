import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const email = user.primaryEmailAddress?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { error: "Email not found" },
        { status: 400 }
      );
    }

    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (existingUser.length > 0) {
      return NextResponse.json(existingUser[0]);
    }

    const result = await db
      .insert(usersTable)
      .values({
        name: user.fullName ?? "",
        email: email,
      })
      .returning();

    return NextResponse.json(result[0]);

  } catch (error) {
    console.error("API /api/user Error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}