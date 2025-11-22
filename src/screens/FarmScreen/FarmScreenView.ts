import Konva from "konva";
import type { View } from "../../types.ts";
import {STAGE_WIDTH, STAGE_HEIGHT, PLANTER_WIDTH, HUD_HEIGHT} from "../../constants.ts";
import {FarmPlanterController} from "../../components/FarmPlanterComponent/FarmPlanterController.ts";
import {FarmEmuController} from "../../components/FarmEmuComponent/FarmEmuController.ts";
import mineSrc from "../../../assets/mine.png";
import flagSrc from "../../../assets/flag.png";
import chevronSrc from "../../../assets/chevron.png";
import pauseSrc from "../../../assets/pause.png";

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
const flagImage = createImage(flagSrc);
const chevronImage = createImage(chevronSrc);
const pauseImage = createImage(pauseSrc);
const MINE_SIZE = 42;

/**
 * GameScreenView - Renders the game UI using Konva
 */
export class FarmScreenView implements View {
	private group: Konva.Group;
	private menuGroup: Konva.Group;
	private hudGroup: Konva.Group;

	private scoreText: Konva.Text;
	private cropText: Konva.Text;
	private mineText: Konva.Text;
	private minesLayer: Konva.Group;
	private hudBanner: Konva.Rect;
	private mines: Konva.Image[] = [];
	private menuButtonHandler: (() => void) | null = null;
	private menuSaveHandler: (() => void) | null = null;
	private menuBackHandler: (() => void) | null = null;
	private registerEmu: ((emu: FarmEmuController) => void) | null = null;
	private removeEmus: (() => void )| null = null;
	private mineInstructionText: Konva.Text;
	private mouseX: number = 0;
	private mouseY: number = 0;

	constructor(
		handleKeydown: (event: KeyboardEvent) => void,
		handleStartDay: () => void,
		handleEndGame: () => void,
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

		this.group = new Konva.Group({ visible: false });
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

		/**
		 * Create main components of scene: Background, Planters, Mines
		 */
		const bg = new Konva.Rect({
			x: 0,
			y: 0,
			width: STAGE_WIDTH,
			height: STAGE_HEIGHT,
			fill: "#009900",
		});
		this.group.add(bg);

		for (let x = (STAGE_WIDTH / 8) + (PLANTER_WIDTH / 2); x < STAGE_WIDTH; x += (7 * STAGE_WIDTH) / 32 - PLANTER_WIDTH / 8) {
			for (let y = 200; y < (STAGE_HEIGHT); y += (STAGE_HEIGHT - 200) / 4) {
				const planter = new FarmPlanterController(this.group, x, y);
				registerPlanter(planter);
			}
		}

		this.minesLayer = new Konva.Group({ listening: false });
		this.group.add(this.minesLayer);

		/**
		 * Create primary visual HUD: Status indicators and buttons
		 */
		this.hudGroup = new Konva.Group();
	
		this.hudBanner = new Konva.Rect({
			x: 0,
			y: 0,
			width: STAGE_WIDTH,
			height: HUD_HEIGHT,
			fill: "rgba(0, 0, 0, 0.6)",
		});
		this.hudGroup.add(this.hudBanner);

		this.scoreText = new Konva.Text({
			x: 10,
			y: 10,
			text: "Score: 0",
			fontSize: 14,
			fontFamily: "Arial",
			fill: "white",
		});
		this.hudGroup.add(this.scoreText);

		this.cropText = new Konva.Text({
			x: 10,
			y: 25,
			text: "Crops: 0",
			fontSize: 14,
			fontFamily: "Arial",
			fill: "white",
		});
		this.hudGroup.add(this.cropText);

		this.mineText = new Konva.Text({
			x: 10,
			y: 40,
			text: "Mines: 0",
			fontSize: 14,
			fontFamily: "Arial",
			fill: "white",
		});
		this.hudGroup.add(this.mineText);

		this.mineInstructionText = new Konva.Text({
			x: 10,
			y: 60,
			text: "Press M to place mine at mouse cursor",
			fontSize: 12,
			fontFamily: "Arial",
			fill: "#666666",
		});
		this.hudGroup.add(this.mineInstructionText);

		const pauseGroup = new Konva.Group();
		const pauseButton = new Konva.Image({
			x: STAGE_WIDTH - 175,
			y: 25,
			width: 30,
			height: 30,
			image: pauseImage,
		});
		const pauseBackground = new Konva.Rect({
			x: STAGE_WIDTH - 180,
			y: 20,
			width: 40,
			height: 40,
			fill: "grey",
			cornerRadius: 8,
		})
		pauseButton.on("mouseup", () => this.menuButtonHandler!())
		pauseGroup.add(pauseBackground);
		pauseGroup.add(pauseButton);
		this.hudGroup.add(pauseGroup);

		const startDayGroup = new Konva.Group();
		const startDayButton = new Konva.Image({
			x: STAGE_WIDTH - 115,
			y: 25,
			width: 30,
			height: 30,
			image: chevronImage,
		});
		const startDayBackground = new Konva.Rect({
			x: STAGE_WIDTH - 120,
			y: 20,
			width: 40,
			height: 40,
			fill: "green",
			cornerRadius: 8,
		})
		startDayButton.on("mouseup", handleStartDay)
		startDayGroup.add(startDayBackground);
		startDayGroup.add(startDayButton);
		this.hudGroup.add(startDayGroup);

		const endGameGroup = new Konva.Group();
		const endGameButton = new Konva.Image({
			x: STAGE_WIDTH - 55,
			y: 25,
			width: 30,
			height: 30,
			image: flagImage,
		});
		const endGameBackground = new Konva.Rect({
			x: STAGE_WIDTH - 60,
			y: 20,
			width: 40,
			height: 40,
			fill: "red",
			cornerRadius: 8,
		})
		endGameButton.on("mouseup", handleEndGame)
		endGameGroup.add(endGameBackground);
		endGameGroup.add(endGameButton);
		this.hudGroup.add(endGameGroup);
		
		this.group.add(this.hudGroup);

		/**
		 * Create secondary hidden hud for main menu
		 */
		this.menuGroup = new Konva.Group({ visible: false });

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

		this.menuGroup.add(overlayBackground);
		this.menuGroup.add(overlayPanel);
		this.menuGroup.add(overlayTitle);
		this.menuGroup.add(saveButton);
		this.menuGroup.add(backButton);

		this.group.add(this.menuGroup);
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
		this.menuGroup.visible(true);
		this.group.getLayer()?.draw();
	}

	hideMenuOverlay(): void {
		this.menuGroup.visible(false);
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
