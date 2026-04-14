# Typie ⌨️

A browser-based typing tutorial game for children that teaches correct finger placement on a QWERTY keyboard.

## Features

- **9 progressive levels** — home row → top row → bottom row → all keys
- **Visual finger guide** — illustrated left and right hands with color-coded fingers
- **Color-coded keyboard** — every key shows which finger should press it
- **Real-time feedback** — correct keystrokes flash green, mistakes flash red with a buzz sound
- **Scoring system** — +10 per correct key, -5 per mistake, accuracy % and stars per level
- **No dependencies** — pure HTML, CSS, and JavaScript; no build step required

## Finger Color Key

| Color | Left Hand | Right Hand |
|-------|-----------|------------|
| 🔴 Red | Pinky | Pinky |
| 🟠 Orange | Ring | Ring |
| 🟡 Yellow | Middle | — |
| 🟢 Green | Index | — |
| 🩵 Teal | Thumb | Thumb |
| 🔵 Blue | — | Index |
| 🟣 Purple | — | Middle |

## Getting Started

Just open `index.html` in any modern browser — no server or install needed.

```bash
open index.html
```

## Project Structure

```
typie/
├── index.html   # Game markup and screens
├── style.css    # Light theme, keyboard, finger visuals
├── game.js      # Game logic, finger map, levels, scoring, sounds
└── README.md
```

## Created by NeilD
