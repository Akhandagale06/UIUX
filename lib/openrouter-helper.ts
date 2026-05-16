import { openrouter } from "@/config/openroute";

export function getOpenRouterStatus(error: any) {
    if (!error) return 500;
    return error?.statusCode || error?.status || error?.response?.status || error?.data?.error?.code || 500;
}

export function getOpenRouterMessage(error: any, fallback: string) {
    if (!error) return fallback;
    const status = getOpenRouterStatus(error);
    if (status === 402) {
        return "OpenRouter credits exhausted. Please top up your credits.";
    }
    if (status === 429) {
        return "Model is temporarily rate-limited. Please retry in a few moments or use your own API key.";
    }
    return error?.message || error?.response?.data?.error?.message || fallback;
}

export async function sendOpenRouterChat(chatRequest: any) {
    const maxRetries = 3;
    const primaryModel = chatRequest.model;
    const fallbackModel = "google/gemini-2.0-flash-lite-001"; // Highly available fallback

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await openrouter.chat.send({ chatRequest });
        } catch (error: any) {
            const status = getOpenRouterStatus(error);
            // Retry on rate limits (429) with exponential backoff
            if (status === 429 && attempt < maxRetries) {
                const backoffMs = Math.pow(2, attempt) * 1500; // 3s, 6s
                console.warn(`OpenRouter 429 on ${chatRequest.model}: Retrying attempt ${attempt + 1} after ${backoffMs}ms...`);
                await new Promise((res) => setTimeout(res, backoffMs));
                continue;
            }

            // If still 429 after retries and we haven't tried the fallback yet
            if (status === 429 && chatRequest.model !== fallbackModel) {
                console.warn(`Primary model ${primaryModel} rate limited. Trying fallback model ${fallbackModel}...`);
                return await openrouter.chat.send({ 
                    chatRequest: { ...chatRequest, model: fallbackModel } 
                });
            }

            throw error;
        }
    }
}
