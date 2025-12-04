/**
 * GameScreenModel - Manages game state
 */
export type CropStage = 0 | 1 | 2 | -1; // -1 = empty, 0 = planted, 1 = half grown, 2 = fully grown

export class FarmPlanterModel {
	private stage: CropStage = -1;
	private health: number = 100;

	getStage(): CropStage {
		return this.stage;
	}

	isEmpty(): boolean {
		return this.stage === -1;
	}

	plant(): boolean {
		if (this.stage > -1) {
			return false; // Can only plant in empty slots
		}
		this.stage = 0;
		return true;
	}

	advanceDay(): void {
		if (this.stage >= 0 && this.stage < 2) {
			//If crop is dead, do not advance the day until crop is planted:
			if (this.health <= 0) {return;}

			if (this.stage < 2) {
				this.stage = (this.stage + 1) as CropStage;
			}
		}
	}
	
	harvest(): boolean {
		if (this.stage !== 2) {
			return false;
		}

		this.stage = -1; // Set to empty after harvest
		return true;
	}

	destroy(): boolean {
		// Destroy crop (set to empty) - can destroy any stage crop
		if (this.stage === -1) {
			return false; // Already empty
		}
		this.stage = -1;
		this.health = 0;
		return true;
	}

	stillStanding(): boolean {
		return this.health > 0;
	}

	decrimentHealth(amount: number): boolean {
		// ✅ Already dead? Nothing to do, and definitely not "died this hit".
		if (this.health <= 0) {
			return false;
		}

		const prevHealth = this.health;
		this.health = Math.max(0, this.health - amount);

		// Crop *just* died this call (crossed from >0 to 0)
		if (prevHealth > 0 && this.health === 0) {
			this.stage = -1;   // For now, destroyed crops use stage 0 (baby art)
			return true;
		}

		return false;
	}


	getHealth(): number {
		return this.health;
	}

	//For newly planted crops
	// resetHealth(): void {
	// 	this.health = 100;
	// }
}
