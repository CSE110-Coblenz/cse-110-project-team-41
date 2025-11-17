// src/screens/Game2Screen/Game2ScreenView.ts
import Konva from "konva";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants";

export class HuntingScreenView {
  private group: Konva.Group;
  private hudBanner: Konva.Rect;
  private ammoLabelText: Konva.Text;
  private ammoValueText: Konva.Text;
  private emusLabelText: Konva.Text;
  private emusValueText: Konva.Text;
  private timerText: Konva.Text;

  constructor() {
    this.group = new Konva.Group({ visible: false });

    // HUD Banner - Semi-transparent dark background (outside game area)
    this.hudBanner = new Konva.Rect({
      x: 0,
      y: 0,
      width: STAGE_WIDTH,
      height: 80,
      fill: "rgba(0, 0, 0, 0.6)",
    });
    this.group.add(this.hudBanner);

    // Game background - starts below HUD (dark night theme)
    const bg = new Konva.Rect({
      x: 0,
      y: 80,
      width: STAGE_WIDTH,
      height: STAGE_HEIGHT - 80,
      fill: "#1a3a3f", // Dark teal-blue for night theme
    });
    this.group.add(bg);

    // Ammo (Left side)
    this.ammoLabelText = new Konva.Text({
      x: 30,
      y: 20,
      text: "Ammo",
      fontSize: 20,
      fontFamily: "Arial",
      fill: "#FFEB3B", // Light yellow
    });
    this.group.add(this.ammoLabelText);

    this.ammoValueText = new Konva.Text({
      x: 30,
      y: 45,
      text: "100",
      fontSize: 28,
      fontFamily: "Arial",
      fill: "#FFEB3B", // Light yellow
      fontStyle: "bold",
    });
    this.group.add(this.ammoValueText);

    // Emus Left (Center)
    this.emusLabelText = new Konva.Text({
      x: STAGE_WIDTH / 2,
      y: 20,
      text: "Emus Left",
      fontSize: 20,
      fontFamily: "Arial",
      fill: "#FFEB3B", // Light yellow
      align: "center",
    });
    this.emusLabelText.offsetX(this.emusLabelText.width() / 2);
    this.group.add(this.emusLabelText);

    this.emusValueText = new Konva.Text({
      x: STAGE_WIDTH / 2,
      y: 45,
      text: "0",
      fontSize: 28,
      fontFamily: "Arial",
      fill: "#FFEB3B", // Light yellow
      fontStyle: "bold",
      align: "center",
    });
    this.emusValueText.offsetX(this.emusValueText.width() / 2);
    this.group.add(this.emusValueText);

    // Timer (Right side)
    this.timerText = new Konva.Text({
      x: STAGE_WIDTH - 30,
      y: 32,
      text: "01:45",
      fontSize: 28,
      fontFamily: "Arial",
      fill: "#4FC3F7", // Light blue
      fontStyle: "bold",
      align: "right",
    });
    this.timerText.offsetX(this.timerText.width());
    this.group.add(this.timerText);
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

  updateAmmo(ammo: number) {
    this.ammoValueText.text(ammo.toString());
    this.group.getLayer()?.draw();
  }

  updateDefeat(emusLeft: number) {
    this.emusValueText.text(emusLeft.toString());
    this.emusValueText.offsetX(this.emusValueText.width() / 2);
    this.group.getLayer()?.draw();
  }

  updateTimer(secondsRemaining: number) {
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = Math.floor(secondsRemaining % 60);
    const secondsStr = seconds.toString().padStart(2, "0");
    this.timerText.text(`${minutes.toString().padStart(2, "0")}:${secondsStr}`);
    this.timerText.offsetX(this.timerText.width());
    this.group.getLayer()?.draw();
  }

  batchDraw() {
    this.group.getLayer()?.batchDraw();
  }
}
