# Calculator 

A beautiful, production-quality calculator web app built with pure HTML, CSS, and JavaScript.

## Features

- **Dark Mode** — carefully tuned dark palette with accent colors for the new generation whose eyes hurt 
- **Responsive** — adapts to any screen size, from 320px phones to ultrawide monitors
- **Keyboard Support** — full number, operator, Enter, Escape, and Backspace mapping
- **History Panel** — slide-in drawer with localStorage persistence (up to 50 entries)
- **Copy Result** — one-click copy with visual tooltip feedback
- **Smooth Animations** — micro-interactions on every button, panel transitions, and background motion
- **Error Handling** — division by zero, overflow, and invalid input states
- **Accessible** — ARIA labels, focus-visible outlines, and `prefers-reduced-motion` support

## Folder Structure

```
calculator/
├── index.html          # App shell and semantic markup
├── css/
│   └── styles.css      # Design tokens, glassmorphism, responsive rules
├── js/
│   ├── calculator.js   # Pure arithmetic engine (no DOM)
│   ├── history.js      # History manager with localStorage
│   └── app.js          # DOM controller, events, and UI wiring
└── README.md
```

## Getting Started

No build step required. Open `index.html` in any modern browser:

```bash
# macOS / Linux
open index.html

# Windows
start index.html
```

Or serve locally with any static file server.

## Keyboard Shortcuts

| Key              | Action         |
| ---------------- | -------------- |
| `0`–`9`          | Enter digit    |
| `.`              | Decimal point  |
| `+` `-` `*` `/` | Operators      |
| `Enter` / `=`    | Evaluate       |
| `Escape`         | Clear (AC)     |
| `Backspace`      | Delete last    |
| `%`              | Percentage     |

## License

MIT
