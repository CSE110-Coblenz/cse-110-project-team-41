import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../constants.ts";
import backgroundSrc from "../../../assets/background.png";

type ButtonConfig = {
	text: string;
	onClick: () => void;
	y: number;
	fill: string;
};

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
		onStartGame: () => void,
		onStartGame2: () => void,
		onNewGame: () => void,
		onLoadGame: () => void,
	) {
		this.group = new Konva.Group({ visible: true });

		const bgImage = loadImage(backgroundSrc);
		this.background = new Konva.Image({
			x: -20,
			y: -20,
			width: STAGE_WIDTH + 40,
			height: STAGE_HEIGHT + 40,
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

		const buttons: ButtonConfig[] = [
			{ text: "New Game", onClick: onNewGame, y: 220, fill: "#2e7d32" },
			{ text: "Load Game", onClick: onLoadGame, y: 300, fill: "#1565c0" },
			{ text: "Start Game", onClick: onStartGame, y: 380, fill: "#f57c00" },
			{ text: "Start Game 2", onClick: onStartGame2, y: 460, fill: "#6a1b9a" },
		];

		buttons.forEach((btn) => this.group.add(this.createButton(btn)));
	}

	private createButton(config: ButtonConfig): Konva.Group {
		const group = new Konva.Group({ cursor: "pointer" });
		const width = 260;
		const height = 70;
		const x = STAGE_WIDTH / 2 - width / 2;

		const rect = new Konva.Rect({
			x,
			y: config.y,
			width,
			height,
			fill: config.fill,
			cornerRadius: 12,
			stroke: "rgba(255,255,255,0.4)",
			strokeWidth: 2,
			shadowBlur: 10,
			shadowColor: "rgba(0,0,0,0.3)",
			shadowOffset: { x: 0, y: 4 },
		});
		const text = new Konva.Text({
			x: STAGE_WIDTH / 2,
			y: config.y + height / 2 - 12,
			text: config.text.toUpperCase(),
			fontSize: 22,
			fontFamily: "Arial",
			fill: "#ffffff",
			align: "center",
			fontStyle: "bold",
		});
		text.offsetX(text.width() / 2);

		group.add(rect);
		group.add(text);
		group.on("click", config.onClick);
		group.on("tap", config.onClick);
		return group;
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
