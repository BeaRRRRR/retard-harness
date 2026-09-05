/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-client-ui-dino-game`.
 * @module @deepseek-ai/dsh-client-ui-dino-game/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-client-ui-dino-game'

/** Cordis companion plugin name. */
export const name = 'client-ui-dino-game-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the overlay registration is an effect observed by the
 * slot registry, and the running bit that drives visibility is the session
 * list's own published summary (this plugin reads it, it does not own it).
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns The installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
