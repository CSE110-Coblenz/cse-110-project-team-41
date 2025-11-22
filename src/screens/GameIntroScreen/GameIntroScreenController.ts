import Konva from "konva";
import { GameIntroModel } from "./GameIntroScreenModel";
import { GameIntroView } from "./GameIntroScreenView";

export class GameIntroController {
  private model: GameIntroModel;
  private view: GameIntroView;
  private onComplete: () => void;
  private currentPage: number = 0;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

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
    const totalPages = this.model.getPageCount();
    
    this.view.renderPage(text, isLastPage, this.currentPage, totalPages);
  }

  private setupInput(): void {
    // Remove any existing handler
    if (this.keydownHandler) {
      window.removeEventListener("keydown", this.keydownHandler);
    }

    // Create new handler
    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault(); // Prevent page scrolling
        
        if (this.currentPage < this.model.getPageCount() - 1) {
          // Move to next page
          this.currentPage++;
          this.renderCurrentPage();
        } else {
          // Last page - complete intro
          this.completeIntro();
        }
      }
    };

    window.addEventListener("keydown", this.keydownHandler);
  }

  private completeIntro(): void {
    // Remove event listener
    if (this.keydownHandler) {
      window.removeEventListener("keydown", this.keydownHandler);
      this.keydownHandler = null;
    }
    
    this.view.destroy();
    this.onComplete(); // Notify that the intro is complete
  }

  render(): void {
    this.renderCurrentPage();
  }

  destroy(): void {
    // Cleanup method to be called when switching screens
    if (this.keydownHandler) {
      window.removeEventListener("keydown", this.keydownHandler);
      this.keydownHandler = null;
    }
    this.view.destroy();
  }
}
