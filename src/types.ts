import type { Group } from "konva/lib/Group";

export interface View {
	getGroup(): Group;
	show(): void;
	hide(): void;
}

/**
 * Screen types for navigation
 *
 * - "main_menu": Main menu screen
 * - "farm": Gameplay screen
 * - "game_over": Results screen with final score
 *   - score: Final score to display on results screen
 */
export type Screen =
	| { type: "main_menu" }
	| { type: "farm" }
	| { type: "minigame2" }
	| { type: "morning" }
	| { type: "game_over"; score: number };

export abstract class ScreenController {
	abstract getView(): View;

	show(): void {
		this.getView().show();
	}

	hide(): void {
		this.getView().hide();
	}
}

export interface ScreenSwitcher {
	switchToScreen(screen: Screen): void;
}
