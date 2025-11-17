import { ScreenController } from "../../types";
import type { ScreenSwitcher } from "../../types";
import { Game2EndScreenView } from "./Game2EndScreenView";

export class Game2EndScreenController extends ScreenController {
  private view: Game2EndScreenView;
  private screenSwitcher: ScreenSwitcher;

  constructor(screenSwitcher: ScreenSwitcher) {
    super();
    this.screenSwitcher = screenSwitcher;
    this.view = new Game2EndScreenView(() => this.handleContinueClick());
  }

  getView(): Game2EndScreenView {
    return this.view;
  }

  showResults(emusKilled: number, reason: "ammo" | "time" | "victory"): void {
    this.view.updateEmusKilled(emusKilled, reason);
    this.view.show();
  }

  private handleContinueClick(): void {
    // Return to main menu or farm screen
    // You can change this to go back to farm or wherever appropriate
    this.screenSwitcher.switchToScreen({ type: "main_menu" });
  }
}

