import Konva from "konva";
import { ObstacleModel } from "./ObstacleModel";

export class ObstacleView {
  private model: ObstacleModel;
  private rect: Konva.Rect;
  constructor(model: ObstacleModel) {
    this.model = model;
    this.rect = new Konva.Rect({
      x: model.x,
      y: model.y,
      width: model.w,
      height: model.h,
      fill: "brown",
      shadowColor: "black",
      shadowBlur: 5,
    });
  }

  getNode() {
    return this.rect;
  }
}
