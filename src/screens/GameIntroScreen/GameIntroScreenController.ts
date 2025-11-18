import { GameIntroModel } from "./GameIntroScreenModel";
import { GameIntroView } from "./GameIntroScreenView";

export class GameIntroController {
  private model: GameIntroModel;
  private view: GameIntroView;
  private onComplete: () => void;
  private currentPage: number = 0;

  constructor(stage: Konva.Stage, onComplete: () => void) {
    this.model = new GameIntroModel();
    this.view = new GameIntroView(stage);
    this.onComplete = onComplete;

    this.renderCurrentPage();
    this.setupInput();
  }

  private renderCurrentPage(): void {
    const text = this.model.getPage(this.currentPage);
    const isLastPage = this.currentPage === this.model.getPageCount() - 1;
    this.view.renderPage(text, isLastPage);

    if (isLastPage) {
      this.view.onStartButtonClick(() => this.completeIntro());
    }
  }

  private setupInput(): void {
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" && this.currentPage < this.model.getPageCount() - 1) {
        this.currentPage++;
        this.renderCurrentPage();
      }
    });
  }

  private completeIntro(): void {
    this.view.destroy();
    this.onComplete(); // Notify that the intro is complete
  }

  render(): void {
    this.renderCurrentPage();
  }
}