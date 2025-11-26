import Konva from "konva";
import type { View } from "../../types";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants";
import { TILE_TYPE, MAZE_WIDTH, MAZE_HEIGHT } from "./RaidModel";

// Calculate the size of each tile to fit the stage
const TILE_WIDTH = STAGE_WIDTH / MAZE_WIDTH;
const TILE_HEIGHT = STAGE_HEIGHT / MAZE_HEIGHT;

export class RaidView implements View {
	private group: Konva.Group;
	private timerText: Konva.Text;
	private eggCountText: Konva.Text;
	private player: Konva.Rect;
	private mazeGroup: Konva.Group;
	
	// Popups
	private popupGroup: Konva.Group;
	private popupText: Konva.Text;
	private popupBg: Konva.Rect;

	// Intro Screen
	private introGroup: Konva.Group;

	constructor(onIntroStartClick: () => void) {
		this.group = new Konva.Group({ visible: false });
		this.mazeGroup = new Konva.Group();
		this.group.add(this.mazeGroup);

		// Timer UI
		this.timerText = new Konva.Text({
			x: STAGE_WIDTH - 150,
			y: 10,
			text: "Time: 30",
			fontSize: 24,
			fontFamily: "Arial",
			fill: "white",
		});
		this.group.add(this.timerText);

		// Egg Count UI
		this.eggCountText = new Konva.Text({
			x: 20,
			y: 10,
			text: "Eggs: 0",
			fontSize: 24,
			fontFamily: "Arial",
			fill: "white",
		});
		this.group.add(this.eggCountText);

		// Player
		this.player = new Konva.Rect({
			x: 0,
			y: 0,
			width: TILE_WIDTH * 0.7,
			height: TILE_HEIGHT * 0.7,
			fill: "#4169E1",
		});
		this.group.add(this.player);

		// --- End Game Popup Group ---
		this.popupGroup = new Konva.Group({
			x: STAGE_WIDTH / 2 - 200,
			y: STAGE_HEIGHT / 2 - 100,
			visible: false,
		});
		this.popupBg = new Konva.Rect({
			width: 400,
			height: 200,
			fill: "black",
			stroke: "white",
			strokeWidth: 4,
			cornerRadius: 10,
			shadowColor: "black",
			shadowBlur: 10,
			shadowOpacity: 0.5,
		});
		this.popupText = new Konva.Text({
			width: 400,
			height: 200,
			text: "",
			fontSize: 24,
			fontFamily: "Arial",
			fill: "white",
			align: "center",
			verticalAlign: "middle",
			padding: 20,
		});
		this.popupGroup.add(this.popupBg);
		this.popupGroup.add(this.popupText);
		this.group.add(this.popupGroup);

		// --- Intro Screen Group ---
		this.introGroup = new Konva.Group({ visible: false });
		
		// Intro Background (Dark Overlay)
		const introBg = new Konva.Rect({
			width: STAGE_WIDTH,
			height: STAGE_HEIGHT,
			fill: "rgba(0, 0, 0, 0.90)", // Slightly darker for readability
		});
		this.introGroup.add(introBg);

		// Intro Text (Moved UP to y: 30 to make room)
		const introText = new Konva.Text({
			x: STAGE_WIDTH / 2,
			y: 30, 
			text: "NIGHT RAID\n\nInfiltrate the Emu Nest!\n\nControls:\n[W, A, S, D] to Move\n[SPACE] to Break Walls\n\nCollect 5 Eggs and reach the RED EXIT\nbefore time runs out!",
			fontSize: 28,
			fontFamily: "Arial",
			fill: "white",
			align: "center",
			lineHeight: 1.5,
		});
		introText.offsetX(introText.width() / 2);
		this.introGroup.add(introText);

		// Start Button (Moved DOWN to y: 480 to avoid overlap)
		const startBtnGroup = new Konva.Group({
			x: STAGE_WIDTH / 2 - 100,
			y: 480,
		});
		const startBtnRect = new Konva.Rect({
			width: 200,
			height: 60,
			fill: "green",
			cornerRadius: 10,
			stroke: "white",
			strokeWidth: 2,
			cursor: "pointer",
		});
		const startBtnText = new Konva.Text({
			width: 200,
			height: 60,
			text: "START RAID",
			fontSize: 24,
			fontFamily: "Arial",
			fill: "white",
			align: "center",
			verticalAlign: "middle",
			listening: false,
		});
		
		startBtnGroup.add(startBtnRect);
		startBtnGroup.add(startBtnText);
		startBtnRect.on("click", onIntroStartClick);
		
		startBtnRect.on("mouseenter", () => {
			const stage = this.group.getStage();
			if (stage) stage.container().style.cursor = "pointer";
		});
		startBtnRect.on("mouseleave", () => {
			const stage = this.group.getStage();
			if (stage) stage.container().style.cursor = "default";
		});

		this.introGroup.add(startBtnGroup);
		this.group.add(this.introGroup);
	}

	drawMaze(layout: number[][]): void {
		this.mazeGroup.destroyChildren();
		for (let y = 0; y < layout.length; y++) {
			for (let x = 0; x < layout[y].length; x++) {
				const type = layout[y][x];
				let color = type === TILE_TYPE.WALL ? "#348C31" : "#8B4513";
				if (type === TILE_TYPE.START) color = "#90EE90";
				if (type === TILE_TYPE.EXIT) color = "#FF6347";
				
				this.mazeGroup.add(new Konva.Rect({
					x: x * TILE_WIDTH,
					y: y * TILE_HEIGHT,
					width: TILE_WIDTH,
					height: TILE_HEIGHT,
					fill: color,
				}));

				if (type === TILE_TYPE.EGG) {
					this.mazeGroup.add(new Konva.Ellipse({
						x: x * TILE_WIDTH + TILE_WIDTH / 2,
						y: y * TILE_HEIGHT + TILE_HEIGHT / 2,
						radiusX: TILE_WIDTH / 4,
						radiusY: TILE_HEIGHT / 3,
						fill: "#FFFACD",
					}));
				}
			}
		}
		// Night overlay
		this.mazeGroup.add(new Konva.Rect({
			width: STAGE_WIDTH,
			height: STAGE_HEIGHT,
			fill: "#191970",
			opacity: 0.3,
			listening: false
		}));
		this.mazeGroup.getLayer()?.draw();
	}

	updatePlayerPosition(x: number, y: number): void {
		this.player.x(x * TILE_WIDTH + (TILE_WIDTH - this.player.width()) / 2);
		this.player.y(y * TILE_HEIGHT + (TILE_HEIGHT - this.player.height()) / 2);
		this.group.getLayer()?.draw();
	}

	updateTimer(t: number): void {
		this.timerText.text(`Time: ${t}`);
		this.group.getLayer()?.draw();
	}

	updateEggCount(c: number): void {
		this.eggCountText.text(`Eggs: ${c}`);
		this.group.getLayer()?.draw();
	}

	showEndPopup(message: string): void {
		this.popupText.text(message);
		this.popupGroup.visible(true);
		this.popupGroup.moveToTop();
		this.group.getLayer()?.draw();
	}

	// --- Intro Screen Methods ---
	showIntro(): void {
		this.introGroup.visible(true);
		this.introGroup.moveToTop();
		this.group.getLayer()?.draw();
	}

	hideIntro(): void {
		this.introGroup.visible(false);
		this.group.getLayer()?.draw();
	}

	show(): void {
		this.group.visible(true);
		this.popupGroup.visible(false);
		this.group.moveToTop();
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