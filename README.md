# 🏎 RL Racer

An interactive, browser-based **Reinforcement Learning simulation** that teaches Q-learning through a miniature racing car. Watch the car learn — from random exploration to mastering a full circuit — entirely in your browser, with no server required.

> Inspired by [DeepRacer on AWS](https://docs.aws.amazon.com/solutions/deepracer-on-aws/).  
> Built by [Sridhar Nerur](mailto:sridhar.nerur@gmail.com) using [Claude](https://claude.ai) (Anthropic). For educational purposes only.

---

## Live Demo

**[▶ Launch RL Racer](https://snerur.github.io/RL_Racer_Example/)**

---

## What Is It?

RL Racer demonstrates the core principles of **Q-Learning**, one of the most important algorithms in Reinforcement Learning. A miniature car navigates a race track entirely by trial and error — receiving rewards for staying on course and penalties for veering off — until it learns to complete laps cleanly.

No pre-programmed rules. No hand-crafted paths. Just pure learning.

---

## How It Works

### The Algorithm — Q-Learning

At each step, the car observes its **state**, selects an **action**, receives a **reward**, and updates its knowledge using the Bellman equation:

```
Q(s, a) ← Q(s, a) + α · [r + γ · max_a' Q(s', a') − Q(s, a)]
```

| Symbol | Meaning |
|--------|---------|
| `α` | Learning rate — how strongly new experiences update the Q-table |
| `γ` | Discount factor — how much future rewards matter vs. immediate ones |
| `ε` | Exploration rate — probability of choosing a random action |
| `r` | Reward received after taking action `a` in state `s` |

### State Space (252 states)

| Dimension | Bins | Description |
|-----------|------|-------------|
| Cross-Track Error (CTE) | 9 | How far left/right of the centerline |
| Heading Error | 7 | Angle between car direction and track direction |
| Speed | 4 | Current car speed |

### Actions (5 choices)

| Action | Steering | Speed |
|--------|----------|-------|
| Hard Left | −0.10 rad/step | Slow |
| Soft Left | −0.05 rad/step | Medium |
| Straight | 0 | Fast |
| Soft Right | +0.05 rad/step | Medium |
| Hard Right | +0.10 rad/step | Slow |

### Reward Function

| Event | Reward |
|-------|--------|
| Near track center | +Gaussian bonus (peaks at 1.0) |
| Forward speed (aligned) | +speed × alignment factor |
| Lap completed | +150 (configurable) |
| Off track | −80 (episode ends) |
| Obstacle hit | −30 (episode continues) |
| Per step | −0.05 (efficiency incentive) |

---

## Tracks

| Track | Difficulty | Width | Obstacles | Notes |
|-------|-----------|-------|-----------|-------|
| **Oval Circuit** | Easy | 90 px | None | Best for initial training; converges in ~100–200 episodes |
| **Chicane Challenge** | Medium | 65 px | 2 cones | Two S-bend chicanes demand precise steering |
| **Grand Circuit** | Hard | 52 px | 3 barriers | Hairpins, variable-width sections, tight chicane |

---

## Features

- **Real-time Canvas rendering** — 60 fps top-down view with tire trail, HUD, and optional debug overlay
- **Configurable hyperparameters** — live sliders for α, γ, ε-decay, max steps, and all reward weights
- **Training speed control** — 1×, 5×, 20×, 50× steps per frame
- **Train / Test mode** — train with ε-greedy, then freeze the Q-table and test the learned policy
- **Reward chart** — per-episode rewards, 20-episode rolling average, and ε-decay curve
- **RL Tutor (LLM chat)** — ask questions in plain English; backed by Anthropic Claude or OpenAI GPT with real-time streaming and full simulation context injected automatically

---

## Getting Started

### Run locally

```bash
git clone https://github.com/snerur/RL_Racer_Example.git
cd RL_Racer_Example
npm install --legacy-peer-deps
npm run dev
```

Then open **http://localhost:5173** in your browser.

### Quick start guide

1. **Select a track** — start with *Oval Circuit* (easy)
2. **Click ▶ Run** — training begins with ε = 1.0 (fully random)
3. **Set speed to 50×** — converges in under a minute on the oval
4. **Watch ε decay** — random exploration gives way to learned behaviour
5. **Switch to Test mode** — freeze the Q-table and watch the car exploit what it learned
6. **Enable Debug overlay 🔍** — see cross-track error and heading error arcs in real time
7. **Ask the Tutor** — enter your Anthropic or OpenAI API key and ask anything

### Tips for faster convergence

- Increase **α to 0.5–0.6** for faster Q-table updates
- Set **ε-decay to 0.98** for quicker commitment to the learned policy
- Raise the **Lap Bonus** if the car rarely finishes a lap
- Always start with the **Oval** before moving to harder tracks
- When the reward chart plateaus, the policy has converged — switch to Test mode

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Rendering | HTML5 Canvas (offscreen canvas for track, live canvas for car) |
| RL engine | Custom Q-learning (no ML libraries) |
| Physics | Kinematic car model with steering + speed lerp |
| Charts | Custom Canvas chart (no chart libraries) |
| LLM | Anthropic Claude API + OpenAI API (direct fetch, streaming) |
| Styling | Plain CSS (dark racing theme, no Tailwind) |

---

## Project Structure

```
src/
├── types.ts                  # All shared TypeScript types
├── engine/
│   ├── trackGeometry.ts      # Catmull-Rom spline, CTE, heading error
│   ├── physics.ts            # Car kinematic model
│   ├── qlearning.ts          # Q-table, Bellman update, ε-greedy
│   ├── rewardFunction.ts     # Reward computation + episode termination
│   └── renderer.ts           # Pure Canvas drawing functions
├── tracks/
│   ├── oval.ts               # Easy oval track
│   ├── chicanes.ts           # Medium chicane track
│   └── circuit.ts            # Hard grand circuit
├── hooks/
│   └── useSimulation.ts      # Central simulation loop (refs for perf)
├── services/
│   └── llmService.ts         # Anthropic + OpenAI streaming client
└── components/
    ├── SimulationCanvas.tsx  # Canvas host + render loop
    ├── ParameterPanel.tsx    # Hyperparameter sliders
    ├── CourseSelector.tsx    # Track selection cards
    ├── StatsPanel.tsx        # Live stats + control buttons
    ├── RewardChart.tsx       # Episode history chart
    ├── LLMChat.tsx           # RL Tutor chat panel
    └── AboutModal.tsx        # About the Game modal
```

---

## License

For educational purposes only. Not for commercial use.
