import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { MainMenuScreenView } from "./MainMenuScreenView.ts";

/**
 * MenuScreenController - Handles menu interactions
 */
export class MainMenuScreenController extends ScreenController {
	private view: MainMenuScreenView;
	private screenSwitcher: ScreenSwitcher;

	constructor(screenSwitcher: ScreenSwitcher) {
		super();
		this.screenSwitcher = screenSwitcher;
		this.view = new MainMenuScreenView(() => this.handleStartClick(), () => this.handleStartClick2(), () => this.handleStartClick3());
	}

	/**
	 * Handle start button click
	 */
	private handleStartClick(): void {
		this.screenSwitcher.switchToScreen({type: "morning"})
	}

	private handleStartClick2(): void {
		this.screenSwitcher.switchToScreen({type: "minigame1_raid"})
	}

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
