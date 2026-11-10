# Learnings

Brief answers to code questions, added automatically after each question.
Rule: only project stack (React, Next.js, CSS/Tailwind, TypeScript, tests),
git and tooling (pnpm, Vitest...). Nothing about OpenCode, logistics or
non-code conversation.

## Dark mode in the browser

- The browser only *signals* its preference (`prefers-color-scheme`); the site
  must be built to react (CSS media query or `.dark` class). A site that only
  has light styles stays light no matter what the browser setting is.
- A site's own button (class on `<html>` + `localStorage`) gives per-site
  control and usually overrides the system preference.
- Standard pattern: 3 states (System/Light/Dark) + anti-FOUC script that
  applies the theme before first paint (next-themes does this).

## TUI (Text-based User Interface)

- An interactive UI drawn inside the terminal: panels, keybindings, no mouse
  or graphical windows (vim, htop, lazygit...).
- Unlike a CLI (type one command at a time) or a GUI (graphical window), a
  TUI is screen-based and keyboard-driven.
