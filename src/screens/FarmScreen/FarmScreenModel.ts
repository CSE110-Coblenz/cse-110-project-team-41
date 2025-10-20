/**
 * GameScreenModel - Manages game state
 */
export class FarmScreenModel {
	private score = 0;

	/**
	 * Reset game state for a new game
	 */
	reset(): void {
		this.score = 0;
	}

	/**
	 * Increment score when lemon is clicked
	 */
	incrementScore(): void {
		this.score++;
	}

	/**
	 * Get current score
	 */
	getScore(): number {
		return this.score;
	}
}
