import { FarmPlanterModel } from "./FarmPlanterModel.ts";
import { FarmPlanterView } from "./FarmPlanterView.ts";
import Konva from "konva";

/**
 * GameScreenController - Coordinates game logic between Model and View
 */
export class FarmPlanterController {
	private model: FarmPlanterModel;
	private view: FarmPlanterView;

	constructor(group: Konva.Group, startX: number, startY: number) {
		this.model = new FarmPlanterModel();
		this.view = new FarmPlanterView(group, startX, startY);
	}

	getView(): Konva.Rect | null {
		return this.view.getView();
	}
}
