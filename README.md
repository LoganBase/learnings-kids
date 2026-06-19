# ⚡ Spelling & Math Quest: Treasure Island Adventure 🏴‍☠️

A magical, interactive learning quest application designed for kids to master spelling and multiplication math tables. Styled with an immersive Harry Potter & Pirate Adventure theme, kids can level up, earn virtual currencies (Gems and R$), and embark on a 30-day learning journey!

---

## 🎮 Key Features

### 1. Immersive Theme & Setup
* **Adventure Initiation**: Kids start with an immersive wizarding duel to test their readiness against "Death Eaters."
* **Audio Feedback**: Responsive synthesized sound effects (correct chimes, failure alarms, success fanfares) to keep players engaged.

### 2. Spelling Quest 🎙️
* **Text-to-Speech Dictation**: Dictates words clearly to the child for spelling.
* **Friendly Stumble Assistance**: If a child struggles with a word after 3 attempts, the application turns the word red and moves on to avoid frustration.
* **Review & Learn**: Once the spelling challenge is complete, the kid can click any marked red words to hear their correct pronunciation again.

### 3. Math timed Sprint ⚡
* **Typing Inputs**: Direct numeric keyboard support, styled for both mobile numeric pad inputs and fast desktop keyboard entry (automatically focuses and submits on pressing `Enter`).
* **Visual Validation**: Green glow for correct answers; red glow and shake animation for wrong answers. Showcases the correct answer upon failure.
* **Dynamic Difficulty Scaling**: Math problems automatically scale in difficulty as the child advances along the 30-day map:
  * **Day 0 (Initiation) & Quests 1–5**: Multipliers from 2s to 5s.
  * **Quests 6–10**: Multipliers from 4s to 7s.
  * **Quests 11–20**: Multipliers from 6s to 9s.
  * **Quests 21–30**: Multipliers from 8s to 12s.
  * All numbers are multiplied by a random factor between 2 and 12.

### 4. Interactive Quest Map 🗺️
* **30-Day Path**: A visual island trail guiding the child's ship to the final treasure chest.
* **Gems & Robux Tracker**: Accumulate loot by completing quests!
* **Parent Dashboard**: Track the child's spelling accuracy, average response speed, and performance history.

---

## 🛠️ Tech Stack & Architecture

* **Frontend**: HTML5, Vanilla CSS3 (curated theme using glassmorphic UI, custom gradients, and CSS keyframe animations).
* **Programming**: Vanilla JavaScript (ES6+).
* **Build System**: [Vite](https://vitejs.dev/) & Dev Server.
* **Deployment**: Cloudflare Pages.

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v16+)
* npm (v8+)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/LoganBase/learnings-kids.git
   cd learnings-kids
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server locally:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```
