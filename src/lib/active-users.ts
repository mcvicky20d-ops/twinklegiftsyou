/** Someone who has signed in within this window counts as an active user. */
export const ACTIVE_DAYS = 30;

/**
 * The cut-off for "active". It lives here rather than inline in the page so
 * the clock is read outside the component body — a render must not depend on
 * an impure call.
 */
export function activeSince(days = ACTIVE_DAYS) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
