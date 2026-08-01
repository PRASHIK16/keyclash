/**
 * Standard Elo rating (the same family of algorithm Chess.com uses).
 * K-factor of 32 is a common default for platforms without provisional
 * rating periods; if you later want new players to swing faster toward
 * their "true" rating in their first ~20 games, bump K for those games
 * specifically (a common pattern: K=40 for matches_played < 20, K=24 above
 * rating 2000, K=32 otherwise).
 */

const K_FACTOR = 32;

export interface EloResult {
  playerOneNewRating: number;
  playerTwoNewRating: number;
  playerOneDelta: number;
  playerTwoDelta: number;
}

/** outcome is from player one's perspective: 1 = win, 0.5 = draw, 0 = loss */
export function calculateEloChange(
  playerOneRating: number,
  playerTwoRating: number,
  outcome: 1 | 0.5 | 0
): EloResult {
  const expectedPlayerOne = 1 / (1 + Math.pow(10, (playerTwoRating - playerOneRating) / 400));
  const expectedPlayerTwo = 1 - expectedPlayerOne;

  const outcomePlayerTwo = (1 - outcome) as 1 | 0.5 | 0;

  const playerOneDelta = Math.round(K_FACTOR * (outcome - expectedPlayerOne));
  const playerTwoDelta = Math.round(K_FACTOR * (outcomePlayerTwo - expectedPlayerTwo));

  return {
    playerOneNewRating: playerOneRating + playerOneDelta,
    playerTwoNewRating: playerTwoRating + playerTwoDelta,
    playerOneDelta,
    playerTwoDelta,
  };
}

export interface RankTier {
  name: string;
  minRating: number;
  color: string;
}

/** Rank tier thresholds — purely cosmetic labeling on top of the numeric rating. */
export const RANK_TIERS: RankTier[] = [
  { name: "Bronze", minRating: 0, color: "#B45309" },
  { name: "Silver", minRating: 1000, color: "#94A3B8" },
  { name: "Gold", minRating: 1200, color: "#F59E0B" },
  { name: "Platinum", minRating: 1400, color: "#22D3EE" },
  { name: "Diamond", minRating: 1650, color: "#818CF8" },
  { name: "Champion", minRating: 1900, color: "#EC4899" },
];

export function getRankTier(rating: number): RankTier {
  let current: RankTier = { name: "Bronze", minRating: 0, color: "#B45309" };
  for (const tier of RANK_TIERS) {
    if (rating >= tier.minRating) current = tier;
  }
  return current;
}
