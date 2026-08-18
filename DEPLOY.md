# Deploying to Render

This app is ready to deploy — `render.yaml` is already configured. The only
parts that need your own hands are the ones that require your own GitHub and
Render accounts (nobody else's credentials should ever do this for you).

## 1. Get the code onto GitHub

If you don't already have this project in a repo:

1. Go to [github.com/new](https://github.com/new) and create a new repository
   (public or private both work — no secrets are committed to this codebase,
   they're all added as environment variables in step 3).
2. Upload this project's files. Easiest options:
   - **Drag-and-drop**: on the new repo's page, click "uploading an existing
     file" and drag the whole project folder in.
   - **Git CLI**, if you have it installed:
     ```
     cd social-gym-ai
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
     git push -u origin main
     ```

## 2. Create the Render web service

1. Go to [dashboard.render.com](https://dashboard.render.com) → **New** →
   **Web Service**.
2. Connect your GitHub account if you haven't already, then select the repo
   from step 1.
3. Render should auto-detect `render.yaml` and pre-fill the build/start
   commands (`npm install && npm run build` / `npm start`). If it doesn't,
   set those manually.

## 3. Add your environment variables

In the new service's **Environment** tab, add:

| Key | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your Claude API key from [console.anthropic.com](https://console.anthropic.com) |
| `REVENUECAT_WEBHOOK_SECRET` | Any long random string — paste the same value into RevenueCat's dashboard (Project Settings → Integrations → Webhooks → "Authorization header value") |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | The entire contents of your Firebase service account key file (Firebase console → Project settings → Service accounts → Generate new private key) |
| `APP_URL` | Fill in after your first deploy, once Render assigns your service's URL (shown at the top of the service's page, e.g. `https://social-gym-ai.onrender.com`) |

`GEMINI_API_KEY` is optional — only used as a fallback if `ANTHROPIC_API_KEY`
is ever unset.

## 4. Deploy

Render deploys automatically once the environment variables are saved. Watch
the **Logs** tab for `Server running on port ...` to confirm it booted
cleanly. If it fails, the logs will show which variable is missing or
malformed — the most common issue is pasting the Firebase JSON with line
breaks stripped; paste it exactly as downloaded, including the `\n`
characters inside `private_key`.

## 5. Point RevenueCat at your webhook

Once live, set your webhook URL in RevenueCat (Project Settings →
Integrations → Webhooks) to:

```
https://YOUR-SERVICE.onrender.com/webhooks/revenuecat
```

with the Authorization header value matching `REVENUECAT_WEBHOOK_SECRET`
above.

## Notes

- The free Render plan spins down after inactivity and takes ~30-60s to wake
  on the next request — fine for testing, worth upgrading to a paid plan
  ($7/mo Starter) before real users show up.
- Rotate any API key or service account key that was ever pasted into a chat,
  document, or anywhere outside your own password manager / cloud console —
  treat exposure as permanent once it happens, even if you trust where it was
  shared.
