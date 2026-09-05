# Spec: Flappy Bird for the mini-games overlay

Working spec for implementing the `flappy` entry of the game selector in `@deepseek-ai/dsh-client-ui-dino-game` as a playable Flappy Bird clone. It mirrors the Chrome-dino implementation so both games share one overlay contract and the same pause/focus behavior.

## Status

Draft for review. Targets the uncommitted working tree (the ui-dino-game WIP on top of the `retard-harness` build).

## 1. Goal

Add a fully playable Flappy Bird game to the existing game-selector overlay: flap the bird through scrolling pipes, score per pipe pair passed, die on pipe or ground contact, restart, and persist a best score. The game is a pure client-side pastime — it adds no model-visible inputs, prompts, or tools (Model Experience: none, same as the dino game).

## 2. Verified current state

- `packages/client/ui-dino-game/src/client/DinoOverlay.tsx` is already a game hub: `GAMES = [{ id: 'dino', label: 'Chrome Dino', comingSoon: false }, { id: 'flappy', label: 'Flappy Bird', comingSoon: true }, { id: 'tiktok', label: 'TikTok', comingSoon: true }]`, a selector dropdown, a resizable panel (320–800 px, default 520), focus management, pause-on-unfocus, a 2 s force-pause after the model replies, and auto-open + focus while a session runs. Non-implemented selections render a 🚧 coming-soon placeholder.
- The game component contract (from `<DinoGame t={props.t} busy={running} focused={focused} paused={paused} onFocus={onGameFocus} />` in the overlay) is props `{ t, busy, focused, paused, onFocus }`: `t` is the locale function, `busy` the model-streaming flag, `focused` the keyboard-capture gate, `paused` a hard pause flag, and `onFocus()` requests panel focus.
- The `shell.overlay` slot is `{ kind: 'list', scope: 'root' }`, declared in `packages/client/ui-layout/src/client/index.ts` and rendered by `packages/client/ui-layout/src/client/AppFrame.tsx` via `renderSlot('shell.overlay', {})`.
- Localization is a single `dino` namespace: `src/client/locales.ts` keeps Simplified Chinese as the key-set source of truth and English checked complete against `DinoKey = keyof typeof zh`. Existing keys include `game.flappy`, `game.select`, `game.comingsoon`, `game.paused`.
- Best score persistence is guarded `localStorage` (throws ignored), key `dsh.dino.best`.
- Rendering is pure canvas 2D with no assets: a fixed logical viewport scaled by `devicePixelRatio`, a `requestAnimationFrame` loop, and frame-rate-independent `dt` capped at 0.033 s.
- Build config: `tsdown.config.ts` uses `clientBundle('@deepseek-ai/dsh-client-ui-dino-game', ['lib/types/index.js', 'lib/types/invariant.js'])`; `tsconfig.json` extends `tsconfig.base.client.json`.
- `tests/` is currently empty. Client source packages sit inside the per-file 100 % coverage gate; component specs use the `// @vitest-environment jsdom` pragma on the first line and feed props directly.
- Pre-existing debt in the touched files: `DinoOverlay.tsx` carries hardcoded copy (`Click here to play · Click left to type`, `aria-label="Close game panel"`) that `verify-client-ui-i18n` rejects, and the package README's Features/Architecture text predates the selector and pause logic.

## 3. Approach decision

Implement inside the existing package (the game hub), not as a new package.

- The selector, panel, pause logic, and `shell.overlay` registration already live here. A second overlay registration in a new package would render two panels at once — both are list cells in the same root-scoped slot, and both panels are absolutely positioned right-side overlays.
- `GAMES` already reserves `flappy`; the hub renders a coming-soon placeholder for anything unimplemented, so this change is flipping one entry on and wiring its component.
- A separate `@deepseek-ai/dsh-client-ui-flappy-bird` package would have to duplicate the hub or orchestrate across packages, and the client rules forbid a feature plugin from runtime-importing another feature plugin.

Rejected alternatives: (a) separate package — reasons above; (b) a shared game engine abstraction — defer until a third game exists; for now dino and flappy stay sibling components, and only the physics/state logic is extracted (below).

Package rename (`@deepseek-ai/dsh-client-ui-dino-game` → e.g. `@deepseek-ai/dsh-client-ui-games`) is a mechanical sweep across the tsconfig aggregate, the `dsh.client` row in `packages/bundle/web-app/cordis.patch.yml`, the web-app dependency list, and the lockfile. It is out of scope for this change and tracked as a follow-up.

## 4. Game design

- Viewport: a portrait logical canvas, suggested ~300 × 420, to fit the tall right-side panel (the dino canvas is landscape 400 × 120). Same backing-store setup: logical size fixed, canvas backing scaled by `devicePixelRatio`.
- Coordinates: altitude convention like the dino game — y positive up from ground (y = 0), bird fixed at x ≈ 70, `vy` positive up, gravity pulls `vy` down.
- Controls: Space / ↑ / click-tap = flap (impulse `vy = FLAP_V`, ignored when over or paused); R = restart. Keyboard is captured only while `focused` is true, exactly like the dino game, so the chat input keeps working when the panel is not focused.
- States: `idle` → `running` → `over`, plus `done` when `busy` flips false mid-round (the same `Overlay` union the dino game uses). The hint line mirrors the dino one.
- Pipes: pairs spawn at a fixed horizontal scroll interval; each pair is a top pipe and a bottom pipe with a gap between; the gap center is random within bounds; suggested geometry pipe width ≈ 48, gap ≈ 120.
- Scoring: +1 when a pipe pair's trailing edge passes the bird's x; each pair counts once.
- Difficulty: scroll speed ramps with distance up to a maximum, mirroring the dino game's `speed`/`ACCEL` ramp.
- Collision: bird box vs top/bottom pipe rects; ground (y ≤ 0) is game over — classic Flappy Bird, unlike the dino game which lands; the ceiling clamps altitude instead of killing.
- Best score: `localStorage` key `dsh.flappy.best`, using the same guarded read/write helpers as the dino game.
- Rendering: canvas rects only — bird body, wing, eye; pipe bodies and caps; a ground strip — in the same geometric style as the dino game. No images and no emoji on the canvas (emoji stays in DOM chrome, e.g. the selector).
- Suggested starting physics values to tune during implementation: `GRAVITY ≈ 1500`, `FLAP_V ≈ 380`, start pipe speed ≈ 160 px/s ramping to ≈ 320 px/s.

## 5. Implementation plan

New files:

- `src/client/flappy-engine.ts` — pure game logic with no DOM: state creation, a `step(state, input, dt)` transition covering gravity, flap impulse, pipe spawn cadence, scroll, scoring, collision, ground/ceiling handling, and difficulty ramp, plus best-score persistence helpers. This extraction is what makes the game testable: jsdom's `canvas.getContext('2d')` returns null, so logic buried inside a rAF effect (as the dino game does) cannot be unit-tested. Do not copy the dino game's all-in-effect structure verbatim.
- `src/client/FlappyBirdGame.tsx` — the canvas component: the same props contract as `DinoGame` (`{ t, busy, focused, paused, onFocus }`), owning the rAF loop, keyboard/pointer input wiring, and drawing; state lives in `flappy-engine` instances.
- `src/client/FlappyBirdGame.module.css` — header (title/score/best), canvas frame, hint, and done-banner styles, using `--dsw-alias-*` tokens like `DinoGame.module.css`.

Modified files:

- `src/client/DinoOverlay.tsx` — flip `flappy` to `comingSoon: false` in `GAMES`; render `selectedGame === 'flappy' ? <FlappyBirdGame ... /> : ...` in the panel body; keep `tiktok` as coming soon. The props contract and the `DinoOverlayProps` type do not change.
- `src/client/locales.ts` — add `flappy.*` keys to the zh dictionary (source of truth) and the matching English entries; `DinoKey` grows automatically, and the `Record<DinoKey, string>` check on `en` enforces completeness.
- `src/client/DinoOverlay.tsx` — in the same change, replace the two hardcoded strings (click hint, close-button aria-label) with dictionary keys so `verify-client-ui-i18n` passes on the touched files.
- `packages/client/ui-dino-game/README.md` — add Flappy Bird to Features; update Architecture/Features text to the selector-hub reality (open-by-default panel, pause semantics); keep the Model Experience section unchanged (no model-visible inputs).

Unchanged — do not touch: `src/index.ts` (deliberately empty node half), `src/invariant.ts` (companion and its reason stay valid), `package.json`, `tsconfig.json`, `tsdown.config.ts`, and the three registration surfaces (no new package, no new dependencies).

## 6. Locale keys (draft)

Simplified Chinese (source of truth):

```ts
'flappy.title': '小鸟（模型思考中）',
'flappy.subtitle': '穿过管道，看你能飞多远。',
'flappy.play': '开始（空格 / 点击）',
'flappy.flap': '按空格 / ↑ / 点击 扇动',
'flappy.restart': '按 R 或点击重新开始',
'flappy.score': '分数',
'flappy.best': '最佳',
```

English mirrors each key exactly; the `Record<DinoKey, string>` check enforces completeness, so no key can be missing from either dictionary.

## 7. Tests

- `tests/flappy-engine.client.spec.ts` — pure logic, no DOM: flap impulse and gravity integration, pipe spawn cadence, scoring exactly once per pair, collision (top pipe, bottom pipe, ground, ceiling clamp), difficulty ramp, state transitions, and best-score persistence behavior.
- `tests/flappy-bird-game.client.spec.tsx` — first line `// @vitest-environment jsdom`; feed props directly (real locale dictionaries, `busy`/`focused`/`paused` flags, an `onFocus` spy): idle hint shown; Space/↑/click flap starts the round; R restarts; `busy` flipping false mid-round shows `done`; `paused` blocks input. Assert user-visible output (hints, aria-labels, data attributes), never canvas internals.
- `tests/overlay-selector.client.spec.tsx` — the dropdown lists three games; selecting `flappy` renders the Flappy Bird entry (assert via data attribute or aria-label); `tiktok` stays disabled with the coming-soon label.
- Coverage: every `src/client/*` file at 100 % (per-file gate); `v8 ignore` only with a real reason.
- If the pure-engine extraction is rejected and the loop stays inside the effect, stub `HTMLCanvasElement.prototype.getContext` with a minimal 2D-context recording stub and drive `requestAnimationFrame` — but prefer the extraction; it is the testable design.

## 8. Docs and hygiene

- Update the package README as listed in the implementation plan. No `docs/` tree changes and no new package documentation.
- Agent Note: this is a non-trivial change, so it needs one in the same PR (`.agents/notes/`), recording the hub decision and the pure-engine extraction.
- GIF: the change alters product-visible GUI behavior, so a PR must include a browser demo GIF per the `record-browser-gif` skill.

## 9. Verification and acceptance criteria

Commands (the narrowest sufficient set):

1. `pnpm --filter @deepseek-ai/dsh-client-ui-dino-game bundle` — rebuild `lib/client.js`; the web server serves the bundle, not sources, so this must run before probing a live `dsh web`.
2. `pnpm run test:gui` — client and host GUI suites (the inner loop).
3. `pnpm run verify-client-ui-i18n` — copy ownership on the touched files.
4. `DSH_SNAPSHOT=replay pnpm run test:web` — required because visible assembled browser output changes.
5. `pnpm run typecheck` and `pnpm run lint`.

Acceptance:

- The selector shows Flappy Bird enabled (no coming-soon badge); selecting it swaps the panel body to the Flappy Bird canvas; TikTok still shows coming soon.
- Flap, pipes, scoring, collision, restart, and best-score persistence all work; pause semantics are identical to the dino game (unfocus pauses, a model reply force-pauses for 2 s, a running session auto-opens and focuses the panel).
- All new copy is localized; no hardcoded strings remain in the touched files.
- New specs pass; per-file coverage is 100 %; i18n, lint, and typecheck are green.
- The README describes the hub and both games accurately.

## 10. Out of scope

The TikTok entry, any third game, the shared-game-engine extraction, the package rename, any host-side or model-visible change, and snapshot-fixture updates — the game is client-only and never enters the session log, so no session snapshots change.
