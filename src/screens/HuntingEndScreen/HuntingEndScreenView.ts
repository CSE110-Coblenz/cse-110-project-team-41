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

export class HuntingEndScreenView implements View {
  private group: Konva.Group;
  private titleText: Konva.Text;
  private messageText: Konva.Text;
  private emusKilledText: Konva.Text;

  constructor(onContinue: () => void) {
    this.group = new Konva.Group({ visible: false });

    // Background (light red theme, similar to intro screen's light blue)
    const bg = new Konva.Rect({
      x: 0,
      y: 0,
      width: STAGE_WIDTH,
      height: STAGE_HEIGHT,
      fill: "#EEAEAE", // Light red (equivalent to intro's #AEEEEE light blue)
    });
    this.group.add(bg);

    // Title
    this.titleText = new Konva.Text({
      x: STAGE_WIDTH / 2,
      y: 150,
      text: "GAME OVER!",
      fontSize: 56,
      fontFamily: "Arial",
      fill: "#000", // Darker text
      align: "center",
      fontStyle: "bold",
    });
    this.titleText.offsetX(this.titleText.width() / 2);
    this.group.add(this.titleText);

    // Message Text (reason for game over)
    this.messageText = new Konva.Text({
      x: STAGE_WIDTH / 2,
      y: 230,
      text: "",
      fontSize: 28,
      fontFamily: "Arial",
      fill: "#111", // Darker text
      align: "center",
    });
    this.messageText.offsetX(this.messageText.width() / 2);
    this.group.add(this.messageText);

    // Emus Killed Text
    this.emusKilledText = new Konva.Text({
      x: STAGE_WIDTH / 2,
      y: 300,
      text: "Emus Killed: 0",
      fontSize: 36,
      fontFamily: "Arial",
      fill: "#111", // Darker text
      align: "center",
    });
    this.emusKilledText.offsetX(this.emusKilledText.width() / 2);
    this.group.add(this.emusKilledText);

    // Continue Button
    const continueBtn = makeButton(
      STAGE_WIDTH / 2 - 100,
      STAGE_HEIGHT - 120,
      200,
      60,
      "Continue",
      "#1565c0",
      onContinue
    );
    this.group.add(continueBtn);
  }

  updateEmusKilled(count: number, reason: "ammo" | "time" | "victory"): void {
    // Always show "GAME OVER!" title
    this.titleText.text("GAME OVER!");
    
    // Update message based on reason
    if (reason === "ammo") {
      this.messageText.text("You ran out of ammo!");
    } else if (reason === "time") {
      this.messageText.text("You ran out of time!");
    } else {
      // Victory case - still show GAME OVER but with victory message
      this.messageText.text("All emus defeated!");
    }
    
    this.messageText.offsetX(this.messageText.width() / 2);
    this.titleText.offsetX(this.titleText.width() / 2);
    this.emusKilledText.text(`Emus Killed: ${count}`);
    this.emusKilledText.offsetX(this.emusKilledText.width() / 2);
    this.group.getLayer()?.draw();
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

