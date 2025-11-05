// src/screens/Game2Screen/Game2ScreenView.ts
import Konva from "konva";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants";

export class Game2ScreenView {
  private group: Konva.Group;
  private defeatText: Konva.Text;

  constructor() {
    this.group = new Konva.Group({ visible: false });

    const bg = new Konva.Rect({
      x: 0,
      y: 0,
      width: STAGE_WIDTH,
      height: STAGE_HEIGHT,
      fill: "#AEEEEE",
    });
    this.group.add(bg);

    this.defeatText = new Konva.Text({
      x: 20,
      y: 20,
      text: "Defeat: 0",
      fontSize: 28,
      fill: "black",
    });
    this.group.add(this.defeatText);
  }

  getGroup() {
    return this.group;
  }

  show() {
    this.group.visible(true);
    this.group.getLayer()?.draw();
  }

  hide() {
    this.group.visible(false);
    this.group.getLayer()?.draw();
  }

  updateDefeat(defeat: number) {
    this.defeatText.text(`Defeat: ${defeat}`);
  }

  batchDraw() {
    this.group.getLayer()?.batchDraw();
  }
}
