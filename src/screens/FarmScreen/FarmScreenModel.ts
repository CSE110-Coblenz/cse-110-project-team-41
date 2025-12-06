import { GameStatusController } from "../../controllers/GameStatusController";

/**
 * GameScreenModel - Manages game state
 */
export class FarmScreenModel {
	private spawnNum = 20;
	private status: GameStatusController;

	constructor(status: GameStatusController) {
		this.status = status
	}

	/**
	 * Reset game state for a new game
	 */
	reset(): void {
		this.spawnNum = 2;
	}


	/** 
	 * Increases the amount of Emus to spawn
	*/
	updateSpawn(): void {
		this.spawnNum = Math.ceil(this.status.getDay() * 2);
	}

	/**
	 * Returns the amount of emus to spawn:
	 */

	getSpawn(): number {
		return this.spawnNum;
	}
}
