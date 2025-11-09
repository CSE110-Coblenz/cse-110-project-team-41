/**
 * GameScreenModel - Manages game state
 */
export class FarmScreenModel {
	private score = 0;
	private spawnNum = 20;

	/**
	 * Reset game state for a new game
	 */
	reset(): void {
		this.score = 0;
		this.spawnNum = 2;
	}

	/**
	 * Increment score when a crop is harvested
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
	 * Increases the amount of Emus to spawn
	*/

	updateSpawn(): void {
		this.spawnNum = Math.ceil(this.spawnNum * 1.3);
	}

	/**
	 * Returns the amount of emus to spawn:
	 */

	getSpawn(): number {
		return this.spawnNum;
	}
}
