# LinguaQuest

**Learn a language. Level up your life.**

A responsive React + TypeScript language-learning MVP with an original visual identity, English lessons for Hindi speakers, interactive question flow, immediate answer feedback, XP, saved progress, vocabulary notebook, achievements, weekly activity, and a sample league.

## Included in this MVP

- Mobile-first responsive dashboard and mobile navigation
- Dark/light theme toggle
- Three sample lessons with multiple-choice, fill-in, and word-order exercises
- Correct/incorrect feedback with explanations
- XP, course completion, lesson review, and progress stored in browser local storage
- Vocabulary notebook with difficulty labels
- Profile statistics and achievements
- Sample leaderboard (demo data, not shared live rankings)
- Supabase Auth UI integration, activated after adding environment keys
- Supabase SQL schema with row-level security policies and a profile trigger

## Run locally

Requires Node.js 20 or later.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Enable Supabase authentication

1. Create a project at https://supabase.com/
2. Open **Project Settings → API** and copy the project URL and publishable/anon key.
3. Copy `.env.example` to `.env.local` and fill in the values.
4. In Supabase **SQL Editor**, run `supabase/schema.sql`.
5. Restart the Vite development server.

The browser key must be the Supabase publishable/anon key, never a service-role secret. RLS policies restrict the included user tables to the authenticated owner.

### Important current limitation

The demo's lesson progress and vocabulary are stored in local storage so the MVP works immediately without setup. The included SQL schema is ready for cloud storage, but lesson completion/vocabulary writes are not yet wired to those tables. To ship a production app, wire progress writes through server-validated database functions or edge functions, implement cloud sync, add course content management, and test RLS/auth flows.

## Build

```bash
npm run build
npm run preview
```

## Suggested next steps

- Add native speech/audio assets and pronunciation scoring
- Implement spaced-repetition scheduling
- Sync progress and vocabulary to Supabase
- Replace demo leaderboard with a privacy-safe server-backed ranking
- Add a PWA manifest/service worker and deployment pipeline
- Add accessibility and end-to-end tests

## Build an Android APK from a phone (cloud build)

This project includes a GitHub Actions workflow at `.github/workflows/android-apk.yml`. It builds a **debug APK** in the cloud, so you do not need Android Studio or a computer. A debug APK is suitable for testing on your own device, not for publishing to Google Play.

1. Create a GitHub repository and upload the project files so `package.json`, `src/`, `capacitor.config.ts`, and `.github/workflows/android-apk.yml` are at the repository root.
2. Commit the files to the `main` or `master` branch.
3. Open the repository's **Actions** tab and choose **Build LinguaQuest Android APK**. Tap **Run workflow** if it has not started automatically after your commit.
4. Wait for the workflow to finish successfully. Open the completed workflow run and find **Artifacts** near the bottom.
5. Download `LinguaQuest-debug-APK`, extract the downloaded artifact if needed, then tap `app-debug.apk` to install it. Android may ask you to allow installation from that browser or file manager; only proceed for the APK you built from your own repository.

If the workflow fails, open the failed run and read the first red step. The build log is the best way to identify the issue. Do not put Supabase service-role keys or other secrets in the repository. The current sample lesson progress is stored locally on the device; cloud progress syncing still needs implementation.
