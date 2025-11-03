import Konva from "konva";
import { EmuModel } from "./EmuModel";

export class EmuView {
  private group: Konva.Group;
  private body: Konva.Circle;
  private head: Konva.Circle;
  private neck: Konva.Line;
  private model: EmuModel;

  constructor(model: EmuModel) {
    this.model = model;

    // Create body, neck, and head
    this.body = new Konva.Circle({
      radius: 12,
      fill: "#8B4513",
      stroke: "#654321",
      strokeWidth: 1,
    });
    this.head = new Konva.Circle({
      radius: 6,
      fill: "#8B4513",
      x: 18,
      y: 0,
    });
    this.neck = new Konva.Line({
      points: [0, 0, 18, 0],
      stroke: "#8B4513",
      strokeWidth: 3,
    });

    // Group all parts for easy movement
    this.group = new Konva.Group({ x: model.x, y: model.y });
    this.group.add(this.body);
    this.group.add(this.neck);
    this.group.add(this.head);

    this.update();
  }

  // Adjust head position based on direction
  private updateHeadDirection() {
    switch (this.model.currentDirection) {
      case "up":
        this.head.x(0);
        this.head.y(-18);
        this.neck.points([0, 0, 0, -18]);
        break;
      case "down":
        this.head.x(0);
        this.head.y(18);
        this.neck.points([0, 0, 0, 18]);
        break;
      case "left":
        this.head.x(-18);
        this.head.y(0);
        this.neck.points([0, 0, -18, 0]);
        break;
      case "right":
      default:
        this.head.x(18);
        this.head.y(0);
        this.neck.points([0, 0, 18, 0]);
        break;
    }
  }

  // Update position, visibility, flashing, and head direction
  update() {
    if (this.model.flashTimer > 0) {
      this.model.flashTimer--;
      if (this.model.flashTimer === 0) {
        this.body.fill("#8B4513");
        this.head.fill("#8B4513");
      } else if (this.model.flashTimer % 3 === 0) {
        const flashColor =
          (this.body.fill() as string) === "#8B4513" ? "#FF6B6B" : "#8B4513";
        this.body.fill(flashColor);
        this.head.fill(flashColor);
      }
    }

    this.group.position({ x: this.model.x, y: this.model.y });
    this.group.visible(this.model.active);
    this.updateHeadDirection();
  }

  getGroup() {
    return this.group;
  }
}
