import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { FarmScreenModel } from "./FarmScreenModel.ts";
import { FarmScreenView } from "./FarmScreenView.ts";
import { GAME_DURATION } from "../../constants.ts";
import { GameStatusController } from "../../controllers/GameStatusController.ts";
import { AudioManager } from "../../services/AudioManager.ts";

/**
 * GameScreenController - Coordinates game logic between Model and View
 */
export class FarmScreenController extends ScreenController {
	private model: FarmScreenModel;
	private view: FarmScreenView;
	private screenSwitcher: ScreenSwitcher;
	private gameTimer: number | null = null;

	private status: GameStatusController;
	private audio: AudioManager;

	constructor(screenSwitcher: ScreenSwitcher, status: GameStatusController, audio: AudioManager) {
		super();
		this.screenSwitcher = screenSwitcher;
		this.status = status;
		this.audio = audio;

		this.model = new FarmScreenModel();
		this.view = new FarmScreenView(() => this.handleLemonClick());

		// Audio provided via AudioManager
}

	/**
	 * Start the game
	 */
	startGame(): void {
		// Reset model state
		this.model.reset();

		// Update view
		this.view.updateScore(this.model.getScore());
		this.view.updateTimer(GAME_DURATION);
		this.view.show();

		this.startTimer();
	}

	/**
	 * Start the countdown timer
	 */
	private startTimer(): void {
		var timeRemaining = GAME_DURATION;
		this.gameTimer = setInterval(() => {
			timeRemaining = timeRemaining - 1;
			this.view.updateTimer(timeRemaining);
			if (timeRemaining <= 0) {
				this.endGame();
			}
		}, 1000);
	}

	/**
	 * Stop the timer
	 */
	private stopTimer(): void {
		if (!this.gameTimer) {
			return
		}
		clearInterval(this.gameTimer);
		this.gameTimer = null;
	}

	/**
	 * Handle lemon click event
	 */
	private handleLemonClick(): void {
		// Update model
		this.model.incrementScore();

		// Update view
		this.view.updateScore(this.model.getScore());
		this.view.randomizeLemonPosition();

		// Play harvest sound and add to inventory for morning events
		this.status.addToInventory("crop", 1);
		this.audio.playSfx("harvest");
	}

	/**
	 * End the game
	 */
	private endGame(): void {
		this.stopTimer();

		// End the day and go to morning events screen
		this.status.endDay();
		this.screenSwitcher.switchToScreen({ type: "morning" });
	}

	/**
	 * Get final score
	 */
	getFinalScore(): number {
		return this.model.getScore();
	}

	/**
	 * Get the view group
	 */
	getView(): FarmScreenView {
		return this.view;
	}
}
