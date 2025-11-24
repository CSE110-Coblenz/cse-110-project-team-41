import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../constants.ts";
import backgroundSrc from "../../../assets/background.png";

const loadImage = (src: string): HTMLImageElement => {
	if (typeof Image !== "undefined") {
		const image = new Image();
		image.src = src;
		return image;
	}

	const fallback = document.createElement("img") as HTMLImageElement;
	fallback.src = src;
	return fallback;
};

export class MainMenuScreenView implements View {
	private group: Konva.Group;
	private background: Konva.Image;
	private backgroundAnimation: Konva.Animation | null = null;
	private backgroundPhase = 0;

	constructor(
		onStartClick: () => void, 
		onStartClick2: () => void, 
		onStartClick3: () => void
	) {
		this.group = new Konva.Group({ visible: true });

		const bgImage = loadImage(backgroundSrc);
		this.background = new Konva.Image({
			x: -20,
			y: -20,
			width: STAGE_WIDTH + 40,
			height: STAGE_HEIGHT + 40,
			image: bgImage,
			listening: false,
		});
		if (bgImage.complete) {
			this.background.image(bgImage);
		} else {
			bgImage.onload = () => {
				this.background.image(bgImage);
				this.group.getLayer()?.batchDraw();
			};
		}
		this.group.add(this.background);

		const title = new Konva.Text({
			x: STAGE_WIDTH / 2,
			y: 120,
			text: "FARM DEFENSE",
			fontSize: 54,
			fontFamily: "Arial",
			fill: "#ffe082",
			stroke: "#ffb300",
			strokeWidth: 2,
			align: "center",
		});
		title.offsetX(title.width() / 2);
		this.group.add(title);

		const startButtonGroup = new Konva.Group();
		const startButton = new Konva.Rect({
			x: STAGE_WIDTH / 2 - 100,
			y: 300,
			width: 200,
			height: 60,
			fill: "green",
			cornerRadius: 10,
			stroke: "darkgreen",
			strokeWidth: 3,
		});
		const startText = new Konva.Text({
			x: STAGE_WIDTH / 2,
			y: 315,
			text: "START GAME",
			fontSize: 24,
			fontFamily: "Arial",
			fill: "white",
			align: "center",
		});
		startText.offsetX(startText.width() / 2);
		startButtonGroup.add(startButton);
		startButtonGroup.add(startText);
		startButtonGroup.on("click", onStartClick);
		this.group.add(startButtonGroup);

		const startButtonGroup2 = new Konva.Group();
    	const startButton2 = new Konva.Rect({
      		x: STAGE_WIDTH / 2 - 100,
      		y: 380,
			width: 200,
			height: 60,
			fill: "green",
			cornerRadius: 10,
			stroke: "darkgreen",
			strokeWidth: 3,
   		 });
   		 const startText2 = new Konva.Text({
			x: STAGE_WIDTH / 2,
			y: 395,
			text: "Start Minigame 1",
			fontSize: 24,
			fontFamily: "Arial",
			fill: "white",
			align: "center",
   		 });
		startText2.offsetX(startText2.width() / 2);
		startButtonGroup2.add(startButton2);
		startButtonGroup2.add(startText2);
		startButtonGroup2.on("click", onStartClick2);
		this.group.add(startButtonGroup2);

		const startButtonGroup3 = new Konva.Group();
    	const startButton3 = new Konva.Rect({
      		x: STAGE_WIDTH / 2 - 100,
      		y: 450,
			width: 200,
			height: 60,
			fill: "green",
			cornerRadius: 10,
			stroke: "darkgreen",
			strokeWidth: 3,
   		 });
   		 const startText3 = new Konva.Text({
			x: STAGE_WIDTH / 2,
			y: 465,
			text: "Start Minigame 2",
			fontSize: 24,
			fontFamily: "Arial",
			fill: "white",
			align: "center",
   		 });
		startText3.offsetX(startText3.width() / 2);
		startButtonGroup3.add(startButton3);
		startButtonGroup3.add(startText3);
		startButtonGroup3.on("click", onStartClick3);
		this.group.add(startButtonGroup3);
	}

	show(): void {
		this.group.visible(true);
		this.startBackgroundAnimation();
		this.group.getLayer()?.draw();
	}

	hide(): void {
		this.group.visible(false);
		this.stopBackgroundAnimation();
		this.group.getLayer()?.draw();
	}

	getGroup(): Konva.Group {
		return this.group;
	}

	private startBackgroundAnimation(): void {
		if (this.backgroundAnimation) return;
		const layer = this.group.getLayer();
		if (!layer) return;

		this.backgroundPhase = 0;
		this.backgroundAnimation = new Konva.Animation((frame) => {
			if (!frame) return;
			this.backgroundPhase += frame.timeDiff * 0.0006;
			const offsetX = Math.sin(this.backgroundPhase) * 10;
			const offsetY = Math.cos(this.backgroundPhase * 0.7) * 6;
			this.background.position({
				x: -20 + offsetX,
				y: -20 + offsetY,
			});
		}, layer);
		this.backgroundAnimation.start();
	}

	private stopBackgroundAnimation(): void {
		this.backgroundAnimation?.stop();
		this.backgroundAnimation = null;
		this.background.position({ x: -20, y: -20 });
	}
}
