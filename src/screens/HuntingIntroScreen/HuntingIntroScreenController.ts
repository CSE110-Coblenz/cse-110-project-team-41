import { ScreenController } from "../../types";
import type { ScreenSwitcher } from "../../types";
import { HuntingIntroScreenView } from "./HuntingIntroScreenView";

export class HuntingIntroScreenController extends ScreenController {
  private view: HuntingIntroScreenView;
  private screenSwitcher: ScreenSwitcher;

  constructor(screenSwitcher: ScreenSwitcher) {
    super();
    this.screenSwitcher = screenSwitcher;
    this.view = new HuntingIntroScreenView(() => this.handleStartClick());
  }

  getView(): HuntingIntroScreenView {
    return this.view;
  }

  private handleStartClick(): void {
    this.screenSwitcher.switchToScreen({ type: "minigame2" });
  }
}

