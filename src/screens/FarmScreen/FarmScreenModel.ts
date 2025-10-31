/**
 * GameScreenModel - Manages game state
 */
export class FarmScreenModel {
	private score = 0;
	private round = 1;

	/**
	 * Reset game state for a new game
	 */
	reset(): void {
		this.score = 0;
		this.round = 1;
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

	/**
	 * Increment the round parameter at the end of a round
	 */

	incrementRound(): void {
		this.round++;
	}

	/**
	 * Get the current round
	 */

	getRound() : number {
		return this.round;
	}
}
