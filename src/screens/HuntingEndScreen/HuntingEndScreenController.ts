import { ScreenController } from "../../types";
import type { ScreenSwitcher } from "../../types";
import { HuntingEndScreenView } from "./HuntingEndScreenView";

export class HuntingEndScreenController extends ScreenController {
  private view: HuntingEndScreenView;
  private screenSwitcher: ScreenSwitcher;

  constructor(screenSwitcher: ScreenSwitcher) {
    super();
    this.screenSwitcher = screenSwitcher;
    this.view = new HuntingEndScreenView(() => this.handleContinueClick());
  }

  getView(): HuntingEndScreenView {
    return this.view;
  }

  showResults(emusKilled: number, reason: "ammo" | "time" | "victory"): void {
    this.view.updateEmusKilled(emusKilled, reason);
    this.view.show();
  }

  private handleContinueClick(): void {
    // Return to main menu or farm screen
    // You can change this to go back to farm or wherever appropriate
    this.screenSwitcher.switchToScreen({ type: "farm" , newgame:false});
  }
}

