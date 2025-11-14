import Konva from "konva";
import type { View } from "../../types";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants";

function makeButton(
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  fill: string,
  onClick: () => void
): Konva.Group {
  const group = new Konva.Group();
  const rect = new Konva.Rect({
    x,
    y,
    width,
    height,
    fill,
    cornerRadius: 8,
    stroke: "#333",
    strokeWidth: 2,
  });
  const label = new Konva.Text({
    x: x + width / 2,
    y: y + height / 2 - 10,
    text,
    fontFamily: "Arial",
    fontSize: 24,
    fill: "white",
    align: "center",
  });
  label.offsetX(label.width() / 2);
  group.add(rect);
  group.add(label);
  group.on("click", onClick);
  return group;
}

export class Game2IntroScreenView implements View {
  private group: Konva.Group;

  constructor(onStart: () => void) {
    this.group = new Konva.Group({ visible: false });

    // Background
    const bg = new Konva.Rect({
      x: 0,
      y: 0,
      width: STAGE_WIDTH,
      height: STAGE_HEIGHT,
      fill: "#AEEEEE",
    });
    this.group.add(bg);

    // Title
    const titleText = new Konva.Text({
      x: STAGE_WIDTH / 2,
      y: 80,
      text: "How to Play",
      fontSize: 48,
      fontFamily: "Arial",
      fill: "#222",
      align: "center",
      fontStyle: "bold",
    });
    titleText.offsetX(titleText.width() / 2);
    this.group.add(titleText);

    // Instructions
    const instructions = [
      "Defeat all the emus to win!",
      "",
      "Controls:",
      "• W, A, S, D - Move",
      "• Spacebar - Shoot",
      "",
      "Avoid obstacles and eliminate all enemies!",
    ];

    let yPos = 200;
    instructions.forEach((instruction) => {
      const text = new Konva.Text({
        x: STAGE_WIDTH / 2,
        y: yPos,
        text: instruction,
        fontSize: instruction.startsWith("•") ? 20 : instruction === "" ? 10 : 24,
        fontFamily: "Arial",
        fill: "#333",
        align: "center",
      });
      text.offsetX(text.width() / 2);
      this.group.add(text);
      yPos += instruction === "" ? 10 : 35;
    });

    // Start Button
    const startBtn = makeButton(
      STAGE_WIDTH / 2 - 100,
      STAGE_HEIGHT - 100,
      200,
      60,
      "Start Game",
      "#2e7d32",
      onStart
    );
    this.group.add(startBtn);
  }

  show(): void {
    this.group.visible(true);
    this.group.getLayer()?.draw();
  }

  hide(): void {
    this.group.visible(false);
    this.group.getLayer()?.draw();
  }

  getGroup(): Konva.Group {
    return this.group;
  }
}

