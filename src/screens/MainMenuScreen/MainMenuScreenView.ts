import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH } from "../../constants.ts";

/**
 * MenuScreenView - Renders the menu screen
 */
export class MainMenuScreenView implements View {
	private group: Konva.Group;

	constructor(onStartClick: () => void, onStartClick2: () => void) {
		this.group = new Konva.Group({ visible: true });

		// Title text
		const title = new Konva.Text({
			x: STAGE_WIDTH / 2,
			y: 150,
			text: "LEMON CLICKER",
			fontSize: 48,
			fontFamily: "Arial",
			fill: "yellow",
			stroke: "orange",
			strokeWidth: 2,
			align: "center",
		});
		// Center the text using offsetX
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
      		y: 400,
			width: 200,
			height: 60,
			fill: "green",
			cornerRadius: 10,
			stroke: "darkgreen",
			strokeWidth: 3,
   		 });
   		 const startText2 = new Konva.Text({
			x: STAGE_WIDTH / 2,
			y: 415,
			text: "START GAME2",
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
	}

	/**
	 * Show the screen
	 */
	show(): void {
		this.group.visible(true);
		this.group.getLayer()?.draw();
	}

	/**
	 * Hide the screen
	 */
	hide(): void {
		this.group.visible(false);
		this.group.getLayer()?.draw();
	}

	getGroup(): Konva.Group {
		return this.group;
	}
}
