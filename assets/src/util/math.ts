/**
 * A helper function to help clarify code when clamping a value between a range.
 * (Remove when tc39 implements `Math.clamp`)
 *
 * @returns {} {@link value} limited to the range defined by {@link min} and
 * {@link max}
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(min, value), max)
