import Konva from "konva";
import { ObstacleModel } from "./ObstacleModel";

export class ObstacleView {
  private shape: Konva.Rect | Konva.Circle;
  private model: ObstacleModel;
  constructor(model: ObstacleModel) {
    this.model = model;
    if (model.type === "rock") {
      // Gray rectangle/square for rocks
      this.shape = new Konva.Rect({
        x: this.model.x,
        y: this.model.y,
        width: this.model.w,
        height: this.model.h,
        fill: "#808080", // Gray
        stroke: "#606060",
        strokeWidth: 2,
      });
    } else {
      // Green circle for bushes
      const radius = Math.min(this.model.w, this.model.h) / 2;
      this.shape = new Konva.Circle({
        x: this.model.x + this.model.w / 2,
        y: this.model.y + this.model.h / 2,
        radius: radius,
        fill: "#228B22", // Forest green
        stroke: "#006400",
        strokeWidth: 2,
      });
    }
  }

  getNode() {
    return this.shape;
  }
}
