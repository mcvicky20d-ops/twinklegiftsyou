/**
 * Runs a storefront query and falls back to a default if the database cannot be
 * reached. A shop that shows its empty state is better than one that returns a
 * 500 to every visitor because the database blipped or is not wired up yet.
 * Admin pages deliberately do NOT use this — staff need to see the real error.
 */
export async function safeQuery<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    console.error("Storefront query failed, serving fallback:", error);
    return fallback;
  }
}
