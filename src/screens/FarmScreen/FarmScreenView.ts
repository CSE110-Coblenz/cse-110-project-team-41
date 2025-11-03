import Konva from "konva";
import type { View } from "../../types.ts";
import {STAGE_WIDTH, STAGE_HEIGHT, PLANTER_WIDTH} from "../../constants.ts";
import {FarmPlanterController} from "../../components/FarmPlanterComponent/FarmPlanterController.ts";
import {EmuController} from "../../components/EmuComponent/EmuController.ts";

/**
 * GameScreenView - Renders the game UI using Konva
 */
export class FarmScreenView implements View {
	private group: Konva.Group;
	private player: Konva.Rect | null = null;
	private scoreText: Konva.Text;
	private startDayButton: Konva.Text;
	private registerEmu: (emu: EmuController) => void = null;
	private removeEmus: () => void = null;
	private timerText: Konva.Text;
	private roundText: Konva.Text;

	constructor(
		handleKeydown: (event: KeyboardEvent) => void,
		handleKeyup: (event: KeyboardEvent) => void,
		handleStartDay: () => void,
		registerEmu: (emu: EmuController) => void,
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

		this.player = new Konva.Rect({
			x: 0,
			y: 0,
			width: 30,
			height: 30,
			fill: "#AA0000",
		});
		this.group.add(this.player);

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

		//Round display
		this.roundText = new Konva.Text({
			x: STAGE_WIDTH - 530,
			y: 20,
			text: "Round: 1",
			fontSize: 32,
			fontFamily: "Arial",
			fill: "black",
		});
		this.group.add(this.roundText);

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
			const emu = new EmuController(this.group, Math.random() * STAGE_WIDTH, Math.random() * STAGE_HEIGHT);
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

	/**
	 * Update timer display
	 */
	updateTimer(timeRemaining: number): void {
		this.timerText.text(`Time: ${timeRemaining}`);
		this.group.getLayer()?.draw();
	}

	/**
	 * Update round display
	 */
	updateRound(round: number): void {
		this.roundText.text(`Round: ${round}`);
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
