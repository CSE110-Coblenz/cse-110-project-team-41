import Konva from "konva";
import { ObstacleModel } from "./ObstacleModel";

export class ObstacleView {
  private shape: Konva.Rect | Konva.Circle;
  constructor(model: ObstacleModel) {
    
    if (model.type === "rock") {
      // Gray rectangle/square for rocks
      this.shape = new Konva.Rect({
        x: model.x,
        y: model.y,
        width: model.w,
        height: model.h,
        fill: "#808080", // Gray
        stroke: "#606060",
        strokeWidth: 2,
      });
    } else {
      // Green circle for bushes
      const radius = Math.min(model.w, model.h) / 2;
      this.shape = new Konva.Circle({
        x: model.x + model.w / 2,
        y: model.y + model.h / 2,
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
