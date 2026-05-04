/**
 * Normalize seat data to always return an array format.
 * Handles cases where seat data may be:
 * - null/undefined -> returns empty array
 * - A string like "A1" or "A1,A2,A3" -> returns array
 * - An array -> returns as-is
 *
 * @param {string|Array|null|undefined} seats - The seat data to normalize
 * @returns {Array<string>} - Array of seat strings
 */
export const normalizeSeats = (seats) => {
  if (!seats) return [];

  if (Array.isArray(seats)) return seats;

  // If string, split by comma and trim whitespace
  if (typeof seats === 'string') {
    return seats.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  // Fallback: wrap in array
  return [seats];
};