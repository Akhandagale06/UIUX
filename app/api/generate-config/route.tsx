import { db } from "@/config/db";
import { openrouter } from "@/config/openroute";
import { ProjectTable, ScreenConfigTable } from "@/config/schema";
import { APP_LAYOUT_CONFIG_PROMPT } from "@/data/Prompt";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { getOpenRouterMessage, getOpenRouterStatus, sendOpenRouterChat } from "@/lib/openrouter-helper";

export async function POST(req: NextRequest) {
    const { userInput, deviceType, projectId } = await req.json();

    let aiResult;
    try {
        aiResult = await sendOpenRouterChat({
            model: "google/gemini-2.0-flash-001",
            maxCompletionTokens: 600,
            maxTokens: 600,
            temperature: 0.2,
            messages: [
                {
                    role: 'system',
                    content: [{
                        type: 'text',
                        text: APP_LAYOUT_CONFIG_PROMPT.replace('{deviceType}', deviceType)
                    }]
                },
                {
                    role: "user",
                    content: userInput
                }
            ],
            stream: false
        });
    } catch (error: any) {
        console.error("OpenRouter generate-config error:", error);
        const status = getOpenRouterStatus(error);
        const message = getOpenRouterMessage(error, "Failed to generate project config.");
        // If rate-limited, give a helpful hint to add your own OpenRouter key
        if (status === 429) {
            return NextResponse.json({ error: `${message} Try adding your own OpenRouter key in environment variable OPENROUTER_API_KEY or retry shortly.` }, { status });
        }
        return NextResponse.json({ error: message }, { status });
    }

    // ✅ Strip markdown code blocks before parsing
    let rawContent = aiResult?.choices[0]?.message?.content as string;
    rawContent = rawContent
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

    if (!rawContent.endsWith('}')) {
        console.error("AI output truncated or malformed:", rawContent?.slice(-200));
        return NextResponse.json(
            { error: "AI output truncated. Try again with a shorter prompt or increase max tokens." },
            { status: 502 }
        );
    }

    let JSONAiResult;
    try {
        JSONAiResult = JSON.parse(rawContent);
    } catch (error) {
        console.error("AI returned invalid JSON:", rawContent);
        return NextResponse.json(
            { error: "AI returned invalid JSON" },
            { status: 400 }
        );
    }

    if (JSONAiResult) {
        // ✅ Now saves projectVisualDescription + theme correctly
        await db.update(ProjectTable).set({
            projectVisualDescription: JSONAiResult?.projectVisualDescription,
            projectName: JSONAiResult?.projectName,
            theme: JSONAiResult?.theme
        }).where(eq(ProjectTable.projectId, projectId as string));

        if (JSONAiResult.screens && JSONAiResult.screens.length > 0) {
            await Promise.all(
                JSONAiResult.screens.map(async (screen: any) => {
                    await db.insert(ScreenConfigTable).values({
                        projectId: projectId,
                        purpose: screen?.purpose,
                        screenDescription: screen?.layoutDescription,
                        screenId: screen?.id ?? randomUUID(), // ✅ fallback if AI skips id
                        screenName: screen?.name
                    });
                })
            );
        }
        return NextResponse.json(JSONAiResult);
    } else {
        return NextResponse.json(
            { msg: "AI returned empty response" },
            { status: 400 }
        );
    }
}