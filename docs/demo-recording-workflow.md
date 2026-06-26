# Demo Recording Workflow

This document explains how to record or refresh the ProofPay Agent demo video without leaving temporary files on the Desktop or committing generated artifacts by accident.

The final public video path is:

```text
docs/demo/proofpay-agent-demo.mp4
```

The narration source path is:

```text
docs/demo/proofpay-agent-demo-narration.txt
```

Keep those paths stable so the DoraHacks BUIDL video link does not need to change after updates.

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

- `docs/demo/proofpay-agent-demo.mp4`
- `docs/demo/proofpay-agent-demo-narration.txt`
- Any intentional docs updates that explain the new demo.

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

1. Cockpit: show readiness, risk, confidence, evidence coverage, and active sidebar state.
2. Charts: show risk, cold-chain telemetry, escrow cashflow, and evidence coverage.
3. Trust: show evidence intake, settlement actions, and Casper verifier checks.
4. Evidence: show documents, extracted claims, timeline, and reviewer actions.
5. Casper: show Testnet transaction, named key, stored URef, public key, and replay command.
6. Dossier: show policy trace cards, verification chain, copy-ready JSON, and reviewer checklist.
7. Hold scenario: show amount mismatch and human finance review.
8. Reject scenario: show duplicate invoice block and fraud escalation.
9. Fresh real case: show `examples/video-integrated-cold-chain-real-case.json`, prepare the new payload, and, when approved, submit a new Casper Testnet transaction.
10. Close: restate the trust chain: evidence, agent decision, human release control, Casper attestation.

Target length:

```text
115 to 150 seconds
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

Coze or another AI voice tool may be used. Keep credentials out of the repo:

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

After replacing the final demo video:

```bash
git status --short
npm run submission:check
```

Only expected committed changes:

```text
docs/demo/proofpay-agent-demo.mp4
docs/demo/proofpay-agent-demo-narration.txt
docs/demo-script.md
docs/demo-recording-workflow.md
```

Clean local recording artifacts:

```bash
rm -rf .local/demo-recording
```

Confirm cleanup:

```bash
find .local -maxdepth 3 -type f 2>/dev/null
git status --short
```

If the video file path remains `docs/demo/proofpay-agent-demo.mp4`, the DoraHacks video URL does not need to change. Update DoraHacks only if the project description, live demo URL, or repository URL changes.
