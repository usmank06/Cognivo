/**
 * Token Tracking Helper
 * 
 * Use this to easily track API usage and costs throughout your app.
 * Import and call after any AI API call.
 */

import { updateTokenUsage } from '../api/client';

/**
 * Track token usage for a user
 * @param username - The username of the current user
 * @param tokensUsed - Number of tokens consumed
 * @param costInDollars - Cost in USD (e.g., 0.02 for 2 cents)
 */
export async function trackTokens(username: string, tokensUsed: number, costInDollars: number) {
  try {
    await updateTokenUsage(username, tokensUsed, costInDollars);
  } catch (error) {
    // Silently fail - token tracking shouldn't break app functionality
  }
}

/**
 * Calculate cost based on standard pricing
 * Common rates (as of 2024):
 * - GPT-4: ~$0.03 per 1K tokens
 * - GPT-3.5: ~$0.002 per 1K tokens
 * - Claude: ~$0.024 per 1K tokens
 */
export function calculateCost(tokens: number, pricePerThousand: number): number {
  return (tokens / 1000) * pricePerThousand;
}

/**
 * Example usage:
 * 
 * // After an AI API call
 * const tokens = 1500;
 * const cost = calculateCost(tokens, 0.03); // GPT-4 pricing
 * await trackTokens(currentUser, tokens, cost);
 * 
 * // Or manually
 * await trackTokens(currentUser, 1500, 0.045);
 */

/**
 * Preset pricing constants
 */
export const AI_PRICING = {
  GPT4: 0.03,        // $0.03 per 1K tokens
  GPT35: 0.002,      // $0.002 per 1K tokens
  CLAUDE: 0.024,     // $0.024 per 1K tokens
  CUSTOM: 0.01,      // Adjust as needed
};

/**
 * Quick track with preset pricing
 */
export async function trackGPT4(username: string, tokens: number) {
  const cost = calculateCost(tokens, AI_PRICING.GPT4);
  await trackTokens(username, tokens, cost);
}

export async function trackGPT35(username: string, tokens: number) {
  const cost = calculateCost(tokens, AI_PRICING.GPT35);
  await trackTokens(username, tokens, cost);
}

export async function trackClaude(username: string, tokens: number) {
  const cost = calculateCost(tokens, AI_PRICING.CLAUDE);
  await trackTokens(username, tokens, cost);
}
