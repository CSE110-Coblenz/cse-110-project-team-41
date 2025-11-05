/**
 * GameScreenModel - Manages game state
 */
export class EmuModel {
	private health = 100;

	/**
	 * Reset game state for a new game
	 */
	decrimentHealth(amount: number): void {
		this.health -= amount;
	}
}
