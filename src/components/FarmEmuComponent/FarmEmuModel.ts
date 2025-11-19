/**
 * GameScreenModel - Manages game state
 */
export class FarmEmuModel {
	private health = 100;

	/**
	 * Reset game state for a new game
	 */
	decrementHealth(amount: number): void {
		this.health -= amount;
	}
}
