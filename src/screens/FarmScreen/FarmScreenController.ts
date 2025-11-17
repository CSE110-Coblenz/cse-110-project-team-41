import { FarmEmuController } from "../../components/FarmEmuComponent/FarmEmuController.ts";
import type { FarmPlanterController } from "../../components/FarmPlanterComponent/FarmPlanterController.ts";
import { GAME_DURATION, ONE_OVER_ROOT_TWO, PLAYER_SPEED } from "../../constants.ts";
import { GameStatusController } from "../../controllers/GameStatusController.ts";
import { AudioManager } from "../../services/AudioManager.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { ScreenController } from "../../types.ts";
import { FarmScreenModel } from "./FarmScreenModel.ts";
import { FarmScreenView } from "./FarmScreenView.ts";

/**
 * GameScreenController - Coordinates game logic between Model and View
 */
export class FarmScreenController extends ScreenController {
	private model: FarmScreenModel;
	private view: FarmScreenView;
	private screenSwitcher: ScreenSwitcher;
	private gameTimer: number | null = null;
	private lastTickTime: number = 0;

	private status: GameStatusController;
	private audio: AudioManager;
	private emus: FarmEmuController[] = [];
	private planters: FarmPlanterController[] = [];

	private playerDirectionX: number = 0;
	private playerDirectionY: number = 0;

	// private squeezeSound: HTMLAudioElement;

	constructor(screenSwitcher: ScreenSwitcher, status: GameStatusController, audio: AudioManager) {
		super();
		this.screenSwitcher = screenSwitcher;
		this.status = status;
		this.audio = audio;

		this.model = new FarmScreenModel();
		this.view = new FarmScreenView(
			(event: KeyboardEvent) => this.handleKeydown(event),
			(event: KeyboardEvent) => this.handleKeyup(event),
			() => this.handleEndDay(),
			(emu: FarmEmuController) => this.registerEmu(emu),
			() => this.removeEmus(),
			(planter: FarmPlanterController) => this.registerPlanter(planter),
		);

		requestAnimationFrame(this.gameLoop);
	}

	private gameLoop = (timestamp: number): void => {
		const deltaTime: number = (timestamp - this.lastTickTime) * 0.001;
		this.lastTickTime = timestamp;

		if (Math.abs(this.playerDirectionX) + Math.abs(this.playerDirectionY) == 2) {
			this.view.movePlayerDelta(
				this.playerDirectionX * PLAYER_SPEED * deltaTime * ONE_OVER_ROOT_TWO,
				this.playerDirectionY * PLAYER_SPEED * deltaTime * ONE_OVER_ROOT_TWO
			);
		} else {
			this.view.movePlayerDelta(
				this.playerDirectionX * PLAYER_SPEED * deltaTime,
				this.playerDirectionY * PLAYER_SPEED * deltaTime
			);
		}

		// Request the next frame
		requestAnimationFrame(this.gameLoop);
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
	 * Start the round
	 */
	startRound(): void {
		// Update view
		this.view.updateScore(this.model.getScore());
		this.view.updateTimer(GAME_DURATION);
		this.view.updateRound(this.model.getRound());
		this.view.show();

		this.startTimer();
	}

	/**
	 * Handle player movement
	 */
	private handleKeydown(event: KeyboardEvent): void {
		const key = event.key;
		switch (key) {
			case "w": this.playerDirectionY = -1; break;
			case "s": this.playerDirectionY = 1; break;
			case "d": this.playerDirectionX = 1; break;
			case "a": this.playerDirectionX = -1; break;
		}
		event.preventDefault();
	}

	/**
	 * Handle player movement
	 */
	private handleKeyup(event: KeyboardEvent): void {
		const key = event.key;
		if (["w", "s"].includes(key)) {
			this.playerDirectionY = 0;
		}
		if (["a", "d"].includes(key)) {
			this.playerDirectionX = 0;
		}
		event.preventDefault();
	}

	/**
	 * Start day
	 */
	private handleEndDay(): void {
		this.endRound();
		this.model.updateSpawn();
		this.view.spawnEmus(this.model.getSpawn());
		for (let i = 0; i < this.emus.length; i++) {
			const target = this.planters[Math.floor(Math.random() * this.planters.length)].getView()
			if (!target) { return }
			this.emus[i].setTarget(target);
		}
		this.startRound();
	}

	/**
	 * Start the countdown timer
	 */
	private startTimer(): void {
		// TODO: Task 3 - Implement countdown timer using setInterval
		let timeRemaining: number = GAME_DURATION;
		const timerId = setInterval(() => {
  			timeRemaining--;
			this.view.updateTimer(timeRemaining);
			if(timeRemaining <= 0){
				this.endRound();
			}
		}, 1000) as unknown as number;
		
		this.gameTimer = timerId;
	}

	/**
	 * Stop the timer
	 */
	private stopTimer(): void {
		if (!this.gameTimer) {
			return
		}
		clearInterval(this.gameTimer);
	}

	/**
	 * End the game
	 */
	private endRound(): void {
		this.stopTimer();
		this.view.clearEmus();
		this.model.incrementRound();
		// Switch to results screen with final score
		// this.screenSwitcher.switchToScreen({
		// 	type: "game_over",
		// 	score: this.model.getScore(),
		// });
	}

	private registerEmu(emu: FarmEmuController): void {
		this.emus.push(emu);
	}

	private removeEmus(): void {
		while(this.emus.length > 0){
			const emu = this.emus.pop();
			if (emu){
				emu.remove();
			}
		}
	}

	private registerPlanter(planter: FarmPlanterController): void {
		this.planters.push(planter);
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
