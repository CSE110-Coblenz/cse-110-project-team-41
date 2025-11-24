import { GameIntroModel } from "./GameIntroScreenModel";
import { GameIntroView } from "./GameIntroScreenView";
import type { ScreenSwitcher } from "../../types"; // 1. Import ScreenSwitcher

export class GameIntroController {
  private model: GameIntroModel;
  private view: GameIntroView;
  private screenSwitcher: ScreenSwitcher; // New property
  private currentPage: number = 0;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  // 2. Updated constructor signature
  constructor(screenSwitcher: ScreenSwitcher) {
    this.model = new GameIntroModel();
    this.view = new GameIntroView(); // View no longer needs stage passed in
    this.screenSwitcher = screenSwitcher;

    // Do not render or setup input immediately in constructor, 
    // wait for show() to be called.
    this.view.hide(); 
  }

  // 3. Implement show() and hide()
  show(): void {
    this.currentPage = 0; // Reset to first page
    this.renderCurrentPage();
    this.setupInput();
    this.view.show();
  }

  hide(): void {
    if (this.keydownHandler) {
      window.removeEventListener("keydown", this.keydownHandler);
      this.keydownHandler = null;
    }
    this.view.hide();
  }
  
  // Method to return the view's group, used by App
  getView(): GameIntroView {
    return this.view;
  }

  private renderCurrentPage(): void {
    const text = this.model.getPage(this.currentPage);
    const isLastPage = this.currentPage === this.model.getPageCount() - 1;
    const totalPages = this.model.getPageCount();
    
    this.view.renderPage(text, isLastPage, this.currentPage, totalPages);
  }

  private setupInput(): void {
    if (this.keydownHandler) {
      window.removeEventListener("keydown", this.keydownHandler);
    }

    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        e.preventDefault();
        this.completeIntro(); // Skip directly to the end
        return;
      }
      
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
    // Use screenSwitcher to move to the next screen
    this.screenSwitcher.switchToScreen({ type: "farm" });
  }


  destroy(): void {
    if (this.keydownHandler) {
      window.removeEventListener("keydown", this.keydownHandler);
      this.keydownHandler = null;
    }
    this.view.destroy(); // Now just cleans up view internal resources
  }
}