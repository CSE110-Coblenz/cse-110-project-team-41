import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { MainMenuScreenView } from "./MainMenuScreenView.ts";
import { GameStatusController } from "../../controllers/GameStatusController.ts";

/**
 * MenuScreenController - Handles menu interactions
 */
export class MainMenuScreenController extends ScreenController {
	private view: MainMenuScreenView;
	private screenSwitcher: ScreenSwitcher;
	private status: GameStatusController;

	constructor(screenSwitcher: ScreenSwitcher, status: GameStatusController) {
		super();
		this.screenSwitcher = screenSwitcher;
		this.status = status;
		this.view = new MainMenuScreenView(
			() => this.handleStartClick(),
			() => this.handleStartClick2(),
			() => this.handleNewGame(),
			() => this.handleLoadGame(),
		);
	}

	/**
	 * Handle start button click
	 */
	private handleStartClick(): void {
		this.screenSwitcher.switchToScreen({type: "morning"})
	}

	/**
	 * Handle temporary start button click, used for testing
	 */
	private handleStartClick2(): void {
		this.screenSwitcher.switchToScreen({type: "minigame2"})
	}

	private handleNewGame(): void {
		this.status.reset();
		this.screenSwitcher.switchToScreen({ type: "morning" });
	}

	private handleLoadGame(): void {
		if (!this.status.hasSavedState()) {
			if (typeof window !== "undefined" && typeof window.alert === "function") {
				window.alert("No saved game found. Starting a new game instead.");
			}
			this.status.reset();
		}
		this.screenSwitcher.switchToScreen({ type: "morning" });
	}

	/**
	 * Get the view
	 */
	getView(): MainMenuScreenView {
		return this.view;
	}
}
