/**
 * Dino-runner distraction, browser half: registers the dino game card into the
 * frame-wide `shell.overlay` list. The entry is root-scoped, so the overlay
 * component reads the current session's running bit from the session list
 * summary via the `useSessions` seat and renders the game only while a
 * session is running; when the model finishes, the card flips to a "done"
 * banner. Copy rides the standard locale seat; the entry declares no children.
 *
 * Export discipline: packages/client/AGENTS.md. Only the dictionary keys and
 * the composed props alias are public.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the ui-session standard hooks (useSessions) into program.
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
// Type-only: pulls the 'shell.overlay' SlotMap declaration owned by ui-layout.
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { DinoOverlay } from './DinoOverlay.tsx'
import { en, zh, type DinoKey } from './locales.ts'

export type { DinoKey } from './locales.ts'
export type { DinoOverlayProps } from './DinoOverlay.tsx'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The dino game's copy. */
    dino: DinoKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'dino'

/** This cell id in the shell.overlay list. */
const GAME_ID = 'dino-game'

/** Required services: slot registry and the locale plugin. */
export const inject = ['slots', 'locale']

/**
 * Browser plugin body: register the dino copy, then contribute the game card
 * into the shell.overlay list once ui-layout declares it.
 * @param ctx - the client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-dino-game: dictionaries')
  ctx.inject(['slots'], (scope: ClientContext) => {
    scope.slots.inject('shell.overlay', () =>
      scope.slots.register({
        name: 'shell.overlay',
        id: GAME_ID,
        order: 500,
        locale: NS,
      }, DinoOverlay))
  })
}
