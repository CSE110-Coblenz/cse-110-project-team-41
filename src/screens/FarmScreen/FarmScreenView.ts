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
	private hudGroup: Konva.Group;
	private hudBanner: Konva.Rect;
	private player: Konva.Rect | null = null;
	private scoreText: Konva.Text;
	private cropText: Konva.Text;
	private mineText: Konva.Text;
	private menuOverlay: Konva.Group;
	private huntMenuOverlay: Konva.Group;
	private eggMenuOverlay: Konva.Group;
	private minesLayer: Konva.Group;
	private defensesLayer: Konva.Group;
	private mines: Konva.Image[] = [];
	private menuButtonHandler: (() => void) | null = null;
	private onDefensePlaceClick: ((x: number, y: number) => void) | null = null;
	private menuSaveHandler: (() => void) | null = null;
	private menuBackHandler: (() => void) | null = null;
	//Event handlers for skip/continue functionality for hunt/egg minigames:
	private huntContinueHandler: (() => void) | null = null;
	private huntSkipHandler: (() => void) | null = null;
	private eggContinueHandler: (() => void) | null = null;
	private eggSkipHandler: (() => void) | null = null;
	private registerEmu: ((emu: FarmEmuController) => void) | null = null;
	private removeEmus: (() => void) | null = null;
	private timerText: Konva.Text;
	private roundText: Konva.Text;
	private mineInstructionText: Konva.Text;
	private mouseX: number = 0;
	private mouseY: number = 0;
	private placementHintDefault = "Press M to place a mine. Select a defense and press T to place it.";

	constructor(
		handleKeydown: (event: KeyboardEvent) => void,
		handleKeyup: (event: KeyboardEvent) => void,
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
			x: STAGE_WIDTH / 2 - 15,
			y: STAGE_HEIGHT / 2,
			width: 30,
			height: 30,
			fill: "#AA0000",
		});
		this.group.add(this.player);
		this.minesLayer = new Konva.Group({ listening: false });
		this.group.add(this.minesLayer);

		this.defensesLayer = new Konva.Group({ listening: false }); // Disabled by default, enabled during planning phase
		
		// Add a transparent rect to capture clicks anywhere on the stage for defense placement
		const defenseClickCatcher = new Konva.Rect({
			x: 0,
			y: 0,
			width: STAGE_WIDTH,
			height: STAGE_HEIGHT,
			fill: "transparent",
		});
		this.defensesLayer.add(defenseClickCatcher);
		
		this.group.add(this.defensesLayer);

		// Add click handler for defense placement during planning phase
		this.defensesLayer.on("click", (e) => {
			if (this.onDefensePlaceClick) {
				const pos = e.target.getStage()?.getPointerPosition();
				if (pos) {
					this.onDefensePlaceClick(pos.x, pos.y);
				}
			}
		});
		this.minesLayer = new Konva.Group({ listening: false });
		this.group.add(this.minesLayer);

		/**
		 * Create improved HUD with dark banner at top
		 */
		this.hudGroup = new Konva.Group({ listening: true });
		
		// Dark banner background
		this.hudBanner = new Konva.Rect({
			x: 0,
			y: 0,
			width: STAGE_WIDTH,
			height: HUD_HEIGHT,
			fill: "rgba(0, 0, 0, 0.6)",
		});
		this.hudGroup.add(this.hudBanner);

		// Score display (left side, stacked)
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
			text: this.placementHintDefault,
			fontSize: 12,
			fontFamily: "Arial",
			fill: "#cccccc",
		});
		this.hudGroup.add(this.mineInstructionText);

		// Three buttons on right side (exact layout from market-options)
		
		// 1. Pause button (grey)
		const pauseGroup = new Konva.Group({ cursor: "pointer", listening: true });
		const pauseBackground = new Konva.Rect({
			x: STAGE_WIDTH - 180,
			y: 20,
			width: 40,
			height: 40,
			fill: "grey",
			cornerRadius: 8,
			listening: true,
		});
		const pauseButton = new Konva.Image({
			x: STAGE_WIDTH - 175,
			y: 25,
			width: 30,
			height: 30,
			image: pauseImage,
			listening: true,
		});
		// Attach event to the GROUP so background doesn't block clicks
		pauseGroup.on("mouseup", () => this.menuButtonHandler?.());
		pauseGroup.on("click", () => this.menuButtonHandler?.());
		pauseGroup.add(pauseBackground);
		pauseGroup.add(pauseButton);
		this.hudGroup.add(pauseGroup);

		// 2. Start Day button (green)
		const startDayGroup = new Konva.Group({ cursor: "pointer", listening: true });
		const startDayBackground = new Konva.Rect({
			x: STAGE_WIDTH - 120,
			y: 20,
			width: 40,
			height: 40,
			fill: "green",
			cornerRadius: 8,
			listening: true,
		});
		const startDayButton = new Konva.Image({
			x: STAGE_WIDTH - 115,
			y: 25,
			width: 30,
			height: 30,
			image: chevronImage,
			listening: true,
		});
		// Attach event to the GROUP so background doesn't block clicks
		startDayGroup.on("mouseup", handleStartDay);
		startDayGroup.on("click", handleStartDay);
		startDayGroup.add(startDayBackground);
		startDayGroup.add(startDayButton);
		this.hudGroup.add(startDayGroup);

		// 3. End Game button (red) - RIGHTMOST button
		const endGameGroup = new Konva.Group({ cursor: "pointer", listening: true });
		const endGameBackground = new Konva.Rect({
			x: STAGE_WIDTH - 60,
			y: 20,
			width: 40,
			height: 40,
			fill: "red",
			cornerRadius: 8,
			listening: true,
		});
		const endGameButton = new Konva.Image({
			x: STAGE_WIDTH - 55,
			y: 25,
			width: 30,
			height: 30,
			image: flagImage,
			listening: true,
		});
		// Attach event to the GROUP so background doesn't block clicks
		endGameGroup.on("mouseup", handleEndGame);
		endGameGroup.on("click", handleEndGame);
		endGameGroup.add(endGameBackground);
		endGameGroup.add(endGameButton);
		this.hudGroup.add(endGameGroup);

		this.group.add(this.hudGroup);

		// Timer display (in HUD)
		this.timerText = new Konva.Text({
			x: STAGE_WIDTH / 2 - 50,
			y: 30,
			text: "Time: 60",
			fontSize: 16,
			fontFamily: "Arial",
			fill: "white",
		});
		this.hudGroup.add(this.timerText);

		//Round display (now shows day, in HUD)
		this.roundText = new Konva.Text({
			x: STAGE_WIDTH / 2 - 150,
			y: 30,
			text: "Day: 1",
			fontSize: 16,
			fontFamily: "Arial",
			fill: "white",
		});
		this.hudGroup.add(this.roundText);

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
			text: "Go to Main Menu",
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

		//Hunting Menu overlay:
		this.huntMenuOverlay = this.createOverlay(
			"You Have An Opportunity to Hunt!!!",
			() => this.huntContinueHandler?.(),
			() => this.huntSkipHandler?.()
		);
		this.group.add(this.huntMenuOverlay);

		//Egg Menu overlay:
		this.eggMenuOverlay = this.createOverlay(
			"You Have An Opportunity to Collect!!!",
			() => this.eggContinueHandler?.(),
			() => this.eggSkipHandler?.()
		);
		this.group.add(this.eggMenuOverlay);

		// Planters
		for (let x = (STAGE_WIDTH / 8) + (PLANTER_WIDTH / 2); x < STAGE_WIDTH; x += (7 * STAGE_WIDTH) / 32 - PLANTER_WIDTH / 8) {
			for (let y = 200; y < (STAGE_HEIGHT); y += (STAGE_HEIGHT - 200) / 4) {
				const planter = new FarmPlanterController(this.group, x, y);
				registerPlanter(planter);
			}
		}

		// Add menu overlay last so it appears on top of everything
		this.group.add(this.menuOverlay);
		//Timer display:
		this.timerText = new Konva.Text({
			x: STAGE_WIDTH - 380,
			y: 20,
			text: "Time: 60",
			fontSize: 32,
			fontFamily: "Arial",
			fill: "white",
		});
		this.group.add(this.timerText);

		//Round display:
		this.roundText = new Konva.Text({
			x: STAGE_WIDTH - 540,
			y: 20,
			text: "Day: 1",
			fontSize: 32,
			fontFamily: "Arial",
			fill: "white",
		});
		this.group.add(this.roundText);
	}

	//For adding overlays to access minigames:
	private createOverlay(msg: string, 
		continueHandler: (() => void) | null, 
		skipHandler: (() => void) | null) {

		const overlay = new Konva.Group({ visible: false });
		const panelWidth = 336;
		const panelHeight = 208;
		const panelX = (STAGE_WIDTH - panelWidth) / 2;
		const panelY = (STAGE_HEIGHT - panelHeight) / 2;

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
			y: panelY + 19,
			width: panelWidth,
			text: msg,
			fontSize: 26,
			fontFamily: "Arial",
			fill: "#333333",
			align: "center",
		});

		const skipButton = new Konva.Group({
			x: panelX + 32,
			y: panelY + 80,
			cursor: "pointer",
		});

		const skipRect = new Konva.Rect({
			width: panelWidth - 64,
			height: 45,
			fill: "#2e7d32",
			cornerRadius: 10,
		});

		const skipText = new Konva.Text({
			text: "Skip",
			fontSize: 20,
			fontFamily: "Arial",
			fill: "white",
			width: panelWidth - 64,
			y: 14,
			align: "center",
		});

		skipButton.add(skipRect);
		skipButton.add(skipText);
		skipButton.on("mouseup", () => {
			skipHandler?.();
		});

		const continueButton = new Konva.Group({
			x: panelX + 32,
			y: panelY + 136,
			cursor: "pointer",
		});

		const continueRect = new Konva.Rect({
			width: panelWidth - 64,
			height: 45,
			fill: "#c62828",
			cornerRadius: 10,
		});

		const continueText = new Konva.Text({
			text: "Continue",
			fontSize: 20,
			fontFamily: "Arial",
			fill: "white",
			width: panelWidth - 64,
			y: 14,
			align: "center",
		});

		continueButton.add(continueRect);
		continueButton.add(continueText);
		continueButton.on("mouseup", () => {
			continueHandler?.();
		});

		overlay.add(overlayBackground);
		overlay.add(overlayPanel);
		overlay.add(overlayTitle);
		overlay.add(skipButton);
		overlay.add(continueButton);

		return overlay
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

	setMenuOptionHandlers(onExit: () => void, onBack: () => void): void {
		this.menuSaveHandler = onExit;
		this.menuBackHandler = onBack;
	}

	//For hunting minigame:
	setHuntMenuOptionHandlers(onSkip: () => void, onCont: () => void){
		this.huntSkipHandler = onSkip;
		this.huntContinueHandler = onCont;
	}

	//For egg collection minigame:

	setEggMenuOptionHandlers(onSkip: () => void, onCont: () => void){
		this.eggSkipHandler = onSkip;
		this.eggContinueHandler = onCont;
	}

	showMenuOverlay(): void {
		this.menuOverlay.moveToTop();
		this.menuOverlay.visible(true);
		this.group.getLayer()?.draw();
	}

	hideMenuOverlay(): void {
		this.menuOverlay.visible(false);
		this.group.getLayer()?.draw();
	}

	//Hide and Show hunt menu:

	showHuntMenuOverlay(): void {
		this.huntMenuOverlay.moveToTop();
		this.huntMenuOverlay.visible(true);
		this.group.getLayer()?.draw();
	}

	hideHuntMenuOverlay(): void {
		this.huntMenuOverlay.visible(false);
		this.group.getLayer()?.draw();
	}

	//Hide and Show egg menu:

	showEggMenuOverlay(): void {
		this.eggMenuOverlay.moveToTop();
		this.eggMenuOverlay.visible(true);
		this.group.getLayer()?.draw();
	}

	hideEggMenuOverlay(): void {
		this.eggMenuOverlay.visible(false);
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

	setDefensePlaceClickHandler(handler: (x: number, y: number) => void): void {
		this.onDefensePlaceClick = handler;
	}

	setPlanningPhaseMode(enabled: boolean): void {
		// Enable/disable defense placement clicks
		this.defensesLayer.listening(enabled);
	}

	addDefense(defenseGroup: Konva.Group): void {
		this.defensesLayer.add(defenseGroup);
		this.group.getLayer()?.draw();
	}

	clearDefenses(): void {
		this.defensesLayer.destroyChildren();
		this.group.getLayer()?.draw();
	}

	getDefensesLayer(): Konva.Group {
		return this.defensesLayer;
	}

	/**
	 * Show the screen
	 */
	show(): void {
		this.group.visible(true);
		this.group.getLayer()?.draw();
	}

	setPlacementHint(text?: string): void {
		this.mineInstructionText.text(text ?? this.placementHintDefault);
		this.group.getLayer()?.draw();
	}

	setPlacementCursor(enabled: boolean): void {
		const stage = this.group.getStage();
		if (stage) {
			stage.container().style.cursor = enabled ? "pointer" : "default";
		}
	}

	getMousePosition(): { x: number; y: number } | null {
		const stage = this.group.getStage();
		if (!stage) {
			return null;
		}
		const pointer = stage.getPointerPosition();
		if (!pointer) {
			return null;
		}
		return { x: pointer.x, y: pointer.y };
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
