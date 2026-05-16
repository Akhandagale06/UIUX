import { db } from "@/config/db";
import { ScreenConfigTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    const { screenId, screenshotData, screenName } = await req.json();

    try {
        // Save screenshot to file system
        const screenshotsDir = path.join(process.cwd(), 'screenshots');
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir, { recursive: true });
        }

        // Remove data URL prefix and decode base64
        const base64Data = screenshotData.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        const fileName = `${screenName.replace(/[^a-zA-Z0-9]/g, '_')}_${screenId}_${Date.now()}.png`;
        const filePath = path.join(screenshotsDir, fileName);

        fs.writeFileSync(filePath, buffer);

        return NextResponse.json({
            success: true,
            message: `Screenshot saved as ${fileName}`,
            filePath: filePath
        });

    } catch (error) {
        console.error("Error saving screenshot:", error);
        return NextResponse.json(
            { error: "Failed to save screenshot" },
            { status: 500 }
        );
    }
}