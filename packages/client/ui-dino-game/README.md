# dsh-client-ui-dino-game

A Chrome-dino-style endless runner the web client lets you play while the model
is streaming. Registers a card into the frame-wide `shell.overlay` list that
renders only while the current session's run flag is set; when the model
finishes mid-round, the card flips to a "done" banner.

## Model Experience

The plugin adds no model-visible inputs, prompts, or tools. It is a pure
client-side pastime; the model is unaffected.

## Features

- Endless runner on a canvas: jump with `Space` / `↑` / tap, restart with `R`.
- Obstacle speed ramps over time; score accrues with distance.
- Best score persists to `localStorage` under `dsh.dino.best`.
- Visibility is driven by the session running bit read through the standard
  `useSessions` seat, so the card appears only while a model reply is in
  flight.

## Architecture

Browser-only plugin package: node half (`src/index.ts`) is deliberately empty;
the browser half (`src/client`) registers one `list` cell into the
`shell.overlay` slot declared by `dsh-client-ui-layout`. The game component
(`DinoGame.tsx`) is a pure canvas component receiving localized copy and a
`busy` flag; the overlay entry (`DinoOverlay.tsx`) derives that flag from the
session list summary.