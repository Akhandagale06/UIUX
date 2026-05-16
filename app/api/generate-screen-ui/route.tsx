import { db } from "@/config/db";
import { openrouter } from "@/config/openroute";
import { ScreenConfigTable } from "@/config/schema";
import { GENERATE_SCREEN_PROMPT } from "@/data/Prompt";
import { THEMES, themeToCssVars } from "@/data/Themes";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getOpenRouterMessage, getOpenRouterStatus, sendOpenRouterChat } from "@/lib/openrouter-helper";

export async function POST(req: NextRequest) {
    const {
        projectId, screenId, screenName,
        purpose, screenDescription,
        projectVisualDescription, theme  // ✅ now received
    } = await req.json();

    // ✅ Convert theme key to actual CSS variables for AI
    const themeKey = theme as keyof typeof THEMES;
    const themeObject = THEMES[themeKey] ?? THEMES["AURORA_INK"];
    const themeCss = themeToCssVars(themeObject);

    const userInput = `
        screen name: ${screenName},
        screen purpose: ${purpose},
        screen description: ${screenDescription},
        project visual description: ${projectVisualDescription},
        
        THEME CSS VARIABLES (use these exactly, do not override):
        ${themeCss}
    `;

    try {
        const aiResult = await sendOpenRouterChat({
                model: "google/gemini-2.0-flash-001",
                maxCompletionTokens: 1800,
                maxTokens: 1800,
                temperature: 0.2,
                messages: [
                    {
                        role: 'system',
                        content: [{
                            type: 'text',
                            text: GENERATE_SCREEN_PROMPT
                        }]
                    },
                    {
                        role: "user",
                        content: [{
                            type: "text",
                            text: userInput
                        }]
                    }
                ],
                stream: false
        });

        let code = aiResult?.choices[0]?.message?.content as string;

        // ✅ Strip markdown if AI wraps HTML in code blocks
        code = code
            .replace(/```html/g, '')
            .replace(/```/g, '')
            .trim();

        const updateResult = await db.update(ScreenConfigTable)
            .set({ code: code })
            .where(and(
                eq(ScreenConfigTable.projectId, projectId),
                eq(ScreenConfigTable.screenId, screenId as string)
            ))
            .returning();

        return NextResponse.json(updateResult[0]);
    } catch (error: any) {
        console.error("Error generating screen:", error);
        const status = getOpenRouterStatus(error);
        const message = getOpenRouterMessage(error, "Internal Server Error");
        return NextResponse.json(
            { error: message },
            { status }
        );
    }
}