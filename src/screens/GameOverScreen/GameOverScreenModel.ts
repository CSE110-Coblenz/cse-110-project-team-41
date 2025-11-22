/**
 * Represents a single leaderboard entry
 */
export type LeaderboardEntry = {
	name: string; 
	survivalDays: number;
	score: number;
	timestamp: string; // formatted timestamp
};

/**
 * ResultsScreenModel - Stores final score and leaderboard
 */
export class GameOverScreenModel {
	private survivalDays = 0;
	private finalScore = 0;
	private leaderboard: LeaderboardEntry[] = [];

	/**
	 * Set the final results
	 */
	setFinalResults(survivalDays: number, score: number): void {
		this.survivalDays = survivalDays;
		this.finalScore = score;
	}

	/**
	 * Get the final score
	 */
	getFinalScore(): number {
		return this.finalScore;
	}
	/**
	 * Get the survival days
	 */
	getSurvivalDays(): number {
		return this.survivalDays;
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
