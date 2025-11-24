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

const stageImages: Record<CropStage, HTMLImageElement | null> = {
	[-1]: null, // Empty - no image
	0: createImage(notGrownSrc),
	1: createImage(halfGrownSrc),
	2: createImage(fullyGrownSrc),
};

export class FarmPlanterView {
	private planter: Konva.Rect;
	private crop: Konva.Image;
	private isEmptyState: boolean = true;

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

		const emptyImage = createImage(notGrownSrc); // Temporary image for initialization
		this.crop = new Konva.Image({
			x,
			y,
			width: PLANTER_WIDTH,
			height: PLANTER_HEIGHT,
			image: emptyImage,
			listening: false,
		});
		group.add(this.crop);

		this.setStage(-1); // Start empty
	}

	onClick(handler: () => void): void {
		this.planter.on("click", handler);
	}

	setOnHover(onHover: (isEmpty: boolean) => void, isEmpty: () => boolean): void {
		this.planter.on("mouseenter", () => {
			const empty = isEmpty();
			this.isEmptyState = empty;
			this.updateCursor(true);
			onHover(empty);
		});
		this.planter.on("mouseleave", () => {
			this.updateCursor(false);
			onHover(false);
		});
	}

	setStage(stage: CropStage): void {
		const image = stageImages[stage];
		this.isEmptyState = stage === -1;
		
		if (image === null) {
			// Empty state - hide the crop image
			this.crop.visible(false);
		} else {
			this.crop.visible(true);
			if (!image.complete) {
				image.onload = () => this.crop.getLayer()?.batchDraw();
			}
			this.crop.image(image);
		}
		this.crop.getLayer()?.batchDraw();
	}

	private updateCursor(isHovering: boolean): void {
		const stage = this.planter.getStage();
		if (!stage) return;
		
		const container = stage.container();
		if (isHovering && this.isEmptyState) {
			container.style.cursor = "grab";
		} else {
			container.style.cursor = "default";
		}
	}

	getView(): Konva.Rect | null {
		return this.planter;
	}
}
