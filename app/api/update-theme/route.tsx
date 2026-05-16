import { db } from "@/config/db";
import { ProjectTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { projectId, theme } = await req.json();

    try {
        await db.update(ProjectTable)
            .set({ theme: theme })
            .where(eq(ProjectTable.projectId, projectId));

        return NextResponse.json({
            success: true,
            message: "Theme updated successfully"
        });

    } catch (error) {
        console.error("Error updating theme:", error);
        return NextResponse.json(
            { error: "Failed to update theme" },
            { status: 500 }
        );
    }
}