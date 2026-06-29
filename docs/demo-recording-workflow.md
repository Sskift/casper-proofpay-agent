# Demo Recording Workflow

This document explains how to record or refresh the ProofPay Agent demo video without leaving temporary files on the Desktop or committing generated artifacts by accident.

The generated local video path is:

```text
docs/demo/proofpay-agent-demo.mp4
```

This MP4 is intentionally ignored by Git. Host the final video through the Vercel video URL used by DoraHacks instead of linking to a GitHub MP4.

The narration source path is:

```text
docs/demo/proofpay-agent-demo-narration.txt
```

Keep the narration path stable so reviewers can see exactly what was recorded. Redeploy the Vercel-hosted video and update the DoraHacks video URL whenever the final MP4 changes.

## When To Re-Record

Re-record the demo only when one of these changes is true:

- The dashboard flow changes materially.
- A new feature becomes part of the core judge story.
- Casper transaction proof, named key, URef, or replay instructions change.
- The old video no longer matches the live demo.
- The current narration undersells the product compared with competitors.

Do not re-record just because a small README or docs change landed.

## Artifact Policy

Use local temporary folders for raw captures and generated media:

```text
.local/demo-recording/
```

Do not create new Desktop folders such as:

```text
~/Desktop/proofpay-submission-assets
~/Desktop/proofpay-submission-assets-v2
~/Desktop/proofpay-submission-assets-v3
```

Do not commit:

- Raw `.mov` screen recordings.
- Intermediate `.webm`, `.m4a`, `.aiff`, `.wav`, `.ass`, `.srt`, `.ffconcat`, or frame folders.
- API keys, Coze PATs, OpenAI keys, Casper private keys, cookies, or browser profiles.

Only commit:

- `docs/demo/proofpay-agent-demo-narration.txt`
- Any intentional docs updates that explain the new demo.

Keep `docs/demo/proofpay-agent-demo.mp4` locally as the ignored render source for the Vercel-hosted DoraHacks video asset.

## Preflight

Start from a clean repo:

```bash
git status --short
```

Install dependencies if the local cleanup removed them:

```bash
npm install
```

Run the product checks:

```bash
npm test
npm run typecheck
npm run build
npm run submission:check
```

Create the local working folder:

```bash
mkdir -p .local/demo-recording
```

Run the dashboard locally for full API behavior:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open:

```text
http://127.0.0.1:3000
```

For a pure public-demo recording, use:

```text
https://sskift.github.io/casper-proofpay-agent/
```

Use the local dashboard when recording API or evidence-intake behavior. Use GitHub Pages when recording the public static judge experience.

## Browser Setup

Use a consistent capture environment:

- 1920 x 1080 viewport or display capture.
- Browser zoom at 100%.
- Bookmarks bar hidden.
- No notification banners.
- No unrelated tabs visible.
- Cursor visible.
- Light/dark mode unchanged from the product default.
- Avoid showing local secrets, browser profiles, terminal history, wallets, or private keys.

The demo should feel like a live product, not a slide deck:

- Move between sections through the left navigation.
- Scroll through content instead of hard cutting every scene.
- Hover or focus charts when useful.
- Switch tabs inside sections.
- Switch scenarios from clean release to hold and reject.
- Open or highlight Casper proof links if they are part of the new iteration.
- Keep captions compact and out of the main UI.

## Storyboard

Use `docs/demo-script.md` as the canonical structure. The current recommended flow is:

1. Product thesis: show the cockpit, Judge walkthrough, and the evidence-to-payment attestation positioning.
2. Trust Chain: show evidence intake, API-backed assessment, settlement actions, and Casper verifier checks.
3. Agent Commerce: click `Run commerce checks` and show x402 proof review, MCP settlement instruction, and settlement adapter passing on the current host.
4. Decision paths: switch clean release, hold for finance, and reject duplicate.
5. Evidence room: show documents, claims, timeline, reasons, and follow-up actions.
6. Casper proof: show seeded Testnet transaction, named key, stored URef, public key, replay command, and copy controls.
7. Fresh real case: show the recorded fresh Casper Testnet transaction `d285146cbf4db68b63ae20ca5c8b9d3e86f6626f254e54f71512553723c8a2ca` and its verified API path.
8. CSPR.live verification: briefly open or show the explorer page for the fresh transaction.
9. Audit Dossier: show policy trace cards, verification chain, copy-ready JSON, and reviewer checklist.
10. Close: restate the trust chain: evidence, agent decision, human release control, Casper attestation.

Target length:

```text
140 to 160 seconds
```

## Narration

Update the narration file before generating voice:

```text
docs/demo/proofpay-agent-demo-narration.txt
```

Voice requirements:

- Warm, confident, product-demo tone.
- Not robotic or monotone.
- No overlong pauses.
- No claims that ProofPay custodies real funds.
- Say "Casper Testnet attestation" rather than "production settlement" unless production settlement has actually been built.

Use Coze or another human-quality AI voice tool for the final submission. macOS `say` is acceptable only as a timing placeholder and should not be used for the final DoraHacks upload. Keep credentials out of the repo:

```bash
export COZE_PAT='paste-token-in-shell-only'
```

Never write PATs into files, shell history snippets, README, docs, screenshots, or videos.

Save generated voiceover locally:

```text
.local/demo-recording/voiceover.m4a
```

Normalize the voiceover with ffmpeg:

```bash
ffmpeg -y \
  -i .local/demo-recording/voiceover.m4a \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11" \
  .local/demo-recording/voiceover-loud.m4a
```

## Screen Capture

Recommended capture tools:

- OBS Studio for reliable 1080p recording.
- QuickTime Player for simple manual capture.
- Browser automation only if the product flow is stable enough to avoid mechanical-looking cuts.

Save the raw recording to:

```text
.local/demo-recording/screen.mov
```

Recording checklist:

- First frame shows ProofPay, not a blank loading screen.
- The cursor visibly clicks navigation and scenario controls.
- The page scrolls smoothly through at least three major sections.
- The Casper proof section is readable.
- The Dossier JSON or trace is shown briefly, not for the entire video.
- Hold and reject paths are visibly different from clean release.
- No personal notifications or credentials appear.

## Captions

Use compact lower-third captions. Avoid giant black captions centered over the product.

If using ASS captions, keep them in:

```text
.local/demo-recording/captions.ass
```

Suggested caption style:

```text
Font size: 30 to 38
Position: bottom safe area
Background: semi-transparent dark strip or soft shadow
Line length: one short sentence
```

If the video already has clear voiceover, captions should support key phrases rather than transcribe every word.

## Final Assembly

Create the final MP4:

```bash
ffmpeg -y \
  -i .local/demo-recording/screen.mov \
  -i .local/demo-recording/voiceover-loud.m4a \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -map 0:v:0 \
  -map 1:a:0 \
  -shortest \
  -c:v libx264 \
  -preset medium \
  -crf 18 \
  -pix_fmt yuv420p \
  -c:a aac \
  -b:a 192k \
  docs/demo/proofpay-agent-demo.mp4
```

If adding ASS captions:

```bash
ffmpeg -y \
  -i .local/demo-recording/screen.mov \
  -i .local/demo-recording/voiceover-loud.m4a \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,subtitles=.local/demo-recording/captions.ass" \
  -map 0:v:0 \
  -map 1:a:0 \
  -shortest \
  -c:v libx264 \
  -preset medium \
  -crf 18 \
  -pix_fmt yuv420p \
  -c:a aac \
  -b:a 192k \
  docs/demo/proofpay-agent-demo.mp4
```

## Quality Review

Inspect the final video before committing:

```bash
ffprobe -v error \
  -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate \
  -show_entries format=duration,size \
  -of default=noprint_wrappers=1 \
  docs/demo/proofpay-agent-demo.mp4
```

Expected:

- Resolution: 1920 x 1080.
- Duration: 115 to 150 seconds.
- Audio is audible and not clipped.
- Text is readable.
- Navigation and scenario switching are visible.
- Captions do not cover charts, hashes, or primary controls.
- The demo includes dynamic movement, not static slides.

Then open the video locally and watch it end to end.

## Commit And Cleanup

After rendering the final demo video:

```bash
git status --short
npm run submission:check
```

Only expected committed changes:

```text
docs/demo/proofpay-agent-demo-narration.txt
docs/demo-script.md
docs/demo-recording-workflow.md
```

The rendered MP4 should remain ignored locally. Deploy the reviewed MP4 to the Vercel video host and keep DoraHacks pointed at that public MP4 URL.

Clean local recording artifacts:

```bash
rm -rf .local/demo-recording
```

Confirm cleanup:

```bash
find .local -maxdepth 3 -type f 2>/dev/null
git status --short
```

Deploy the rendered MP4 to the Vercel video host after reviewing it locally. Update the DoraHacks video URL whenever the project story, voiceover, or real-case walkthrough changes.
