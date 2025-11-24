import Konva from "konva";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants"; 

export class GameIntroView {
  private group: Konva.Group; 
  private textNode: Konva.Text | null = null;

  constructor() {
    this.group = new Konva.Group({
        visible: false, // Default to hidden
    });
  }

  // method to return the root Konva Group
  getGroup(): Konva.Group {
      return this.group;
  }

  // methods for visibility
  show(): void {
      this.group.show();
      this.group.getLayer()?.draw();
  }

  hide(): void {
      this.group.hide();
      this.group.getLayer()?.draw();
  }

  renderPage(text: string, isLastPage: boolean, currentPage: number, totalPages: number): void {
    this.group.destroyChildren(); // Clear previous content

    // Add background
    const background = new Konva.Rect({
      x: 0,
      y: 0,
      width: STAGE_WIDTH, // Use constant dimensions
      height: STAGE_HEIGHT,
      fill: "#2c3e50",
    });
    this.group.add(background);

    // Render the page text with larger font
    this.textNode = new Konva.Text({
      x: 60,
      y: 100,
      width: STAGE_WIDTH - 120,
      text: text,
      fontSize: 28,
      fontFamily: "Arial, sans-serif",
      fill: "#ecf0f1",
      align: "center",
      lineHeight: 1.5,
    });
    this.group.add(this.textNode);

    // Add page indicator
    const pageIndicator = new Konva.Text({
      x: STAGE_WIDTH / 2 - 100,
      y: STAGE_HEIGHT - 80,
      width: 200,
      text: `Page ${currentPage + 1} of ${totalPages}`,
      fontSize: 16,
      fontFamily: "Arial",
      fill: "#95a5a6",
      align: "center",
    });
    this.group.add(pageIndicator);

    // Add "Press SPACEBAR to continue" instruction (on all pages)
    const instruction = new Konva.Text({
      x: STAGE_WIDTH / 2 - 150,
      y: STAGE_HEIGHT - 50,
      width: 300,
      text: isLastPage ? "Press SPACEBAR to START GAME" : "Press SPACEBAR to continue", // Minor text update
      fontSize: 18,
      fontFamily: "Arial",
      fill: "#3498db",
      align: "center",
    });
    this.group.add(instruction);

    this.group.getLayer()?.draw(); // Redraw parent layer
  }

  destroy(): void {
    this.group.destroy();
  }
}