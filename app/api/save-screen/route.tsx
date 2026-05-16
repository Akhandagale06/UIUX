import { db } from "@/config/db";
import { ProjectTable, ScreenConfigTable } from "@/config/schema";
import { themeToCssVars, THEMES } from "@/data/Themes";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    const { screenId, htmlCode, screenName, projectId } = await req.json();

    try {
        // Update the screen code in database
        await db.update(ScreenConfigTable)
            .set({ code: htmlCode })
            .where(eq(ScreenConfigTable.screenId, screenId));

        // Fetch theme from project
        const project = await db.select().from(ProjectTable).where(eq(ProjectTable.projectId, projectId)).limit(1);
        const themeKey = project[0]?.theme as keyof typeof THEMES || "AURORA_INK";
        const theme = THEMES[themeKey];

        const fullHtml = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${screenName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://code.iconify.design/iconify-icon/1.0.0/iconify-icon.min.js"></script>
  <style>
    ${themeToCssVars(theme)}
    body { background-color: var(--background); color: var(--foreground); }
  </style>
</head>
<body>
  ${htmlCode}
</body>
</html>
`;

        // Save to file system
        const screensDir = path.join(process.cwd(), 'saved-screens');
        if (!fs.existsSync(screensDir)) {
            fs.mkdirSync(screensDir, { recursive: true });
        }

        const fileName = `${screenName.replace(/[^a-zA-Z0-9]/g, '_')}_${screenId}.html`;
        const filePath = path.join(screensDir, fileName);

        fs.writeFileSync(filePath, fullHtml, 'utf8');

        return NextResponse.json({
            success: true,
            message: `Screen saved as ${fileName}`,
            filePath: filePath,
            fullHtml: fullHtml
        });

    } catch (error) {
        console.error("Error saving screen:", error);
        return NextResponse.json(
            { error: "Failed to save screen" },
            { status: 500 }
        );
    }
}