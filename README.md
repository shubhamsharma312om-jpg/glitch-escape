# GLITCH ESCAPE — BRIGHT MAZE EDITION

A simple first-person maze game for a game jam.

## Game concept

There is **no system corruption mechanic** in this edition.

The player simply:

1. Enters a maze.
2. Has a fixed amount of time.
3. Explores using a first-person camera.
4. Finds the bright EXIT door.
5. Clears 5 short mazes.
6. Wins if all mazes are completed before time runs out.

## Visual direction

- Cream / warm background
- Bright blue, yellow, mint and peach accents
- Friendly professional mascot character on the menu
- Clean rounded UI
- First-person maze view
- Bright exit beacon
- No scary glitch effects
- No "system critical" messages
- No corruption mechanic

## Run

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## Build for deployment

```bash
npm run build
```

Deploy the generated `dist/` folder.

## Controls

- W / Arrow Up — move forward
- S / Arrow Down — move backward
- A / D — strafe
- Left / Right Arrow — turn
- Hold left mouse button + move mouse — turn
- ESC — pause

## Project structure

```text
glitch-escape/
├── assets/
│   └── maze-runner.svg
├── index.html
├── styles.css
├── game.js
├── package.json
└── README.md
```
