import Konva from "konva";
import { PLANTER_HEIGHT, PLANTER_WIDTH } from "../../constants.ts";
import type { CropStage } from "./FarmPlanterModel.ts";
import notGrownSrc from "../../../assets/not_grown.png";
import halfGrownSrc from "../../../assets/half_grown.png";
import fullyGrownSrc from "../../../assets/fully_grown.png";

const createImage = (src: string): HTMLImageElement => {
	if (typeof Image !== "undefined") {
		const image = new Image();
		image.src = src;
		return image;
	}

	const fallback = document.createElement("img") as HTMLImageElement;
	fallback.src = src;
	return fallback;
};

const stageImages: Record<CropStage, HTMLImageElement> = {
	0: createImage(notGrownSrc),
	1: createImage(halfGrownSrc),
	2: createImage(fullyGrownSrc),
};

export class FarmPlanterView {
	private planter: Konva.Rect;
	private crop: Konva.Image;

	constructor(group: Konva.Group, x: number, y: number) {
		this.planter = new Konva.Rect({
			x,
			y,
			width: PLANTER_WIDTH,
			height: PLANTER_HEIGHT,
			fill: "#6d4c41",
			cornerRadius: 6,
			stroke: "#3e2723",
			strokeWidth: 2,
		});
		group.add(this.planter);

		this.crop = new Konva.Image({
			x,
			y,
			width: PLANTER_WIDTH,
			height: PLANTER_HEIGHT,
			listening: false,
		});
		group.add(this.crop);

		this.setStage(0);
	}

	onClick(handler: () => void): void {
		this.planter.on("click", handler);
	}

	setStage(stage: CropStage): void {
		const image = stageImages[stage];
		if (!image.complete) {
			image.onload = () => this.crop.getLayer()?.batchDraw();
		}
		this.crop.image(image);
		this.crop.getLayer()?.batchDraw();
	}

	getView(): Konva.Rect | null {
		return this.planter;
	}
}
