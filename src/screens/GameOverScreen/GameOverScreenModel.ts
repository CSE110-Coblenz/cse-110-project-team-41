/**
 * Represents a single leaderboard entry
 */
export type LeaderboardEntry = {
	score: number;
	timestamp: string; // formatted timestamp
};

/**
 * ResultsScreenModel - Stores final score and leaderboard
 */
export class GameOverScreenModel {
	private finalScore = 0;
	private leaderboard: LeaderboardEntry[] = [];

	/**
	 * Set the final score
	 */
	setFinalScore(score: number): void {
		this.finalScore = score;
	}

	/**
	 * Get the final score
	 */
	getFinalScore(): number {
		return this.finalScore;
	}

	/**
	 * Set the leaderboard entries
	 */
	setLeaderboard(entries: LeaderboardEntry[]): void {
		this.leaderboard = entries;
	}

	/**
	 * Get the leaderboard entries
	 */
	getLeaderboard(): LeaderboardEntry[] {
		return this.leaderboard;
	}
}
