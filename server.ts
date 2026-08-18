import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import * as admin from "firebase-admin";
import { cert, applicationDefault } from "firebase-admin/app";
import rateLimit from "express-rate-limit";

// Initialize Firebase Admin.
//
// In Google-hosted environments (AI Studio, Cloud Run) Application Default
// Credentials are provided automatically via the metadata server — no key
// file needed there. Everywhere else (local dev, this sandbox, most other
// hosts) ADC isn't available, so credentials come from one of, in order:
//   1. FIREBASE_SERVICE_ACCOUNT_JSON — the full service account JSON as a
//      single env var value. Most portable option: works on any host that
//      supports env vars (Render, Railway, Fly, Vercel, etc.) with nothing
//      committed to git and no reliance on a host's file-mount feature.
//   2. FIREBASE_SERVICE_ACCOUNT_PATH — path to a mounted key file, for hosts
//      with a "secret files" feature (e.g. Render mounts these under
//      /etc/secrets/<filename>). Defaults to ./firebase-service-account.json
//      for local dev — see .env.example for how to generate your own from
//      the Firebase console (Project settings > Service accounts > Generate
//      new private key). That default path is never committed (.gitignore).
//   3. Application Default Credentials, for Google-hosted environments.
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  || path.join(process.cwd(), "firebase-service-account.json");
const firebaseCredential = serviceAccountJson
  ? cert(JSON.parse(serviceAccountJson))
  : fs.existsSync(serviceAccountPath)
  ? cert(JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8")))
  : applicationDefault();

admin.initializeApp({
  credential: firebaseCredential,
  projectId: "social-gym-version-2"
});

import { verifyToken } from "./src/server/middleware/auth";
import {
  chatHandler,
  analyzeMessageHandler,
  improveReplyHandler,
  analyzeAudioHandler,
  generateLibraryModuleHandler,
  generateChallengeHandler,
  syncUsageHandler
} from "./src/server/controllers/aiController";
import { revenueCatWebhookHandler } from "./src/server/controllers/webhookController";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Rate Limiting Config
  // 100 requests per 15 minutes globally for APIs to prevent DoS
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100,
    message: { error: "Too many requests from this IP, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Strict rate limiting for expensive LLM endpoints (e.g. 20 reqs / 15 mins)
  const llmLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 20,
    message: { error: "AI Quota Exceeded. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Strict rate limiting for Audio LLM endpoints (e.g. 10 reqs / 15 mins)
  const audioLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Audio AI Quota Exceeded. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply general API rate limiter to all /api routes
  app.use("/api/", apiLimiter);

  // Default JSON payload limit reduced to 1MB to prevent Memory Exhaustion DoS
  app.use(express.json({ limit: "1mb" }));

  // Routes
  app.post("/api/gemini/chat", llmLimiter, verifyToken, chatHandler);
  app.post("/api/gemini/analyze-message", llmLimiter, verifyToken, analyzeMessageHandler);
  app.post("/api/gemini/improve-reply", llmLimiter, verifyToken, improveReplyHandler);
  app.post("/api/gemini/generate-library", llmLimiter, verifyToken, generateLibraryModuleHandler);
  app.post("/api/gemini/generate-challenge", llmLimiter, verifyToken, generateChallengeHandler);

  // Non-consuming daily-usage reset check, called once on app load (see
  // Dashboard.tsx) so "Daily Limits" shows fresh counts immediately on a new
  // day instead of waiting for the first AI call to trigger the reset.
  app.post("/api/usage/sync", verifyToken, syncUsageHandler);

  // Increase payload limit just for the audio upload endpoint to 10MB
  app.post("/api/gemini/analyze-audio", express.json({ limit: "10mb" }), audioLimiter, verifyToken, analyzeAudioHandler);

  // RevenueCat webhook: server-to-server traffic authenticated by a shared secret
  // (checked inside the handler), not a per-user Firebase token — deliberately kept
  // outside the /api/ prefix so it isn't subject to the per-IP apiLimiter above, and
  // given its own generous limiter instead.
  const webhookLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.post("/webhooks/revenuecat", webhookLimiter, revenueCatWebhookHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
