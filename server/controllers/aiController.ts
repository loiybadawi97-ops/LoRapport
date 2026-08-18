import { Request, Response } from "express";
import { getAi, getAnthropic, withTimeout, PROMPT_INJECTION_DEFENSE } from "../services/aiService";
import { enforceUsage, getVerifiedIsPro, syncDailyUsage, UsageLimitError, DailyField } from "../services/usageService";
import xss from "xss";

// Helper to sanitize text
const sanitize = (text: any) => {
  if (typeof text !== 'string') return '';
  return xss(text);
};

function getUid(req: Request): string | undefined {
  return (req as any).user?.uid;
}

// Persona names that require Pro (must match DEFAULT_PERSONAS in
// src/components/ScenarioSelection.tsx). The client already hides these
// behind a lock icon for free users, but that's just UI — this is the check
// that actually matters, since nothing stops a request being sent directly.
const PREMIUM_PERSONAS = ["the skeptic", "distracted executive", "hostile client"];

function respondUsageError(res: Response, e: unknown): boolean {
  if (e instanceof UsageLimitError) {
    res.status(429).json({ error: e.message });
    return true;
  }
  return false;
}

export const chatHandler = async (req: Request, res: Response) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const scenarioTitle = sanitize(req.body.scenarioTitle);
    const scenarioDescription = sanitize(req.body.scenarioDescription);
    const userMessage = sanitize(req.body.userMessage);
    const persona = sanitize(req.body.persona);
    const history = Array.isArray(req.body.history) ? req.body.history.map((msg: any) => ({
      role: sanitize(msg.role),
      text: sanitize(msg.text)
    })) : [];

    // A new session's first turn always arrives with an empty history (see
    // ActiveSimulation.tsx's initChat). Only THAT call consumes one of the
    // free plan's daily chat sessions — follow-up messages within an already
    // -allowed conversation are free, matching the "3 sessions/day" UI copy.
    const isNewSession = history.length === 0;
    let isPro: boolean;
    if (isNewSession) {
      ({ isPro } = await enforceUsage(uid, "dailyChats"));
    } else {
      isPro = await getVerifiedIsPro(uid);
    }

    const requiresPro =
      (persona && PREMIUM_PERSONAS.includes(persona.toLowerCase())) ||
      scenarioTitle.toLowerCase() === "custom scenario";
    if (requiresPro && !isPro) {
      return res.status(403).json({ error: "This persona/scenario requires Social Gym Pro." });
    }

    const systemInstruction = `You are an AI conversation partner in a simulation for a user practicing their social skills.\nThe current scenario is: ${scenarioTitle}.\nContext/Details: ${scenarioDescription}.\n${persona ? `Your specific persona is: ${persona}. Adopt this persona fully and do not break character.` : `Respond naturally as a human would in this situation.`}\nKeep your responses conversational, realistic, and concise (1-3 sentences).\nCrucially, ALWAYS drive the interaction forward: ask relevant questions, react emotionally, or gently challenge the user to keep them engaged.${PROMPT_INJECTION_DEFENSE}`;

    const anthropic = getAnthropic();
    if (anthropic) {
      const messages = history.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text
      })) as any[];
      messages.push({ role: 'user', content: userMessage });

      const response = await withTimeout(anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: systemInstruction,
        messages
      }));
      const textBlock = response.content.find(c => c.type === 'text');
      res.json({ text: (textBlock as any)?.text || "I'm not sure what to say to that." });
    } else {
      const contents = history.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
      if (contents.length > 0 && contents[0].role === 'model') {
        contents.unshift({ role: 'user', parts: [{ text: "Hello, let's start the scenario." }] });
      }
      contents.push({ role: 'user', parts: [{ text: userMessage }] });

      const geminiModel = isPro ? "gemini-3.1-pro-preview" : "gemini-3.1-flash";

      const response = await withTimeout(getAi().models.generateContent({
        model: geminiModel,
        contents,
        config: { systemInstruction, temperature: 0.7 }
      }));
      res.json({ text: response.text || "I'm not sure what to say to that." });
    }
  } catch (e: any) {
    if (respondUsageError(res, e)) return;
    console.error(e);
    let errorMessage = "An error occurred with the AI service.";
    if (e.message && e.message.includes("429")) {
      errorMessage = "AI Quota exceeded. Please wait a moment and try again.";
    } else if (e.message) {
      errorMessage = e.message;
    }
    res.status(500).json({ error: errorMessage });
  }
};

export const analyzeMessageHandler = async (req: Request, res: Response) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const message = sanitize(req.body.message);
    const scenarioTitle = sanitize(req.body.scenarioTitle);
    const scenarioDescription = sanitize(req.body.scenarioDescription);
    const isPro = await getVerifiedIsPro(uid);

    const systemInstruction = `You are a world-class psychological communication coach, therapist, and empathy expert.\nAnalyze the user's message in the context of the scenario: "${scenarioTitle}" (${scenarioDescription}).\nProvide a score from 1-10 for Confidence, Humor, and Engagement.\nProvide a short actionable advice (max 15 words) focusing on emotional intelligence or psychological impact.\nProvide one improved, more charismatic and emotionally intelligent example of what they could have said.\nReturn ONLY a JSON object with this structure:\n{\n  "confidence": number,\n  "humor": number,\n  "engagement": number,\n  "advice": string,\n  "improvedExample": string\n}${PROMPT_INJECTION_DEFENSE}`;

    const anthropic = getAnthropic();
    if (anthropic) {
      const response = await withTimeout(anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: systemInstruction,
        messages: [{ role: 'user', content: message }]
      }));
      const textBlock = response.content.find(c => c.type === 'text');
      res.json(JSON.parse((textBlock as any)?.text || "{}"));
    } else {
      const geminiModel = isPro ? "gemini-3.1-pro-preview" : "gemini-3.1-flash";

      const response = await withTimeout(getAi().models.generateContent({
        model: geminiModel,
        contents: message,
        config: { systemInstruction, responseMimeType: "application/json", temperature: 0.3 }
      }));
      res.json(JSON.parse(response.text || "{}"));
    }
  } catch (e: any) {
    console.error(e);
    res.json({ confidence: 5, humor: 5, engagement: 5, advice: "Focus on active listening and empathy.", improvedExample: sanitize(req.body?.message) || "" });
  }
};

export const improveReplyHandler = async (req: Request, res: Response) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const draft = sanitize(req.body.draft);
    const isPro = await getVerifiedIsPro(uid);
    const systemInstruction = `You are a master psychological communication coach and human connection expert.\nThe user has provided a draft reply. Your job is to improve it to make it more confident, engaging, and emotionally intelligent. Focus on active empathy, removing defensive language, and projecting calm assertiveness.\nReturn ONLY a JSON object with this structure:\n{\n  "improved": string,\n  "advice": string\n}${PROMPT_INJECTION_DEFENSE}`;

    const anthropic = getAnthropic();
    if (anthropic) {
      const response = await withTimeout(anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: systemInstruction,
        messages: [{ role: 'user', content: draft }]
      }));
      const textBlock = response.content.find(c => c.type === 'text');
      res.json(JSON.parse((textBlock as any)?.text || "{}"));
    } else {
      const geminiModel = isPro ? "gemini-3.1-pro-preview" : "gemini-3.1-flash";

      const response = await withTimeout(getAi().models.generateContent({
        model: geminiModel,
        contents: draft,
        config: { systemInstruction, responseMimeType: "application/json", temperature: 0.7 }
      }));
      res.json(JSON.parse(response.text || "{}"));
    }
  } catch (e: any) {
    console.error(e);
    res.json({ improved: sanitize(req.body?.draft) || "", advice: "Try to be more direct, warm, and confident." });
  }
};

export const analyzeAudioHandler = async (req: Request, res: Response) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const base64Audio = req.body.base64Audio; // not sanitized as it's base64
    const mimeType = sanitize(req.body.mimeType);
    const context = sanitize(req.body.context);

    if (!base64Audio || typeof base64Audio !== 'string') {
      return res.status(400).json({ error: "Invalid audio format" });
    }

    // Voice Analyzer + Voice Exercises both count against "dailyExercises";
    // Speaking Challenges pass usageType: 'challenge' to count against its
    // own separate "dailyChallenges" bucket instead (see geminiService.ts).
    const field: DailyField = req.body.usageType === "challenge" ? "dailyChallenges" : "dailyExercises";
    const { isPro } = await enforceUsage(uid, field);

    const systemInstruction = `You are an incredibly empathetic master speech coach and vocal therapist.\nAnalyze the provided audio recording.\n1. Transcribe the audio exactly as spoken, including filler words.\n2. Provide deeply empathetic, highly constructive feedback. Focus on their vocal resonance (is it supported nicely?), pacing, emotional warmth, and articulation. Offer specific psychological and physiological advice (e.g., "breathe deeper into your stomach to reduce shakiness"). Frame feedback to build their self-appreciation and confidence in their unique voice.\n3. Give an overall score out of 100 for their delivery, scoring generously for effort and vulnerability.\n${context ? `Context for this speech: ${context}` : ''}\nReturn ONLY a JSON object with this structure:\n{\n  "transcript": string,\n  "feedback": string,\n  "score": number\n}${PROMPT_INJECTION_DEFENSE}`;

    const geminiModel = isPro ? "gemini-3.1-pro-preview" : "gemini-3.1-flash";

    const response = await withTimeout(getAi().models.generateContent({
      model: geminiModel,
      contents: {
        parts: [
          { inlineData: { data: base64Audio, mimeType: mimeType || "audio/webm" } },
          { text: "Analyze this audio." }
        ]
      },
      config: { systemInstruction, responseMimeType: "application/json", temperature: 0.2 }
    }));
    res.json(JSON.parse(response.text || "{}"));
  } catch (e: any) {
    if (respondUsageError(res, e)) return;
    console.error(e);
    res.json({ transcript: "Could not transcribe.", feedback: "Audio analysis failed. Please try again. Make sure you have GEMINI_API_KEY set since Claude doesn't support audio yet.", score: 0 });
  }
};

export const generateLibraryModuleHandler = async (req: Request, res: Response) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const topic = sanitize(req.body.topic);
    const isPro = await getVerifiedIsPro(uid);

    const systemInstruction = `You are a master social dynamics coach.
The user wants to learn about: "${topic}".
Generate a structured learning module with the following JSON format:
{
  "title": string,
  "description": string, // A short engaging intro
  "points": string[], // 3-4 actionable tips or examples
  "challenge": {
    "prompt": string, // A short scenario asking them to apply the skill
    "expectedKeyword": string // One word they must include in their response to pass
  }
}
Return ONLY a JSON object.${PROMPT_INJECTION_DEFENSE}`;

    const anthropic = getAnthropic();
    if (anthropic) {
      const response = await withTimeout(anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: systemInstruction,
        messages: [{ role: 'user', content: topic }]
      }));
      const textBlock = response.content.find(c => c.type === 'text');
      res.json(JSON.parse((textBlock as any)?.text || "{}"));
    } else {
      const geminiModel = isPro ? "gemini-3.1-pro-preview" : "gemini-3.1-flash";

      const response = await withTimeout(getAi().models.generateContent({
        model: geminiModel,
        contents: topic,
        config: { systemInstruction, responseMimeType: "application/json", temperature: 0.7 }
      }));
      res.json(JSON.parse(response.text || "{}"));
    }
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: "Failed to generate module." });
  }
};

export const generateChallengeHandler = async (req: Request, res: Response) => {
  try {
    const uid = getUid(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const context = sanitize(req.body.context) || "general social skills";
    const type = sanitize(req.body.type) || "speaking"; // "speaking" or "voice"
    const isPro = await getVerifiedIsPro(uid);

    const systemInstruction = `You are a creative social skills coach.
Generate a random, challenging, and specific ${type} exercise for the user focused on: "${context}".
Return ONLY a JSON object with this structure:
{
  "title": string, // Catchy title for the challenge
  "description": string, // Detailed scenario
  "goal": string, // What the user needs to achieve
  "timeLimit": number // Suggested time limit in seconds (30-120)
}${PROMPT_INJECTION_DEFENSE}`;

    const anthropic = getAnthropic();
    if (anthropic) {
      const response = await withTimeout(anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: systemInstruction,
        messages: [{ role: 'user', content: "Generate a challenge." }]
      }));
      const textBlock = response.content.find(c => c.type === 'text');
      res.json(JSON.parse((textBlock as any)?.text || "{}"));
    } else {
      const geminiModel = isPro ? "gemini-3.1-pro-preview" : "gemini-3.1-flash";

      const response = await withTimeout(getAi().models.generateContent({
        model: geminiModel,
        contents: "Generate a challenge.",
        config: { systemInstruction, responseMimeType: "application/json", temperature: 0.9 }
      }));
      res.json(JSON.parse(response.text || "{}"));
    }
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: "Failed to generate challenge." });
  }
};

export const syncUsageHandler = async (req: Request, res: Response) => {
  const uid = getUid(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  try {
    await syncDailyUsage(uid);
    res.json({ ok: true });
  } catch (e: any) {
    console.error("syncDailyUsage failed:", e);
    res.status(500).json({ error: "Failed to sync usage." });
  }
};
