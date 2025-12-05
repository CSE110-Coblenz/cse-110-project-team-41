/**
 * GameScreenModel - Manages game state
 */
export class FarmEmuModel {
	private health = 100;
	private damage = 20;

	private onKill: () => void;

	constructor(onKill: () => void) {
		this.onKill = onKill
	}

	/**
	 * Reset game state for a new game
	 */
	decrementHealth(amount: number): void {
		this.health -= amount;
		if (this.health < 1) {
			this.onKill();
		}
	}

	getDamage(): number {
		return this.damage;
	}
}
