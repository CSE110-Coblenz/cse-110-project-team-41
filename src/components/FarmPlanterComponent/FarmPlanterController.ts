import { FarmPlanterModel, type CropStage } from "./FarmPlanterModel.ts";
import { FarmPlanterView } from "./FarmPlanterView.ts";
import Konva from "konva";

export class FarmPlanterController {
	private model: FarmPlanterModel;
	private view: FarmPlanterView;
	private harvestHandler: (() => void) | null = null;

	constructor(group: Konva.Group, startX: number, startY: number) {
		this.model = new FarmPlanterModel();
		this.view = new FarmPlanterView(group, startX, startY);
		this.view.onClick(() => this.handleClick());
		this.view.setStage(this.model.getStage());
	}

	setOnHarvest(handler: () => void): void {
		this.harvestHandler = handler;
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

	private handleClick(): void {
		if (!this.model.harvest()) {
			return;
		}

		this.view.setStage(this.model.getStage());
		this.harvestHandler?.();
	}
}
