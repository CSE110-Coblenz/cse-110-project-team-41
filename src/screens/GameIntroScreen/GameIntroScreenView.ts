import Konva from "konva";

export class GameIntroView {
  private stage: Konva.Stage;
  private layer: Konva.Layer;
  private textNode: Konva.Text | null = null;
  private startButton: Konva.Group | null = null;

  constructor(stage: Konva.Stage) {
    this.stage = stage;
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);
  }

  renderPage(text: string, isLastPage: boolean, currentPage: number, totalPages: number): void {
    this.layer.destroyChildren(); // Clear previous content

    // Add background
    const background = new Konva.Rect({
      x: 0,
      y: 0,
      width: this.stage.width(),
      height: this.stage.height(),
      fill: "#2c3e50",
    });
    this.layer.add(background);

    // Render the page text with larger font
    this.textNode = new Konva.Text({
      x: 60,
      y: 100,
      width: this.stage.width() - 120,
      text: text,
      fontSize: 28,
      fontFamily: "Arial, sans-serif",
      fill: "#ecf0f1",
      align: "center",
      lineHeight: 1.5,
    });
    this.layer.add(this.textNode);

    // Add page indicator
    const pageIndicator = new Konva.Text({
      x: this.stage.width() / 2 - 100,
      y: this.stage.height() - 80,
      width: 200,
      text: `Page ${currentPage + 1} of ${totalPages}`,
      fontSize: 16,
      fontFamily: "Arial",
      fill: "#95a5a6",
      align: "center",
    });
    this.layer.add(pageIndicator);

    // Add "Press SPACEBAR to continue" instruction (on all pages)
    const instruction = new Konva.Text({
      x: this.stage.width() / 2 - 150,
      y: this.stage.height() - 50,
      width: 300,
      text: "Press SPACEBAR to continue",
      fontSize: 18,
      fontFamily: "Arial",
      fill: "#3498db",
      align: "center",
    });
    this.layer.add(instruction);

    this.layer.draw();
  }

  private createStartButton(): Konva.Group {
    const buttonGroup = new Konva.Group({
      x: this.stage.width() / 2 - 120,
      y: this.stage.height() - 120,
    });

    const buttonRect = new Konva.Rect({
      width: 240,
      height: 60,
      fill: "#27ae60",
      cornerRadius: 10,
      shadowColor: "black",
      shadowBlur: 10,
      shadowOffset: { x: 0, y: 5 },
      shadowOpacity: 0.3,
    });

    const buttonText = new Konva.Text({
      width: 240,
      height: 60,
      text: "START GAME",
      fontSize: 24,
      fontFamily: "Arial",
      fontStyle: "bold",
      fill: "white",
      align: "center",
      verticalAlign: "middle",
    });

    buttonGroup.add(buttonRect);
    buttonGroup.add(buttonText);

    // Add hover effect
    buttonGroup.on("mouseenter", () => {
      buttonRect.fill("#2ecc71");
      this.stage.container().style.cursor = "pointer";
      this.layer.draw();
    });

    buttonGroup.on("mouseleave", () => {
      buttonRect.fill("#27ae60");
      this.stage.container().style.cursor = "default";
      this.layer.draw();
    });

    return buttonGroup;
  }

  onStartButtonClick(callback: () => void): void {
    if (this.startButton) {
      this.startButton.on("click tap", callback);
    }
  }

  destroy(): void {
    this.layer.destroy();
  }
}
