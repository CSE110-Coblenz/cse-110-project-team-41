/**
 * GameScreenModel - Manages game state
 */
export type CropStage = 0 | 1 | 2 | -1; // -1 = empty, 0 = planted, 1 = half grown, 2 = fully grown

export class FarmPlanterModel {
	private stage: CropStage = -1; // Start empty

	getStage(): CropStage {
		return this.stage;
	}

	isEmpty(): boolean {
		return this.stage === -1;
	}

	plant(): boolean {
		if (this.stage !== -1) {
			return false; // Can only plant in empty slots
		}
		this.stage = 0;
		return true;
	}

	advanceDay(): void {
		if (this.stage >= 0 && this.stage < 2) {
			this.stage = (this.stage + 1) as CropStage;
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
		return true;
	}
}
