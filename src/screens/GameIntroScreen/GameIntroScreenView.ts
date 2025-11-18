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

  renderPage(text: string, isLastPage: boolean): void {
    this.layer.destroyChildren(); // Clear previous content

    // Render the page text
    this.textNode = new Konva.Text({
      x: 50,
      y: 50,
      width: this.stage.width() - 100,
      text: text,
      fontSize: 24,
      fontFamily: "Arial",
      fill: "black",
      align: "center",
    });
    this.layer.add(this.textNode);

    // Render the "Start Game" button on the last page
    if (isLastPage) {
      this.startButton = this.createStartButton();
      this.layer.add(this.startButton);
    }

    this.layer.draw();
  }

  private createStartButton(): Konva.Group {
    const buttonGroup = new Konva.Group({
      x: this.stage.width() / 2 - 100,
      y: this.stage.height() - 100,
    });

    const buttonRect = new Konva.Rect({
      width: 200,
      height: 50,
      fill: "green",
      cornerRadius: 10,
    });

    const buttonText = new Konva.Text({
      width: 200,
      height: 50,
      text: "Start Game",
      fontSize: 20,
      fontFamily: "Arial",
      fill: "white",
      align: "center",
      verticalAlign: "middle",
    });

    buttonGroup.add(buttonRect);
    buttonGroup.add(buttonText);

    return buttonGroup;
  }

  onStartButtonClick(callback: () => void): void {
    if (this.startButton) {
      this.startButton.on("click", callback);
    }
  }

  destroy(): void {
    this.layer.destroy();
  }
}