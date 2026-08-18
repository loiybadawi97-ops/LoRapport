import { auth } from "../firebase";

async function getAuthHeaders() {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User must be logged in to use the AI services.");
    }
    const token = await user.getIdToken();
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

/** Thrown when the server rejects a request because a free-tier daily limit was hit (HTTP 429). */
export class DailyLimitError extends Error {}

/** Reads a JSON error body (if any) regardless of status, and throws a typed error on failure. */
async function parseOrThrow(response: Response): Promise<any> {
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        const message = data?.error || `Request failed (${response.status})`;
        if (response.status === 429) throw new DailyLimitError(message);
        throw new Error(message);
    }
    if (data?.error) throw new Error("Server Error: " + data.error);
    return data;
}

export async function generateChatResponse(scenarioTitle: string, scenarioDescription: string, history: {role: string, text: string}[], userMessage: string, persona?: string, isPro: boolean = false) {
    const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ scenarioTitle, scenarioDescription, history, userMessage, persona, isPro })
    });
    const data = await parseOrThrow(response);
    return data.text || "I'm not sure what to say to that.";
}

export async function analyzeMessage(message: string, scenarioTitle: string, scenarioDescription: string, isPro: boolean = false) {
    try {
        const response = await fetch("/api/gemini/analyze-message", {
            method: "POST",
            headers: await getAuthHeaders(),
            body: JSON.stringify({ message, scenarioTitle, scenarioDescription, isPro })
        });

        if (!response.ok) throw new Error("Server error");
        return await response.json();
    } catch (e) {
        console.error("Failed to analyze message", e);
        return {
            confidence: 5, humor: 5, engagement: 5, advice: "Focus on active listening and empathy.", improvedExample: message
        };
    }
}

export async function improveReply(draft: string, isPro: boolean = false) {
    try {
        const response = await fetch("/api/gemini/improve-reply", {
            method: "POST",
            headers: await getAuthHeaders(),
            body: JSON.stringify({ draft, isPro })
        });

        if (!response.ok) throw new Error("Server error");
        return await response.json();
    } catch (e) {
        console.error("Failed to improve reply", e);
        return {
            improved: draft,
            advice: "Try to be more direct, warm, and confident."
        };
    }
}

/**
 * usageType picks which daily counter the server checks: 'exercise' (Voice
 * Analyzer + Voice Exercises) or 'challenge' (Speaking Challenges). Throws
 * DailyLimitError on a 429 so callers can route to the paywall instead of
 * showing a generic "analysis failed" result.
 */
export async function analyzeAudio(base64Audio: string, mimeType: string, context?: string, isPro: boolean = false, usageType: 'exercise' | 'challenge' = 'exercise') {
    const response = await fetch("/api/gemini/analyze-audio", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ base64Audio, mimeType, context, isPro, usageType })
    });

    if (response.status === 429) {
        const data = await response.json().catch(() => null);
        throw new DailyLimitError(data?.error || "Daily limit reached.");
    }

    try {
        if (!response.ok) throw new Error("Server error");
        return await response.json();
    } catch (e) {
        console.error("Failed to analyze audio", e);
        return {
            transcript: "Could not transcribe.",
            feedback: "Audio analysis failed. Please try again.",
            score: 0
        };
    }
}

export async function generateLibraryModule(topic: string, isPro: boolean = false) {
    try {
        const response = await fetch("/api/gemini/generate-library", {
            method: "POST",
            headers: await getAuthHeaders(),
            body: JSON.stringify({ topic, isPro })
        });

        if (!response.ok) throw new Error("Server error");
        return await response.json();
    } catch (e) {
        console.error("Failed to generate library module", e);
        return null;
    }
}

export async function generateChallenge(context: string, type: string = "speaking", isPro: boolean = false) {
    try {
        const response = await fetch("/api/gemini/generate-challenge", {
            method: "POST",
            headers: await getAuthHeaders(),
            body: JSON.stringify({ context, type, isPro })
        });

        if (!response.ok) throw new Error("Server error");
        return await response.json();
    } catch (e) {
        console.error("Failed to generate challenge", e);
        return null;
    }
}

/** Fire-and-forget: resets today's usage counters server-side if a new day has
 * started, so the Dashboard shows fresh numbers without waiting for an AI call. */
export async function syncDailyUsage(): Promise<void> {
    try {
        const response = await fetch("/api/usage/sync", {
            method: "POST",
            headers: await getAuthHeaders(),
        });
        if (!response.ok) console.error("Failed to sync daily usage:", await response.text());
    } catch (e) {
        console.error("Failed to sync daily usage", e);
    }
}
