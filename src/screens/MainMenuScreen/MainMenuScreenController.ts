import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { MainMenuScreenView } from "./MainMenuScreenView.ts";

/**
 * MenuScreenController - Handles menu interactions
 */
export class MainMenuScreenController extends ScreenController {
	private view: MainMenuScreenView;
	private screenSwitcher: any; // Using any to access both switchToScreen and switchToIntroThen methods

	constructor(screenSwitcher: any) {
		super();
		this.screenSwitcher = screenSwitcher;
		this.view = new MainMenuScreenView(() => this.handleStartClick(), () => this.handleStartClick2(), () => this.handleStartClick3());
	}

	/**
	 * Handle start button click - Start Game
	 * Flow: Main Game Intro Screen --> Morning/Market Screen --> Main farming game
	 */
	private handleStartClick(): void {
		this.screenSwitcher.switchToIntroThen(() => {
			this.screenSwitcher.switchToScreen({type: "morning"})
		});
	}

	/**
	 * Handle start minigame 1 button click
	 * Flow: Go directly to Raid minigame (it has its own intro)
	 */
	private handleStartClick2(): void {
		this.screenSwitcher.switchToScreen({type: "minigame1_raid"})
	}

	/**
	 * Handle start minigame 2 button click
	 * Flow: Go directly to Hunting minigame intro (it has its own intro)
	 */
	private handleStartClick3(): void {
		this.screenSwitcher.switchToScreen({type: "minigame2_intro"})
	}

	/**
	 * Get the view
	 */
	getView(): MainMenuScreenView {
		return this.view;
	}
}
