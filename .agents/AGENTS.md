# Project Rules: Spelling & Math Quest

These rules define the design patterns, interface rules, and custom mechanics of the Spelling & Math Quest workspace.

## 🛠️ 1. Architecture Invariants
* **Single Page Application**: The entire functional application is contained within the root `index.html` file using vanilla HTML, CSS, and script tags.
* **Legacy directories**: The `src/` folder is legacy template code and is NOT used. Do not link to or import files from `src/`.
* **ESLint Configuration**: ESLint ignores `src/` globally (set in `eslint.config.js`). Do not remove this exclusion as it will break lint builds.

## 🎨 2. Design Aesthetics & Layout
* **Theme**: Deep dark cosmic blue/violet gradient backgrounds with glowing gold (`--gold`) accents (Harry Potter and Treasure Island adventure style).
* **Viewport**: The layout must fit cleanly on screen (viewport height fits) without horizontal scrollbars on glass cards or containers.
* **Sound Systems**: High-quality audio effects (correct chime, wrong buzzer, success fanfare) are synthesized natively using Web Audio API via `playAudioSynth()`.

## 🎙️ 3. Spelling Quest Mechanics
* **Voice Dictation**: Uses standard Web Speech Synthesis API to dictate words.
* **No Manual Test Buttons**: Do NOT add helper simulation buttons like "Simulate Voice Read" to the main view.
* **Three-Strike Assistance**: If the kid fails to spell a word 3 times, the word is styled with the `.stumbled` class (turns red with a dashed underline) and the game moves on to avoid frustrating the child.
* **Click-to-Pronounce**: After spelling checks are complete, clicking on any red stumbled word triggers a text-to-speech pronunciation of that word.

## ⚡ 4. Math timed Sprint Mechanics
* **Answer Mode**: Interactive typed inputs are used instead of multiple-choice buttons.
* **Input Support**: Inputs use `type="number" pattern="[0-9]*" inputmode="numeric"` to trigger numeric keypads on mobile screens. They auto-focus and submit on `Enter` or clicking **Cast ⚡**.
* **Visual Validation**: Submitting an answer applies `.math-input-correct` (green glow) or `.math-input-wrong` (red border and shake animation, showing the correct value).
* **Difficulty Scaling**: The factors used for multiplication questions scale dynamically by quest day:
  * **Day 0 (Initiation) & Quests 1–5**: Multipliers of 2s, 3s, 4s, 5s.
  * **Quests 6–10**: Multipliers of 4s, 5s, 6s, 7s.
  * **Quests 11–20**: Multipliers of 6s, 7s, 8s, 9s.
  * **Quests 21–30**: Multipliers of 8s, 9s, 10s, 11s, 12s.
  * Multiplicands are always randomly chosen from 2 to 12.
