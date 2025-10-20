import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { FarmScreenModel } from "./FarmScreenModel.ts";
import { FarmScreenView } from "./FarmScreenView.ts";
import { GAME_DURATION } from "../../constants.ts";

/**
 * GameScreenController - Coordinates game logic between Model and View
 */
export class FarmScreenController extends ScreenController {
	private model: FarmScreenModel;
	private view: FarmScreenView;
	private screenSwitcher: ScreenSwitcher;
	private gameTimer: number | null = null;

	private squeezeSound: HTMLAudioElement;

	constructor(screenSwitcher: ScreenSwitcher) {
		super();
		this.screenSwitcher = screenSwitcher;

		this.model = new FarmScreenModel();
		this.view = new FarmScreenView(() => this.handleLemonClick());

		// TODO: Task 4 - Initialize squeeze sound audio
		this.squeezeSound = new Audio("/squeeze.mp3"); // Placeholder
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

		// TODO: Task 4 - Play the squeeze sound
		this.squeezeSound.currentTime = 0;
		this.squeezeSound.play();
	}

	/**
	 * End the game
	 */
	private endGame(): void {
		this.stopTimer();

		// Switch to results screen with final score
		this.screenSwitcher.switchToScreen({
			type: "game_over",
			score: this.model.getScore(),
		});
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
