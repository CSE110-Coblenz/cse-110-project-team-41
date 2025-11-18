import Konva from "konva";
import type { View } from "../../types.ts";
import {STAGE_WIDTH, STAGE_HEIGHT, PLANTER_WIDTH} from "../../constants.ts";
import {FarmPlanterController} from "../../components/FarmPlanterComponent/FarmPlanterController.ts";
import {FarmEmuController} from "../../components/FarmEmuComponent/FarmEmuController.ts";
import mineSrc from "../../../assets/mine.png";

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

const mineImage = createImage(mineSrc);
const MINE_SIZE = 42;

/**
 * GameScreenView - Renders the game UI using Konva
 */
export class FarmScreenView implements View {
	private group: Konva.Group;
	private player: Konva.Rect | null = null;
	private scoreText: Konva.Text;
	private cropText: Konva.Text;
	private mineText: Konva.Text;
	private startDayButton: Konva.Text;
	private menuButton: Konva.Group;
	private menuOverlay: Konva.Group;
	private minesLayer: Konva.Group;
	private mines: Konva.Image[] = [];
	private menuButtonHandler: (() => void) | null = null;
	private menuSaveHandler: (() => void) | null = null;
	private menuBackHandler: (() => void) | null = null;
	private registerEmu: (emu: FarmEmuController) => void = null;
	private removeEmus: () => void = null;
	private timerText: Konva.Text;
	private roundText: Konva.Text;
	private mineInstructionText: Konva.Text;
	private mouseX: number = 0;
	private mouseY: number = 0;

	constructor(
		handleKeydown: (event: KeyboardEvent) => void,
		handleKeyup: (event: KeyboardEvent) => void,
		handleStartDay: () => void,
		registerEmu: (emu: FarmEmuController) => void,
		removeEmus: () => void,
		registerPlanter: (planter: FarmPlanterController) => void,
	) {
		this.registerEmu = registerEmu;
		this.removeEmus = removeEmus;

		window.addEventListener("keydown", (event) => {
			const keyboardEvent = event as KeyboardEvent;
			handleKeydown(keyboardEvent);
		});
		window.addEventListener("keyup", (event) => {
			const keyboardEvent = event as KeyboardEvent;
			handleKeyup(keyboardEvent);
		});

		this.group = new Konva.Group({ visible: false });

		// Background
		const bg = new Konva.Rect({
			x: 0,
			y: 0,
			width: STAGE_WIDTH,
			height: STAGE_HEIGHT,
			fill: "#009900", // Sky blue
		});
		this.group.add(bg);

		// Track mouse position for mine placement
		this.group.on("mousemove", (e) => {
			const stage = e.target.getStage();
			if (stage) {
				const pointerPos = stage.getPointerPosition();
				if (pointerPos) {
					this.mouseX = pointerPos.x;
					this.mouseY = pointerPos.y;
				}
			}
		});

		this.player = new Konva.Rect({
			x: 0,
			y: 0,
			width: 30,
			height: 30,
			fill: "#AA0000",
		});
		this.group.add(this.player);
		this.minesLayer = new Konva.Group({ listening: false });
		this.group.add(this.minesLayer);

		// Score display (top-left)
		this.scoreText = new Konva.Text({
			x: 20,
			y: 20,
			text: "Score: 0",
			fontSize: 32,
			fontFamily: "Arial",
			fill: "black",
		});
		this.group.add(this.scoreText);

		this.cropText = new Konva.Text({
			x: 20,
			y: 60,
			text: "Crops: 0",
			fontSize: 28,
			fontFamily: "Arial",
			fill: "black",
		});
		this.group.add(this.cropText);

		this.mineText = new Konva.Text({
			x: 20,
			y: 92,
			text: "Mines: 0",
			fontSize: 22,
			fontFamily: "Arial",
			fill: "black",
		});
		this.group.add(this.mineText);

		this.mineInstructionText = new Konva.Text({
			x: 20,
			y: 120,
			text: "Press M to place mine at mouse cursor",
			fontSize: 16,
			fontFamily: "Arial",
			fill: "#666666",
		});
		this.group.add(this.mineInstructionText);

		this.menuButton = new Konva.Group({
			x: STAGE_WIDTH / 2 - 80,
			y: 130,
			cursor: "pointer",
		});

		const menuButtonRect = new Konva.Rect({
			width: 160,
			height: 50,
			fill: "#c62828",
			cornerRadius: 8,
			stroke: "#ffffff",
			strokeWidth: 2,
		});

		const menuButtonText = new Konva.Text({
			text: "Menu",
			fontSize: 24,
			fontFamily: "Arial",
			fill: "white",
			width: 160,
			height: 50,
			y: 12,
			align: "center",
		});

		this.menuButton.add(menuButtonRect);
		this.menuButton.add(menuButtonText);
		this.menuButton.on("mouseup", () => {
			this.menuButtonHandler?.();
		});
		this.group.add(this.menuButton);

		// Start day button display
		this.startDayButton = new Konva.Text({
			x: STAGE_WIDTH - 150,
			y: 20,
			text: "End Day",
			fontSize: 32,
			fontFamily: "Arial",
			fill: "red",
		});
		this.startDayButton.on("mouseup", handleStartDay)
		this.group.add(this.startDayButton);

		// Timer display
		this.timerText = new Konva.Text({
			x: STAGE_WIDTH - 300,
			y: 20,
			text: "Time: 60",
			fontSize: 32,
			fontFamily: "Arial",
			fill: "blue",
		});
		this.group.add(this.timerText);

		//Round display (now shows day)
		this.roundText = new Konva.Text({
			x: STAGE_WIDTH - 530,
			y: 20,
			text: "Day: 1",
			fontSize: 32,
			fontFamily: "Arial",
			fill: "black",
		});
		this.group.add(this.roundText);

		this.menuOverlay = new Konva.Group({ visible: false });

		const overlayBackground = new Konva.Rect({
			x: 0,
			y: 0,
			width: STAGE_WIDTH,
			height: STAGE_HEIGHT,
			fill: "rgba(0, 0, 0, 0.55)",
		});
		overlayBackground.on("mouseup", (evt) => {
			evt.cancelBubble = true;
		});

		const panelWidth = 420;
		const panelHeight = 260;
		const panelX = (STAGE_WIDTH - panelWidth) / 2;
		const panelY = (STAGE_HEIGHT - panelHeight) / 2;

		const overlayPanel = new Konva.Rect({
			x: panelX,
			y: panelY,
			width: panelWidth,
			height: panelHeight,
			fill: "#f5f5f5",
			stroke: "#333333",
			strokeWidth: 2,
			cornerRadius: 12,
		});

		const overlayTitle = new Konva.Text({
			x: panelX,
			y: panelY + 24,
			width: panelWidth,
			text: "Pause Menu",
			fontSize: 32,
			fontFamily: "Arial",
			fill: "#333333",
			align: "center",
		});

		const saveButton = new Konva.Group({
			x: panelX + 40,
			y: panelY + 100,
			cursor: "pointer",
		});

		const saveRect = new Konva.Rect({
			width: panelWidth - 80,
			height: 56,
			fill: "#2e7d32",
			cornerRadius: 10,
		});

		const saveText = new Konva.Text({
			text: "Save & Main Menu",
			fontSize: 24,
			fontFamily: "Arial",
			fill: "white",
			width: panelWidth - 80,
			y: 14,
			align: "center",
		});

		saveButton.add(saveRect);
		saveButton.add(saveText);
		saveButton.on("mouseup", () => {
			this.menuSaveHandler?.();
		});

		const backButton = new Konva.Group({
			x: panelX + 40,
			y: panelY + 170,
			cursor: "pointer",
		});

		const backRect = new Konva.Rect({
			width: panelWidth - 80,
			height: 56,
			fill: "#c62828",
			cornerRadius: 10,
		});

		const backText = new Konva.Text({
			text: "Back to Game",
			fontSize: 24,
			fontFamily: "Arial",
			fill: "white",
			width: panelWidth - 80,
			y: 14,
			align: "center",
		});

		backButton.add(backRect);
		backButton.add(backText);
		backButton.on("mouseup", () => {
			this.menuBackHandler?.();
		});

		this.menuOverlay.add(overlayBackground);
		this.menuOverlay.add(overlayPanel);
		this.menuOverlay.add(overlayTitle);
		this.menuOverlay.add(saveButton);
		this.menuOverlay.add(backButton);
		this.group.add(this.menuOverlay);

		// Planters
		for (let x = (STAGE_WIDTH / 8) + (PLANTER_WIDTH / 2); x < STAGE_WIDTH; x += (7 * STAGE_WIDTH) / 32 - PLANTER_WIDTH / 8) {
			for (let y = 200; y < (STAGE_HEIGHT); y += (STAGE_HEIGHT - 200) / 4) {
				const planter = new FarmPlanterController(this.group, x, y);
				registerPlanter(planter);
			}
		}
	}

	spawnEmus(n: number): void {
		if (!this.registerEmu) return;

		for (let i = 0; i < n; i++) {
			const emu = new FarmEmuController(this.group, Math.random() * STAGE_WIDTH, Math.random() * STAGE_HEIGHT);
			this.registerEmu(emu);
		}
	}

	clearEmus(): void {
		if (!this.removeEmus) return;
		this.removeEmus();
		/**
		 * Should remove all emu objects from the game
		 * Is called when the timer ends
		 */
	}

	/**
	 * Update score display
	 */
	updateScore(score: number): void {
		this.scoreText.text(`Score: ${score}`);
		this.group.getLayer()?.draw();
	}

	updateCropCount(count: number): void {
		this.cropText.text(`Crops: ${count}`);
		this.group.getLayer()?.draw();
	}

	updateMineCount(count: number): void {
		this.mineText.text(`Mines: ${count}`);
		this.group.getLayer()?.draw();
	}

	setMenuButtonHandler(handler: () => void): void {
		this.menuButtonHandler = handler;
	}

	setMenuOptionHandlers(onSave: () => void, onBack: () => void): void {
		this.menuSaveHandler = onSave;
		this.menuBackHandler = onBack;
	}

	showMenuOverlay(): void {
		this.menuOverlay.visible(true);
		this.group.getLayer()?.draw();
	}

	hideMenuOverlay(): void {
		this.menuOverlay.visible(false);
		this.group.getLayer()?.draw();
	}

	deployMineAtMouse(): { node: Konva.Image; size: number } | null {
		const mine = new Konva.Image({
			x: this.mouseX - MINE_SIZE / 2,
			y: this.mouseY - MINE_SIZE / 2,
			width: MINE_SIZE,
			height: MINE_SIZE,
			image: mineImage,
			listening: false,
		});
		this.minesLayer.add(mine);
		this.mines.push(mine);
		this.group.getLayer()?.draw();
		return { node: mine, size: MINE_SIZE };
	}

	removeMineSprite(node: Konva.Image): void {
		const idx = this.mines.indexOf(node);
		if (idx >= 0) {
			this.mines.splice(idx, 1);
		}
		node.destroy();
		this.group.getLayer()?.draw();
	}

	clearMines(): void {
		this.mines.forEach((mine) => mine.destroy());
		this.mines = [];
		this.minesLayer.destroyChildren();
		this.group.getLayer()?.draw();
	}

	/**
	 * Update timer display
	 */
	updateTimer(timeRemaining: number): void {
		this.timerText.text(`Time: ${timeRemaining}`);
		this.group.getLayer()?.draw();
	}

	/**
	 * Update round display (now shows day)
	 */
	updateRound(day: number): void {
		this.roundText.text(`Day: ${day}`);
		this.group.getLayer()?.draw();
	}

	/**
	 * Move the player a certain distance in a cardinal vector
	 *
	 * @param dx
	 * @param dy
	 */
	movePlayerDelta(dx: number, dy: number): void {
		if (!this.player) return;
		this.player.x(this.player.x() + dx);
		this.player.y(this.player.y() + dy);
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
