import { ScreenController } from "../../types";
import type { ScreenSwitcher } from "../../types";
import { Game2IntroScreenView } from "./Game2IntroScreenView";

export class Game2IntroScreenController extends ScreenController {
  private view: Game2IntroScreenView;
  private screenSwitcher: ScreenSwitcher;

  constructor(screenSwitcher: ScreenSwitcher) {
    super();
    this.screenSwitcher = screenSwitcher;
    this.view = new Game2IntroScreenView(() => this.handleStartClick());
  }

  getView(): Game2IntroScreenView {
    return this.view;
  }

  private handleStartClick(): void {
    this.screenSwitcher.switchToScreen({ type: "minigame2" });
  }
}

