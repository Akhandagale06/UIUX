import { db } from "@/config/db";
import { ProjectTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = user?.primaryEmailAddress?.emailAddress;
        if (!email) {
            return NextResponse.json({ error: "User email not found" }, { status: 400 });
        }

        const projects = await db.select()
            .from(ProjectTable)
            .where(eq(ProjectTable.userId, email))
            .orderBy(desc(ProjectTable.id)); // Latest first

        return NextResponse.json(projects);
    } catch (error) {
        console.error("Failed to fetch user projects:", error);
        return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }
}
