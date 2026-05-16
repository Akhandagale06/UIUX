import { db } from "@/config/db";
import { openrouter } from "@/config/openroute";
import { ScreenConfigTable } from "@/config/schema";
import { GENERATE_SCREEN_PROMPT } from "@/data/Prompt";
import { THEMES, themeToCssVars } from "@/data/Themes";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

import { getOpenRouterMessage, getOpenRouterStatus, sendOpenRouterChat } from "@/lib/openrouter-helper";

export async function POST(req: NextRequest) {
    const {
        projectId,
        userInput,
        projectVisualDescription,
        theme
    } = await req.json();

    // Generate screen config first
    const configPrompt = `
You are a concise UI/UX designer for ${projectVisualDescription.includes('Mobile') ? 'mobile' : 'website'} apps.
Return ONLY valid JSON, no markdown, no comments, no explanation.

OUTPUT SHAPE:
{
  "screenName": string,
  "purpose": string,
  "layoutDescription": string
}

RULES:
- purpose MAX 80 chars
- layoutDescription MAX 120 chars
- Keep descriptions compact and implementation-focused.
- Use realistic sample data values.

USER REQUEST: ${userInput}
`;

    let configResult;
    try {
        configResult = await sendOpenRouterChat({
                model: "google/gemini-2.0-flash-001",
                maxCompletionTokens: 800,
                maxTokens: 800,
                temperature: 0.2,
                messages: [
                    {
                        role: 'system',
                        content: [{
                            type: 'text',
                            text: configPrompt
                        }]
                    }
                ],
                stream: false
        });
    } catch (error: any) {
        console.error("OpenRouter generate-new-screen config error:", error);
        const status = getOpenRouterStatus(error);
        const message = getOpenRouterMessage(error, "Failed to generate screen config.");
        return NextResponse.json({ error: message }, { status });
    }

    let rawConfig = configResult?.choices[0]?.message?.content as string;
    rawConfig = rawConfig
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

    if (!rawConfig.endsWith('}')) {
        console.error("AI config output truncated:", rawConfig?.slice(-200));
        return NextResponse.json(
            { error: "AI output truncated. Try again with a shorter prompt." },
            { status: 502 }
        );
    }

    let screenConfig;
    try {
        screenConfig = JSON.parse(rawConfig);
    } catch (error) {
        console.error("AI returned invalid JSON:", rawConfig);
        return NextResponse.json(
            { error: "AI returned invalid JSON" },
            { status: 400 }
        );
    }

    // Save screen config to database
    const screenId = randomUUID();
    const insertResult = await db.insert(ScreenConfigTable).values({
        projectId: projectId,
        screenId: screenId,
        screenName: screenConfig.screenName,
        purpose: screenConfig.purpose,
        screenDescription: screenConfig.layoutDescription,
    }).returning();

    // Now generate the HTML UI
    const themeKey = theme as keyof typeof THEMES;
    const themeObject = THEMES[themeKey] ?? THEMES["AURORA_INK"];
    const themeCss = themeToCssVars(themeObject);

    const uiPrompt = `
        screen name: ${screenConfig.screenName},
        screen purpose: ${screenConfig.purpose},
        screen description: ${screenConfig.layoutDescription},
        project visual description: ${projectVisualDescription},

        THEME CSS VARIABLES (use these exactly, do not override):
        ${themeCss}
    `;

    try {
        const uiResult = await sendOpenRouterChat({
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
                            text: uiPrompt
                        }]
                    }
                ],
                stream: false
        });

        let code = uiResult?.choices[0]?.message?.content as string;
        code = code
            .replace(/```html/g, '')
            .replace(/```/g, '')
            .trim();

        // Update the screen with the generated code
        await db.update(ScreenConfigTable)
            .set({ code: code })
            .where(eq(ScreenConfigTable.screenId, screenId));

        return NextResponse.json({
            ...insertResult[0],
            code: code
        });

    } catch (error: any) {
        console.error("Error generating screen UI:", error);
        const status = getOpenRouterStatus(error);
        const message = getOpenRouterMessage(error, "Failed to generate screen UI.");
        return NextResponse.json({ error: message }, { status });
    }
}