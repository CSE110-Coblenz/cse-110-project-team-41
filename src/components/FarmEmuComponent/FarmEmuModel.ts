/**
 * GameScreenModel - Manages game state
 */
export class FarmEmuModel {
	private health = 100;
	private damage = 20;

	/**
	 * Reset game state for a new game
	 */
	decrementHealth(amount: number): void {
		this.health -= amount;
	}

	getDamage(): number {
		return this.damage;
	}
}
