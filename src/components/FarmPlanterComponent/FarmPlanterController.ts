import { FarmPlanterModel, type CropStage } from "./FarmPlanterModel.ts";
import { FarmPlanterView } from "./FarmPlanterView.ts";
import type { GameStatusController } from "../../controllers/GameStatusController.ts";
import { GameItem } from "../../constants.ts";
import Konva from "konva";

export class FarmPlanterController {
	private model: FarmPlanterModel;
	private view: FarmPlanterView;
	private harvestHandler: (() => void) | null = null;
	private plantHandler: (() => void) | null = null;
	private status: GameStatusController | null = null;

	constructor(group: Konva.Group, startX: number, startY: number, status: GameStatusController | null = null) {
		this.model = new FarmPlanterModel();
		this.view = new FarmPlanterView(group, startX, startY);
		this.status = status;
		this.view.onClick(() => this.handleClick());
		this.view.setOnHover(
			(_isEmpty: boolean) => {
				// Cursor is handled by the view itself
			},
			() => this.model.isEmpty()
		);
		this.view.setStage(this.model.getStage());
	}

	setOnHarvest(handler: () => void): void {
		this.harvestHandler = handler;
	}

	setOnPlant(handler: () => void): void {
		this.plantHandler = handler;
	}

	setStatus(status: GameStatusController): void {
		this.status = status;
	}

	advanceDay(): void {
		this.model.advanceDay();
		this.view.setStage(this.model.getStage());
	}

	getView(): Konva.Rect | null {
		return this.view.getView();
	}

	getStage(): CropStage {
		return this.model.getStage();
	}

	isEmpty(): boolean {
		return this.model.isEmpty();
	}

	destroyCrop(): boolean {
		// Destroy crop if it exists (any stage)
		if (this.model.destroy()) {
			this.view.setStage(this.model.getStage());
			return true;
		}
		return false;
	}

	private handleClick(): void {
		// If empty, try to plant
		if (this.model.isEmpty()) {
			if (this.status && this.status.getItemCount(GameItem.Crop) > 0) {
				if (this.model.plant()) {
					this.status.removeFromInventory(GameItem.Crop, 1);
					this.view.setStage(this.model.getStage());
					this.plantHandler?.();
				}
			}
			return;
		}

		// If fully grown, harvest
		if (this.model.getStage() === 2) {
			if (this.model.harvest()) {
				this.view.setStage(this.model.getStage());
				this.harvestHandler?.();
			}
		}
	}
}
