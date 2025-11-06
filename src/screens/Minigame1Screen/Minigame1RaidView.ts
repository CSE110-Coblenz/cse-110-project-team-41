import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants.ts";
import { TILE_TYPE, MAZE_WIDTH, MAZE_HEIGHT } from "./Minigame1RaidModel.ts";

// Calculate the size of each tile to fit the stage
const TILE_WIDTH = STAGE_WIDTH / MAZE_WIDTH;
const TILE_HEIGHT = STAGE_HEIGHT / MAZE_HEIGHT;

export class Minigame1RaidView implements View {
	private group: Konva.Group;
	private timerText: Konva.Text;
	private eggCountText: Konva.Text; // <-- ADDED: Top UI for egg count
	private player: Konva.Rect;
	private mazeGroup: Konva.Group;
	private popupGroup: Konva.Group; // <-- ADDED: Group for end-game popup
	private popupText: Konva.Text; // <-- ADDED: Text for the popup

	constructor() {
		this.group = new Konva.Group({ visible: false });
		this.mazeGroup = new Konva.Group();
		this.group.add(this.mazeGroup);

		// --- Top UI ---
		this.timerText = new Konva.Text({
			x: STAGE_WIDTH - 150,
			y: 10,
			text: "Time: 30",
			fontSize: 24,
			fontFamily: "Arial",
			fill: "white",
		});
		this.group.add(this.timerText);

		this.eggCountText = new Konva.Text({ // <-- ADDED: Egg count text
			x: 20,
			y: 10,
			text: "Eggs: 0",
			fontSize: 24,
			fontFamily: "Arial",
			fill: "white",
		});
		this.group.add(this.eggCountText);

		// --- Player ---
		this.player = new Konva.Rect({
			x: TILE_WIDTH,
			y: TILE_HEIGHT,
			width: TILE_WIDTH * 0.7,
			height: TILE_HEIGHT * 0.7,
			fill: "#4169E1",
		});
		this.group.add(this.player);

		// --- End-Game Popup ---
		this.popupGroup = new Konva.Group({ // <-- ADDED: Popup group
			x: STAGE_WIDTH / 2 - 150,
			y: STAGE_HEIGHT / 2 - 75,
			visible: false,
		});
		const popupBackground = new Konva.Rect({
			width: 300,
			height: 150,
			fill: "black",
			stroke: "white",
			strokeWidth: 2,
			cornerRadius: 10,
		});
		this.popupText = new Konva.Text({
			width: 300,
			height: 150,
			text: "Time's Up!",
			fontSize: 28,
			fontFamily: "Arial",
			fill: "white",
			align: "center",
			padding: 20,
		});
		this.popupGroup.add(popupBackground);
		this.popupGroup.add(this.popupText);
		this.group.add(this.popupGroup);
	}

	/**
	 * Clears the old maze and draws a new one based on the layout.
	 */
	drawMaze(layout: number[][]): void {
		this.mazeGroup.destroyChildren();

		for (let y = 0; y < layout.length; y++) {
			for (let x = 0; x < layout[y].length; x++) {
				const tileType = layout[y][x];
				let tileColor: string | null = null;
				let isPath = false;

				switch (tileType) {
					case TILE_TYPE.WALL:
						tileColor = "#348C31"; // Dark Grass Green
						break;
					case TILE_TYPE.PATH:
						tileColor = "#8B4513"; // Dirt Brown
						isPath = true;
						break;
					case TILE_TYPE.START:
						tileColor = "#90EE90"; // Light Green
						isPath = true;
						break;
					case TILE_TYPE.EXIT:
						tileColor = "#FF6347"; // Tomato Red
						isPath = true;
						break;
					case TILE_TYPE.EGG: // <-- ADDED: Draw eggs
						tileColor = "#8B4513"; // Draw path underneath
						isPath = true;
						break;
				}

				if (tileColor) {
					const tile = new Konva.Rect({
						x: x * TILE_WIDTH,
						y: y * TILE_HEIGHT,
						width: TILE_WIDTH,
						height: TILE_HEIGHT,
						fill: tileColor,
					});
					this.mazeGroup.add(tile);
				}

				if (tileType === TILE_TYPE.EGG) { // <-- ADDED: Draw egg on top of path
					const egg = new Konva.Ellipse({
						x: x * TILE_WIDTH + TILE_WIDTH / 2,
						y: y * TILE_HEIGHT + TILE_HEIGHT / 2,
						radiusX: TILE_WIDTH / 4,
						radiusY: TILE_HEIGHT / 3,
						fill: "#FFFACD", // LemonChiffon (egg color)
					});
					this.mazeGroup.add(egg);
				}
			}
		}

		// Add a dark overlay to simulate night time
		const nightOverlay = new Konva.Rect({
			x: 0,
			y: 0,
			width: STAGE_WIDTH,
			height: STAGE_HEIGHT,
			fill: "#191970",
			opacity: 0.3,
		});
		this.mazeGroup.add(nightOverlay);
		this.mazeGroup.getLayer()?.draw();
	}

	updatePlayerPosition(x: number, y: number): void {
		const offsetX = (TILE_WIDTH - this.player.width()) / 2;
		const offsetY = (TILE_HEIGHT - this.player.height()) / 2;
		this.player.x(x * TILE_WIDTH + offsetX);
		this.player.y(y * TILE_HEIGHT + offsetY);
		this.group.getLayer()?.draw();
	}

	updateTimer(time: number): void {
		this.timerText.text(`Time: ${time}`);
		this.group.getLayer()?.draw();
	}

	/**
	 * Updates the "Eggs Collected" text on the top UI.
	 */
	updateEggCount(count: number): void { // <-- ADDED: New method
		this.eggCountText.text(`Eggs: ${count}`);
		this.group.getLayer()?.draw();
	}

	/**
	 * Shows the end-game popup with the final egg count.
	 */
	showEndPopup(eggCount: number): void { // <-- ADDED: New method
		this.popupText.text(`Time's Up!\n\nYou collected ${eggCount} eggs!`);
		this.popupGroup.visible(true);
		this.popupGroup.getLayer()?.draw();
	}

	show(): void {
		this.group.visible(true);
		this.popupGroup.visible(false); // Make sure popup is hidden on start
		this.group.getLayer()?.draw();
	}

	hide(): void {
		this.group.visible(false);
		this.group.getLayer()?.draw();
	}

	getGroup(): Konva.Group {
		return this.group;
	}
}