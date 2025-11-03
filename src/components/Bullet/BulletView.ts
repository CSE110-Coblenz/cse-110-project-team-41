import Konva from "konva";
import { BulletModel } from "./BulletModel";

export class BulletView {
  private group: Konva.Group;
  private head: Konva.RegularPolygon;
  private body: Konva.Rect;
  private model: BulletModel;

  constructor(model: BulletModel) {
    this.model = model;
    const angle = this.dirAngle(); // Convert direction to angle

    // Create bullet head (triangle)
    this.head = new Konva.RegularPolygon({
      sides: 3,
      radius: 5,
      fill: "orange",
      rotation: angle - 90,
    });

    // Create bullet body (rectangle)
    this.body = new Konva.Rect({
      width: 8,
      height: 12,
      fill: "yellow",
      offsetY: 6,
      rotation: angle,
    });

    // Group head and body for unified positioning
    this.group = new Konva.Group({ x: model.x, y: model.y });
    this.group.add(this.body);
    this.group.add(this.head);
  }

  // Convert bullet direction to rotation angle
  private dirAngle() {
    return { up: -90, right: 0, down: 90, left: 180 }[this.model.direction];
  }

  // Update bullet’s position and visibility on canvas
  update() {
    this.group.position({ x: this.model.x, y: this.model.y });
    this.group.visible(this.model.active);
  }

  // Return Konva group node for rendering
  getGroup() {
    return this.group;
  }
}
