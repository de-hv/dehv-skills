/** Returns the price after taking off the given percentage (0 to 100). */
export function applyDiscount(price: number, percent: number): number {
  return price - percent
}
