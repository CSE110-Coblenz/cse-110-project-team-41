import Konva from "konva";
import {PLANTER_HEIGHT, PLANTER_WIDTH} from "../../constants.ts";

/**
 * GameScreenView - Renders the game UI using Konva
 */
export class FarmPlanterView {
	private planter: Konva.Rect | null = null;

	constructor(group: Konva.Group, x: number, y: number) {
		this.planter = new Konva.Rect({
			x: x,
			y: y,
			width: PLANTER_WIDTH,
			height: PLANTER_HEIGHT,
			fill: "#00FF00",
		});
		group.add(this.planter);
	}

	getView(): Konva.Rect | null{
		return this.planter;
	}
}
