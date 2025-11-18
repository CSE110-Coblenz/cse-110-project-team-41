/**
 * GameScreenModel - Manages game state
 */
export type CropStage = 0 | 1 | 2;

export class FarmPlanterModel {
	private stage: CropStage = 0;

	getStage(): CropStage {
		return this.stage;
	}

	advanceDay(): void {
		if (this.stage < 2) {
			this.stage = (this.stage + 1) as CropStage;
		}
	}

	harvest(): boolean {
		if (this.stage !== 2) {
			return false;
		}

		this.stage = 0;
		return true;
	}
}
